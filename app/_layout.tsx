// app/_layout.tsx (atualizado para navegação com notificações)
import React, { useEffect, useRef } from 'react';
import { Slot, SplashScreen, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { NotificationService } from '@/services/NotificationServices';
import { AuthProvider } from '@/contexts/AuthContext';
import { TabProvider } from '@/contexts/TabContext';

// Configuração para notificações em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Manter a SplashScreen visível
SplashScreen.preventAutoHideAsync();

// Componente separado para StatusBar que usa useTheme
function StatusBarComponent() {
  const { colors, isDark } = useTheme();
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      animated={true}
      showHideTransition="fade"
      networkActivityIndicatorVisible={false}
      hidden={false}
      translucent={false}
      backgroundColor={isDark? colors.primary : colors.primary}
    />
  );
}

// Função auxiliar para navegação baseada em notificação
function handleNotificationNavigation(data: any) {
  // Verificar se os dados contêm o tipo e ID do report
  if (data && data.type === 'status_update' && data.report_id) {
    console.log(`Navegando para o report ID: ${data.report_id}`);

    // Usar setTimeout para garantir que a navegação ocorra após a inicialização do app
    setTimeout(() => {
      router.push(`/(app)/(tabs)/report/${data.report_id}`);
    }, 500);

    return true;
  }
  return false;
}

// Layout raiz que não depende da verificação de autenticação
export default function RootLayout() {
  // Refs para gerenciar notificações
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Carregar fontes
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // Configurar listeners para notificações
  useEffect(() => {
    // Verificar o status inicial das notificações
    const checkNotificationStatus = async () => {
      const enabled = await NotificationService.areNotificationsEnabled();
      if (enabled) {
        // Se estiver habilitado, registrar o dispositivo
        const token = await NotificationService.registerForPushNotifications();
        if (token) {
          // Opcional: Enviar token para o servidor
          await NotificationService.sendPushTokenToServer(token);
        }
      }
    };

    checkNotificationStatus();

    // Verificar se o app foi aberto por uma notificação (cold start)
    const checkInitialNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          console.log('App aberto por notificação (cold start):', response);
          const data = response.notification.request.content.data;

          if (data) {
            // Tentar navegar baseado nos dados da notificação
            handleNotificationNavigation(data);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar notificação inicial:', error);
      }
    };

    // Executar após um curto atraso para garantir que o app está totalmente inicializado
    setTimeout(() => {
      checkInitialNotification();
    }, 1000);

    // Configurar listeners para notificações recebidas
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida com app aberto:', notification);
      // Aqui você pode adicionar lógica adicional (como mostrar um alerta ou badge)
    });

    // Configurar listeners para resposta a notificações (quando o usuário toca)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuário interagiu com notificação:', response);
      const data = response.notification.request.content.data;

      // Navegar com base nos dados da notificação
      handleNotificationNavigation(data);
    });

    // Limpar listeners ao desmontar
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Mostrar a aplicação quando as fontes estiverem carregadas
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBarComponent />
        <AuthProvider>
          <TabProvider>
            <Slot />
          </TabProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
