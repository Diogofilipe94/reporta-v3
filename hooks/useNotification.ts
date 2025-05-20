// app/hooks/useNotification.ts
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService, PushNotificationState } from '@/services/NotificationServices';

export default function useNotification() {
  const [pushNotificationState, setPushNotificationState] = useState<PushNotificationState>({});
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
            setPushNotificationState(prev => ({ ...prev, expoPushToken: token }));
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
      (notification) => {
        setPushNotificationState(prev => ({ ...prev, notification }));
      },
      // Quando o usuário interage com uma notificação
      (response) => {
        // Aqui você pode adicionar lógica para navegar para uma tela específica
        // com base no conteúdo da notificação
        console.log('Notificação interagida:', response);
      }
    );

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
        const token = await NotificationService.registerForPushNotifications();
        if (token) {
          setPushNotificationState(prev => ({ ...prev, expoPushToken: token }));
        }
      } else {
        // Desativar o token localmente também
        setPushNotificationState(prev => ({ ...prev, expoPushToken: undefined }));
      }
    } catch (error) {
      console.error('Erro ao alternar notificações:', error);
      // Voltar ao estado anterior em caso de erro
      setIsEnabled(prev => prev);
      // Opcional: adicione feedback ao usuário aqui (toast, alert, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pushToken: pushNotificationState.expoPushToken,
    lastNotification: pushNotificationState.notification,
    isEnabled,
    isLoading,
    toggleNotifications
  };
}
