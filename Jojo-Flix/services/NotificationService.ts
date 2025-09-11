import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ContentData } from '../components/ContentData';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationService {
  setupNotifications: () => Promise<string | null>;
  scheduleInactivityReminder: () => Promise<void>;
  scheduleFavoriteContentReminder: () => Promise<void>;
  scheduleNewContentNotification: () => Promise<void>;
  scheduleWeeklyRecap: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  updateLastActivity: () => Promise<void>;
}

class NotificationManager implements NotificationService {
  private static instance: NotificationManager;
  private expoPushToken: string | null = null;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async setupNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Las notificaciones push no funcionan en simulador');
        return null;
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permisos de notificación denegados');
        return null;
      }

      // Obtener token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'aab100de-d67a-45e5-a14d-7f76202b65a6', // Tu Project ID de EAS
      });

      this.expoPushToken = token.data;

      // Configurar canal para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Jojo-Flix',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#DF2892',
          sound: 'default',
        });
      }

      // Programar notificaciones iniciales
      await this.scheduleAllNotifications();

      return this.expoPushToken;
    } catch (error) {
      console.error('Error configurando notificaciones:', error);
      return null;
    }
  }

  async updateLastActivity(): Promise<void> {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('lastActivity', now);
  }

  private async getLastActivity(): Promise<Date> {
    const lastActivity = await AsyncStorage.getItem('lastActivity');
    return lastActivity ? new Date(lastActivity) : new Date();
  }

  private async getFavoriteContent(): Promise<any[]> {
    try {
      const favorites = await AsyncStorage.getItem('favoriteContent');
      return favorites ? JSON.parse(favorites) : [];
    } catch {
      return [];
    }
  }

  private getRandomFavorite(favorites: any[]): any | null {
    if (favorites.length === 0) return null;
    return favorites[Math.floor(Math.random() * favorites.length)];
  }

  async scheduleInactivityReminder(): Promise<void> {
    try {
      // Cancelar notificación anterior de inactividad
      await Notifications.cancelScheduledNotificationAsync('inactivity-reminder');

      const favorites = await this.getFavoriteContent();
      const randomFavorite = this.getRandomFavorite(favorites);

      let title = "¡Te echamos de menos! 🎬";
      let body = "Han pasado 3 días... ¿Qué tal si vemos algo juntos?";

      if (randomFavorite) {
        title = `¿Sigues con ${randomFavorite.title}? 🍿`;
        body = `Han pasado 3 días desde tu última visita. ¡${randomFavorite.title} te está esperando!`;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: 'inactivity-reminder',
        content: {
          title,
          body,
          data: { 
            type: 'inactivity',
            contentId: randomFavorite?.id,
            screen: 'home'
          },
          sound: 'default',
        },
        trigger: {
          seconds: 3 * 24 * 60 * 60, // 3 días
          repeats: false,
        },
      });

      console.log('Notificación de inactividad programada para 3 días');
    } catch (error) {
      console.error('Error programando notificación de inactividad:', error);
    }
  }

  async scheduleFavoriteContentReminder(): Promise<void> {
    try {
      const favorites = await this.getFavoriteContent();
      
      if (favorites.length === 0) return;

      const randomFavorite = this.getRandomFavorite(favorites);
      
      if (!randomFavorite) return;

      await Notifications.scheduleNotificationAsync({
        identifier: 'favorite-reminder',
        content: {
          title: `¡${randomFavorite.title} te llama! 📺`,
          body: "Es el momento perfecto para continuar viendo tu serie favorita",
          data: { 
            type: 'favorite',
            contentId: randomFavorite.id,
            screen: 'content-detail'
          },
          sound: 'default',
        },
        trigger: {
          seconds: 7 * 24 * 60 * 60, // 1 semana
          repeats: true,
        },
      });

      console.log('Notificación de favoritos programada');
    } catch (error) {
      console.error('Error programando notificación de favoritos:', error);
    }
  }

  async scheduleNewContentNotification(): Promise<void> {
    try {
      // Simular contenido nuevo (en una app real vendría del servidor)
      const newContent = ContentData[Math.floor(Math.random() * ContentData.length)];

      await Notifications.scheduleNotificationAsync({
        identifier: 'new-content',
        content: {
          title: "¡Contenido nuevo disponible! 🆕",
          body: `Acabamos de añadir "${newContent.nombre}" a Jojo-Flix`,
          data: { 
            type: 'new-content',
            contentId: newContent.id,
            screen: 'content-detail'
          },
          sound: 'default',
        },
        trigger: {
          seconds: 14 * 24 * 60 * 60, // 2 semanas
          repeats: true,
        },
      });

      console.log('Notificación de contenido nuevo programada');
    } catch (error) {
      console.error('Error programando notificación de contenido nuevo:', error);
    }
  }

  async scheduleWeeklyRecap(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: 'weekly-recap',
        content: {
          title: "Tu resumen semanal 📊",
          body: "¡Mira qué has estado viendo esta semana en Jojo-Flix!",
          data: { 
            type: 'weekly-recap',
            screen: 'home'
          },
          sound: 'default',
        },
        trigger: {
          weekday: 7, // Domingo
          hour: 19,   // 7 PM
          minute: 0,
          repeats: true,
        },
      });

      console.log('Notificación semanal programada para domingos a las 7 PM');
    } catch (error) {
      console.error('Error programando notificación semanal:', error);
    }
  }

  private async scheduleAllNotifications(): Promise<void> {
    await this.scheduleInactivityReminder();
    await this.scheduleFavoriteContentReminder();
    await this.scheduleNewContentNotification();
    await this.scheduleWeeklyRecap();
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Todas las notificaciones canceladas');
  }

  // Método para reprogramar cuando el usuario vuelve a usar la app
  async rescheduleAfterActivity(): Promise<void> {
    await this.updateLastActivity();
    
    // Cancelar y reprogramar la notificación de inactividad
    await Notifications.cancelScheduledNotificationAsync('inactivity-reminder');
    await this.scheduleInactivityReminder();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export { NotificationManager };
export default NotificationManager.getInstance();

// Hook para usar el servicio de notificaciones
export const useNotifications = () => {
  const setupNotifications = () => notificationService.setupNotifications();
  const updateActivity = () => notificationService.rescheduleAfterActivity();
  const cancelAll = () => notificationService.cancelAllNotifications();

  return {
    setupNotifications,
    updateActivity,
    cancelAll,
    getToken: () => notificationService.getExpoPushToken(),
  };
};
