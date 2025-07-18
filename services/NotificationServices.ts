// app/services/NotificationService.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Configurar como as notificações serão mostradas quando o app estiver em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Interface para o token
export interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
}

// Chave para salvar o estado no AsyncStorage
const PUSH_NOTIFICATION_ENABLED_KEY = 'push_notification_enabled';

export class NotificationService {
  static async registerForPushNotifications(): Promise<string | undefined> {
    // Verificar se estamos em um dispositivo físico (não funcionará em simuladores/emuladores)
    if (!Device.isDevice) {
      console.log('Push Notifications não funcionam em emuladores/simuladores');
      return undefined;
    }

    // Verificar e solicitar permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Se não temos permissão, solicitar ao utilizador
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Se o utilizador não concedeu permissão, não podemos continuar
    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações não concedida');
      return undefined;
    }

    // Obter o token do Expo para este dispositivo
    const { data: token } = await Notifications.getExpoPushTokenAsync();

    // Para Android, configurar o canal de notificação
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Salva o estado das notificações como ativado
    await AsyncStorage.setItem(PUSH_NOTIFICATION_ENABLED_KEY, 'true');

    // Opcional: Enviar o token para o seu servidor backend
    // await this.sendPushTokenToServer(token);

    return token;
  }

  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(PUSH_NOTIFICATION_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Erro ao verificar status das notificações:', error);
      return false;
    }
  }

  static async setNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(PUSH_NOTIFICATION_ENABLED_KEY, enabled ? 'true' : 'false');

      if (enabled) {
        const token = await this.registerForPushNotifications();
        console.log('Token obtido para reativação:', token);

        if (token) {
          const result = await this.sendPushTokenToServer(token);
          console.log('Resultado do envio do token para reativação:', result);
        }
      } else {
        try {
          const { data: token } = await Notifications.getExpoPushTokenAsync();
          if (token) {
            await this.unregisterPushTokenFromServer(token);
          }
        } catch (tokenError) {
          console.error('Erro ao obter token para desativação:', tokenError);
        }
      }
    } catch (error) {
      console.error('Erro ao definir status das notificações:', error);
      throw error;
    }
  }

  static async sendPushTokenToServer(token: string): Promise<void> {
    const apiUrl = 'https://reporta.up.railway.app/api/notifications/token';

    try {
      const userToken = await AsyncStorage.getItem('token');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          token: token,
          platform: Platform.OS
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Token enviado para o servidor com sucesso');
      } else {
        console.error('Erro ao enviar token para o servidor:', data.message);
      }
    } catch (error) {
      console.error('Erro ao enviar token para o servidor:', error);
    }
  }

  static async unregisterPushTokenFromServer(token: string): Promise<boolean> {
    const apiUrl = 'https://reporta.up.railway.app/api/notifications/token/unregister';

    try {
      const userToken = await AsyncStorage.getItem('token');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          token: token,
          platform: Platform.OS
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Token desativado no servidor com sucesso');
        return true;
      } else {
        console.error('Erro ao desativar token no servidor:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Erro ao desativar token no servidor:', error);
      return false;
    }
  }

  static setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listener para notificações recebidas quando o app está em primeiro plano
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener para quando o utilizador interage com uma notificação
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Resposta de notificação recebida:', response);

      // Navegação baseada no tipo de notificação
      const data = response.notification.request.content.data;

      if (data && data.type === 'status_update' && data.report_id) {
        // Navegar para a página do report
        console.log(`Navegando para o report ID: ${data.report_id}`);
        router.push(`/(app)/(tabs)/report/${data.report_id}`);
      }

      // Também chamar o callback fornecido, se houver
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

    // Configurar manipulador de notificações quando o aplicativo é aberto a partir de uma notificação
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('App aberto a partir de notificação:', response);
        const data = response.notification.request.content.data;

        if (data && data.type === 'status_update' && data.report_id) {
          // Pequeno atraso para garantir que a navegação funcione após a inicialização
          setTimeout(() => {
            console.log(`Navegando para o report ID: ${data.report_id}`);
            router.push(`/(app)/(tabs)/report/${data.report_id}`);
          }, 1000);
        }
      }
    });

    // Retorna uma função para remover os listeners quando não forem mais necessários
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }
}
