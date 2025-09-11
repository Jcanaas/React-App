// import * as Notifications from 'expo-notifications';
import { ContentData } from '../components/ContentData';
import { watchProgressManager } from './WatchProgressService';

interface SeasonalNotification {
  id: string;
  title: string;
  body: string;
  startDate: { month: number; day: number };
  endDate: { month: number; day: number };
  categories: string[];
  emoji: string;
  priority: 'high' | 'medium' | 'low';
}

class SeasonalNotificationManager {
  private static instance: SeasonalNotificationManager;

  static getInstance(): SeasonalNotificationManager {
    if (!SeasonalNotificationManager.instance) {
      SeasonalNotificationManager.instance = new SeasonalNotificationManager();
    }
    return SeasonalNotificationManager.instance;
  }

  private seasonalEvents: SeasonalNotification[] = [
    // Halloween
    {
      id: 'halloween',
      title: '🎃 ¡Especial Halloween en Jojo-Flix!',
      body: 'Las series más terroríficas te esperan... ¿Te atreves a verlas?',
      startDate: { month: 10, day: 15 }, // 15 de octubre
      endDate: { month: 11, day: 2 },   // 2 de noviembre
      categories: ['Terror', 'Suspenso', 'Thriller'],
      emoji: '🎃',
      priority: 'high'
    },
    
    // Navidad
    {
      id: 'christmas',
      title: '🎄 ¡Magia navideña en Jojo-Flix!',
      body: 'Series familiares y llenas de amor para estas fiestas especiales',
      startDate: { month: 12, day: 1 },  // 1 de diciembre
      endDate: { month: 12, day: 31 },   // 31 de diciembre
      categories: ['Familia', 'Romance', 'Comedia', 'Navidad'],
      emoji: '🎄',
      priority: 'high'
    },
    
    // Día del Orgullo
    {
      id: 'pride',
      title: '🏳️‍🌈 ¡Celebramos la diversidad!',
      body: 'Historias de amor, valentía y autenticidad que inspiran',
      startDate: { month: 6, day: 1 },   // 1 de junio
      endDate: { month: 6, day: 30 },    // 30 de junio
      categories: ['LGTBIQ+', 'Romance', 'Drama'],
      emoji: '🏳️‍🌈',
      priority: 'high'
    },
    
    // San Valentín
    {
      id: 'valentine',
      title: '💕 ¡Romance en el aire!',
      body: 'Las historias de amor más hermosas para compartir',
      startDate: { month: 2, day: 10 },  // 10 de febrero
      endDate: { month: 2, day: 16 },    // 16 de febrero
      categories: ['Romance', 'Drama romántico'],
      emoji: '💕',
      priority: 'medium'
    }
  ];

  // Verificar si estamos en una época especial
  getCurrentSeasonalEvent(): SeasonalNotification | null {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() devuelve 0-11
    const currentDay = today.getDate();

    for (const event of this.seasonalEvents) {
      if (this.isDateInRange(currentMonth, currentDay, event.startDate, event.endDate)) {
        return event;
      }
    }

    return null;
  }

  // Obtener contenido relacionado con la época actual
  async getSeasonalContent(): Promise<any[]> {
    const currentEvent = this.getCurrentSeasonalEvent();
    if (!currentEvent) return [];

    // Filtrar contenido por categorías de la época
    const seasonalContent = ContentData.filter(item => {
      const itemCategories = item.categoria || [];
      return currentEvent.categories.some(category => 
        itemCategories.some(itemCat => 
          itemCat.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(itemCat.toLowerCase())
        )
      );
    });

    return seasonalContent.slice(0, 5); // Máximo 5 sugerencias
  }

  // Programar notificación de contenido para "Continuar viendo"
  async scheduleContinueWatchingNotification(): Promise<void> {
    try {
      const abandonedContent = await watchProgressManager.getAbandonedContent();
      
      if (abandonedContent.length === 0) {
        console.log('No hay contenido abandonado para notificar');
        return;
      }

      // Tomar el contenido con mayor progreso (más probable que quiera continuar)
      const mostProgressedContent = abandonedContent[0];
      
      let title = '⏯️ ¿Continuamos donde lo dejamos?';
      let body = `Te quedaste viendo "${mostProgressedContent.contentTitle}"`;
      
      // Personalizar mensaje según el tipo y progreso
      if (mostProgressedContent.contentType === 'serie' && mostProgressedContent.currentEpisode) {
        body = `¿Continuamos? Te quedaste en el episodio ${mostProgressedContent.currentEpisode} de "${mostProgressedContent.contentTitle}"`;
      } else if (mostProgressedContent.progressPercentage > 0) {
        body = `Tienes "${mostProgressedContent.contentTitle}" al ${mostProgressedContent.progressPercentage}% - ¡Vamos a terminarla!`;
      }

      // Cancelar notificación anterior de continuar viendo
      // await Notifications.cancelScheduledNotificationAsync('continue-watching');

      // Programar nueva notificación
      // await Notifications.scheduleNotificationAsync({
      //   identifier: 'continue-watching',
      //   content: {
      //     title,
      //     body,
      //     data: {
      //       type: 'continue-watching',
      //       contentId: mostProgressedContent.contentId,
      //       screen: 'content-detail'
      //     },
      //     sound: 'default',
      //   },
      //   trigger: {
      //     seconds: 2 * 24 * 60 * 60, // 2 días desde ahora
      //     repeats: false,
      //   },
      // });

      console.log(`Notificación "continuar viendo" programada para: ${mostProgressedContent.contentTitle}`);
    } catch (error) {
      console.error('Error programando notificación de continuar viendo:', error);
    }
  }

  // Programar notificación estacional
  async scheduleSeasonalNotification(): Promise<void> {
    try {
      const currentEvent = this.getCurrentSeasonalEvent();
      if (!currentEvent) {
        console.log('No hay evento estacional activo');
        return;
      }

      const seasonalContent = await this.getSeasonalContent();
      if (seasonalContent.length === 0) {
        console.log('No hay contenido estacional disponible');
        return;
      }

      // Seleccionar contenido aleatorio de la época
      const randomContent = seasonalContent[Math.floor(Math.random() * seasonalContent.length)];
      
      const title = currentEvent.title;
      const body = `${currentEvent.body} Te recomendamos: "${randomContent.nombre}"`;

      // Cancelar notificación estacional anterior
      // await Notifications.cancelScheduledNotificationAsync('seasonal-' + currentEvent.id);

      // Programar notificación estacional
      // await Notifications.scheduleNotificationAsync({
      //   identifier: 'seasonal-' + currentEvent.id,
      //   content: {
      //     title,
      //     body,
      //     data: {
      //       type: 'seasonal',
      //       eventId: currentEvent.id,
      //       contentId: randomContent.id,
      //       screen: 'content-detail'
      //     },
      //     sound: 'default',
      //   },
      //   trigger: {
      //     seconds: 24 * 60 * 60, // 1 día
      //     repeats: false,
      //   },
      // });

      console.log(`Notificación estacional programada: ${currentEvent.id} - ${randomContent.nombre}`);
    } catch (error) {
      console.error('Error programando notificación estacional:', error);
    }
  }

  // Programar múltiples notificaciones de continuar viendo durante la semana
  async scheduleWeeklyContinueWatching(): Promise<void> {
    try {
      const abandonedContent = await watchProgressManager.getAbandonedContent();
      
      if (abandonedContent.length === 0) return;

      // Programar 3 notificaciones durante la semana para diferentes contenidos
      const contentToNotify = abandonedContent.slice(0, 3);
      
      for (let i = 0; i < contentToNotify.length; i++) {
        const content = contentToNotify[i];
        const daysFromNow = (i + 1) * 2; // 2, 4, 6 días
        
        let title = '📺 ¡No olvides tu serie!';
        let body = `"${content.contentTitle}" sigue esperándote`;
        
        if (content.contentType === 'serie' && content.currentEpisode) {
          title = '🔄 ¿Seguimos con la serie?';
          body = `Episodio ${content.currentEpisode} de "${content.contentTitle}" - ¡Continuemos la historia!`;
        }

        // await Notifications.scheduleNotificationAsync({
        //   identifier: `continue-${content.contentId}-${i}`,
        //   content: {
        //     title,
        //     body,
        //     data: {
        //       type: 'continue-watching',
        //       contentId: content.contentId,
        //       screen: 'content-detail'
        //     },
        //     sound: 'default',
        //   },
        //   trigger: {
        //     seconds: daysFromNow * 24 * 60 * 60,
        //     repeats: false,
        //   },
        // });
        
        console.log(`Notificación continuar programada para ${daysFromNow} días: ${content.contentTitle}`);
      }
    } catch (error) {
      console.error('Error programando notificaciones semanales:', error);
    }
  }

  // Método utilitario para verificar si una fecha está en rango
  private isDateInRange(
    currentMonth: number, 
    currentDay: number, 
    startDate: { month: number; day: number }, 
    endDate: { month: number; day: number }
  ): boolean {
    // Manejar rangos que cruzan años (ej: 15 dic - 15 ene)
    if (startDate.month > endDate.month) {
      return (currentMonth > startDate.month || 
              (currentMonth === startDate.month && currentDay >= startDate.day) ||
              currentMonth < endDate.month ||
              (currentMonth === endDate.month && currentDay <= endDate.day));
    }
    
    // Rango normal dentro del mismo año
    if (currentMonth > startDate.month && currentMonth < endDate.month) {
      return true;
    }
    
    if (currentMonth === startDate.month && currentMonth === endDate.month) {
      return currentDay >= startDate.day && currentDay <= endDate.day;
    }
    
    if (currentMonth === startDate.month) {
      return currentDay >= startDate.day;
    }
    
    if (currentMonth === endDate.month) {
      return currentDay <= endDate.day;
    }
    
    return false;
  }

  // Obtener información del evento actual para mostrar en UI
  getCurrentEventInfo(): { 
    event: SeasonalNotification | null; 
    content: any[]; 
    daysLeft: number 
  } | null {
    const event = this.getCurrentSeasonalEvent();
    if (!event) return null;

    // Calcular días restantes del evento
    const today = new Date();
    const endDate = new Date(today.getFullYear(), event.endDate.month - 1, event.endDate.day);
    if (endDate < today) {
      endDate.setFullYear(today.getFullYear() + 1);
    }
    
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      event,
      content: ContentData.filter(item => {
        const itemCategories = item.categoria || [];
        return event.categories.some(category => 
          itemCategories.some(itemCat => 
            itemCat.toLowerCase().includes(category.toLowerCase())
          )
        );
      }).slice(0, 10),
      daysLeft
    };
  }
}

export const seasonalNotificationManager = SeasonalNotificationManager.getInstance();

// Hook para usar notificaciones estacionales
export const useSeasonalNotifications = () => {
  const getCurrentEvent = () => seasonalNotificationManager.getCurrentSeasonalEvent();
  const getSeasonalContent = () => seasonalNotificationManager.getSeasonalContent();
  const scheduleContinueWatching = () => seasonalNotificationManager.scheduleContinueWatchingNotification();
  const scheduleWeeklyContinue = () => seasonalNotificationManager.scheduleWeeklyContinueWatching();
  const scheduleSeasonalNotif = () => seasonalNotificationManager.scheduleSeasonalNotification();
  const getCurrentEventInfo = () => seasonalNotificationManager.getCurrentEventInfo();

  return {
    getCurrentEvent,
    getSeasonalContent,
    scheduleContinueWatching,
    scheduleWeeklyContinue,
    scheduleSeasonalNotif,
    getCurrentEventInfo
  };
};
