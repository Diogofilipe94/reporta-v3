// app/hooks/useNotification.ts
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { NotificationService, PushNotificationState } from '@/services/NotificationServices';

export default function useNotification() {
  const [pushNotificationState, setPushNotificationState] = useState<PushNotificationState>({});
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastNotificationData, setLastNotificationData] = useState<any>(null);

  // Buscar o status inicial das notificações
  useEffect(() => {
    const loadNotificationStatus = async () => {
      try {
        setIsLoading(true);
        const enabled = await NotificationService.areNotificationsEnabled();
        setIsEnabled(enabled);

        if (enabled) {
          const token = await NotificationService.registerForPushNotifications();
          if (token) {
            setPushNotificationState((prev: PushNotificationState) => ({ ...prev, expoPushToken: token }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar status das notificações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotificationStatus();
  }, []);

  // Configurar listeners para notificações
  useEffect(() => {
    const cleanup = NotificationService.setupNotificationListeners(
      // Quando uma notificação é recebida enquanto o app está aberto
      (notification: Notifications.Notification) => {
        console.log('Notificação recebida com app aberto:', notification);
        setPushNotificationState(prev => ({ ...prev, notification }));

        // Armazenar dados da notificação para uso posterior
        const data = notification.request.content.data;
        if (data) {
          setLastNotificationData(data);
        }
      },

      // Quando o utilizador interage com uma notificação
      (response) => {
        console.log('utilizador interagiu com notificação:', response);
        const data = response.notification.request.content.data;

        if (data) {
          setLastNotificationData(data);

          // Navegar para a página do report se for uma atualização de status
          if (data.type === 'status_update' && data.report_id) {
            console.log(`Navegando para o report ID: ${data.report_id}`);
            router.push(`/(app)/(tabs)/report/${data.report_id}`);
          }
        }
      }
    );

    // Verificar se o app foi aberto por uma notificação (cold start)
    const checkInitialNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          console.log('App aberto por notificação (cold start):', response);
          const data = response.notification.request.content.data;

          if (data) {
            setLastNotificationData(data);

            // Pequeno atraso para garantir que a navegação funcione após inicialização
            setTimeout(() => {
              if (data.type === 'status_update' && data.report_id) {
                console.log(`Navegando para o report ID: ${data.report_id} (cold start)`);
                router.push(`/(app)/(tabs)/report/${data.report_id}`);
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar notificação inicial:', error);
      }
    };

    checkInitialNotification();

    // Limpar os listeners quando o componente for desmontado
    return cleanup;
  }, []);

  // Função para alternar o status das notificações
  const toggleNotifications = async () => {
    try {
      setIsLoading(true);
      const newValue = !isEnabled;

      await NotificationService.setNotificationsEnabled(newValue);
      setIsEnabled(newValue);

      if (newValue) {
        // Registrar e obter novo token quando ativar
        const token = await NotificationService.registerForPushNotifications();
        if (token) {
          console.log('Novo token obtido após ativação:', token);
          setPushNotificationState(prev => ({ ...prev, expoPushToken: token }));
        }
      } else {
        // Quando desativar, limpar o token do estado
        const currentToken = pushNotificationState.expoPushToken;
        if (currentToken) {
          console.log('Desativando token:', currentToken);
          // O desregistro do token no servidor acontece em NotificationService.setNotificationsEnabled
        }
        setPushNotificationState(prev => ({ ...prev, expoPushToken: undefined }));
      }
    } catch (error) {
      console.error('Erro ao alternar notificações:', error);
      // Manter estado anterior em caso de erro
      setIsEnabled(prev => prev);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar uma notificação de teste (útil para desenvolvimento)
  const sendTestNotification = async (reportId: number) => {
    if (!pushNotificationState.expoPushToken) {
      console.error('Não há token de notificação disponível');
      return false;
    }

    try {
      const message = {
        to: pushNotificationState.expoPushToken,
        sound: 'default',
        title: 'Teste de Notificação',
        body: 'Toque para ver o report',
        data: {
          type: 'status_update',
          report_id: reportId
        },
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      return false;
    }
  };

  return {
    pushToken: pushNotificationState.expoPushToken,
    lastNotification: pushNotificationState.notification,
    lastNotificationData,
    isEnabled,
    isLoading,
    toggleNotifications,
  };
}
