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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

function StatusBarComponent() {
  const { colors, isDark } = useTheme();
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      animated={true}
      showHideTransition="fade"
      networkActivityIndicatorVisible={true}
      hidden={false}
      translucent={false}
      backgroundColor={isDark? colors.background : colors.primary}
    />
  );
}

function handleNotificationNavigation(data: any) {
  if (data && data.type === 'status_update' && data.report_id) {
    console.log(`Navegando para o report ID: ${data.report_id}`);

    setTimeout(() => {
      router.push(`/(app)/(tabs)/report/${data.report_id}`);
    }, 500);

    return true;
  }
  return false;
}

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    const checkNotificationStatus = async () => {
      const enabled = await NotificationService.areNotificationsEnabled();
      if (enabled) {
        const token = await NotificationService.registerForPushNotifications();
        if (token) {
          await NotificationService.sendPushTokenToServer(token);
        }
      }
    };

    checkNotificationStatus();

    const checkInitialNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          console.log('App aberto por notificação (cold start):', response);
          const data = response.notification.request.content.data;

          if (data) {
            handleNotificationNavigation(data);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar notificação inicial:', error);
      }
    };

    setTimeout(() => {
      checkInitialNotification();
    }, 1000);

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida com app aberto:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Usuário interagiu com notificação:', response);
      const data = response.notification.request.content.data;

      handleNotificationNavigation(data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

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
