// app/services/NotificationService.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  // Registrar para receber notificações push
  static async registerForPushNotifications(): Promise<string | undefined> {
    // Verificar se estamos em um dispositivo físico (não funcionará em simuladores/emuladores)
    if (!Device.isDevice) {
      console.log('Push Notifications não funcionam em emuladores/simuladores');
      return undefined;
    }

    // Verificar e solicitar permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Se não temos permissão, solicitar ao usuário
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Se o usuário não concedeu permissão, não podemos continuar
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

  // Verifica se as notificações estão habilitadas
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(PUSH_NOTIFICATION_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Erro ao verificar status das notificações:', error);
      return false;
    }
  }

  // Habilitar ou desabilitar notificações
  static async setNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await this.registerForPushNotifications();
      } else {
        await AsyncStorage.setItem(PUSH_NOTIFICATION_ENABLED_KEY, 'false');
      }
    } catch (error) {
      console.error('Erro ao definir status das notificações:', error);
    }
  }

  // Enviar o token para o servidor (implemente conforme sua API)
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

  // Configurar os listeners para notificações recebidas e clicadas
  static setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listener para notificações recebidas quando o app está em primeiro plano
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener para quando o usuário interage com uma notificação
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

    // Retorna uma função para remover os listeners quando não forem mais necessários
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }
}
