import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { unreadMessagesService, UnreadCount } from '../services/UnreadMessagesService';
import NotificationManager from '../services/NotificationService';

interface NotificationContextType {
  totalUnreadCount: number;
  unreadByChat: UnreadCount[];
  refreshUnreadCounts: () => void;
  markChatAsRead: (chatId: string) => Promise<void>;
  showNewMessageNotifications: (unreadDetails: UnreadCount[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadByChat, setUnreadByChat] = useState<UnreadCount[]>([]);
  const [lastAppState, setLastAppState] = useState<AppStateStatus>(AppState.currentState);
  const [hasShownInitialNotifications, setHasShownInitialNotifications] = useState(false);

  // Configurar listeners cuando el componente se monta
  useEffect(() => {
    let unsubscribeTotal: (() => void) | undefined;
    let unsubscribeDetails: (() => void) | undefined;

    const setupListeners = () => {
      // Listener para el contador total
      unsubscribeTotal = unreadMessagesService.getTotalUnreadCount((count) => {
        console.log('📊 Total mensajes no leídos:', count);
        setTotalUnreadCount(count);
      });

      // Listener para detalles por chat
      unsubscribeDetails = unreadMessagesService.getUnreadDetailsByChat((details) => {
        console.log('📋 Detalles por chat:', details);
        setUnreadByChat(details);
        
        // Mostrar notificaciones solo después del primer load
        if (hasShownInitialNotifications && details.length > 0) {
          showNewMessageNotifications(details);
        }
      });
    };

    setupListeners();

    // Marcar que ya se han mostrado las notificaciones iniciales
    const timer = setTimeout(() => {
      setHasShownInitialNotifications(true);
    }, 2000); // Esperar 2 segundos antes de permitir notificaciones

    return () => {
      unsubscribeTotal?.();
      unsubscribeDetails?.();
      clearTimeout(timer);
    };
  }, [hasShownInitialNotifications]);

  // Manejar cambios de estado de la app
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('🔄 App state cambió de', lastAppState, 'a', nextAppState);

      // Cuando la app vuelve al primer plano
      if (lastAppState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App volvió al primer plano - verificando mensajes nuevos');
        
        // Verificar mensajes nuevos y mostrar notificaciones
        try {
          const newMessages = await unreadMessagesService.checkForNewMessagesOnAppOpen();
          if (newMessages.length > 0) {
            console.log('🔔 Mensajes nuevos encontrados:', newMessages.length);
            
            // Mostrar notificación de resumen en lugar de individuales
            const totalUnread = newMessages.reduce((sum, chat) => sum + chat.count, 0);
            const chatSummary = newMessages.map(chat => ({
              senderName: chat.lastSenderName || 'Usuario',
              count: chat.count
            }));

            NotificationManager.showUnreadSummaryNotification(totalUnread, chatSummary);
          }
        } catch (error) {
          console.error('❌ Error verificando mensajes al abrir app:', error);
        }

        // Actualizar actividad en el servicio de notificaciones
        NotificationManager.rescheduleAfterActivity();
      }

      setLastAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [lastAppState]);

  const refreshUnreadCounts = () => {
    // Los listeners se actualizan automáticamente
    console.log('🔄 Refrescando contadores de mensajes no leídos');
  };

  const markChatAsRead = async (chatId: string) => {
    try {
      await unreadMessagesService.markChatAsRead(chatId);
      console.log('✅ Chat marcado como leído:', chatId);
    } catch (error) {
      console.error('❌ Error marcando chat como leído:', error);
    }
  };

  const showNewMessageNotifications = (unreadDetails: UnreadCount[]) => {
    unreadDetails.forEach((chatUnread) => {
      if (chatUnread.count > 0 && chatUnread.lastSenderName && chatUnread.lastMessage) {
        NotificationManager.showMessageNotification(
          chatUnread.lastSenderName,
          chatUnread.lastMessage,
          chatUnread.chatId
        );
      }
    });
  };

  const value: NotificationContextType = {
    totalUnreadCount,
    unreadByChat,
    refreshUnreadCounts,
    markChatAsRead,
    showNewMessageNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext debe usarse dentro de NotificationProvider');
  }
  return context;
};
