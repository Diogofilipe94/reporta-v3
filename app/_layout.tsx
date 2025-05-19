// app/index.tsx (atualizado para configurar notificações no app)
import React, { useEffect, useRef } from 'react';
import { Slot, SplashScreen } from 'expo-router';
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

// Layout raiz que não depende da verificação de autenticação
export default function RootLayout() {
  // Refs para gerenciar notificações
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

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

    // Configurar listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
      // Você pode adicionar lógica adicional aqui
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Resposta da notificação:', response);
      // Aqui você pode adicionar lógica de navegação com base na notificação
      // Por exemplo, redirecionar o usuário para uma tela específica
    });

    // Limpar listeners ao desmontar
    return () => {
      if (notificationListener.current) {
        notificationListener.current?.remove();
      }
      if (responseListener.current) {
        responseListener.current?.remove();
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
