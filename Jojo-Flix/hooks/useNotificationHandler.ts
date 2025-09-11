import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
// import * as Notifications from 'expo-notifications';
// import { notificationService } from '../services/NotificationService';

export const useNotificationHandler = () => {
  const router = useRouter();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Listener para notificaciones recibidas mientras la app está abierta
    // notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    //   console.log('Notificación recibida:', notification);
    //   // Aquí puedes mostrar una notificación in-app o actualizar la UI
    // });

    // Listener para cuando el usuario toca una notificación
    // responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    //   console.log('Usuario tocó notificación:', response);
    //   
    //   const { screen, contentId, type } = response.notification.request.content.data || {};
    //   
    //   // Navegar según el tipo de notificación
    //   switch (type) {
    //     case 'inactivity':
    //     case 'weekly-recap':
    //       router.push('/(tabs)/');
    //       break;
    //     case 'favorite':
    //     case 'new-content':
    //       if (contentId) {
    //         router.push({ 
    //           pathname: '/content-detail-screen', 
    //           params: { contentId } 
    //         });
    //       } else {
    //         router.push('/(tabs)/');
    //       }
    //       break;
    //     default:
    //       router.push('/(tabs)/');
    //   }
    //   
    //   // Actualizar actividad del usuario
    //   notificationService.rescheduleAfterActivity();
    // });

    console.log('Notification handlers ready');

    return () => {
      // if (notificationListener.current) {
      //   Notifications.removeNotificationSubscription(notificationListener.current);
      // }
      // if (responseListener.current) {
      //   Notifications.removeNotificationSubscription(responseListener.current);
      // }
    };
  }, [router]);

  return {
    // Funciones para testing sin las dependencias instaladas
    simulateNotificationTap: (type: string, contentId?: string) => {
      console.log(`Simulando notificación: ${type}, contentId: ${contentId}`);
      
      switch (type) {
        case 'inactivity':
        case 'weekly-recap':
          router.push('/');
          break;
        case 'favorite':
        case 'new-content':
          if (contentId) {
            router.push({ 
              pathname: '/content-detail-screen', 
              params: { contentId } 
            });
          } else {
            router.push('/');
          }
          break;
        default:
          router.push('/');
      }
    }
  };
};
