import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const useAudioNotifications = () => {
  const {
    currentTrack,
    currentContent,
    isPlaying,
    playPause,
    nextTrack,
    previousTrack,
    stop
  } = useAudioPlayer();

  useEffect(() => {
    // Configurar la sesión de audio para notificaciones
    const configureAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error configurando sesión de audio:', error);
      }
    };

    configureAudioSession();

    // Listener para las acciones de notificación
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const action = response.actionIdentifier;
      
      switch (action) {
        case 'play_pause':
          playPause();
          break;
        case 'next':
          nextTrack();
          break;
        case 'previous':
          previousTrack();
          break;
        case 'stop':
          stop();
          break;
        default:
          break;
      }
    });

    return () => subscription.remove();
  }, [playPause, nextTrack, previousTrack, stop]);

  useEffect(() => {
    if (currentTrack && currentContent) {
      updateNotification();
    } else {
      clearNotification();
    }
  }, [currentTrack, currentContent, isPlaying]);

  const updateNotification = async () => {
    if (!currentTrack || !currentContent) return;

    try {
      // Cancelar notificaciones anteriores
      await Notifications.dismissAllNotificationsAsync();

      // Crear nueva notificación
      await Notifications.scheduleNotificationAsync({
        content: {
          title: currentTrack.title,
          body: `${currentContent.nombre} • ${isPlaying ? 'Reproduciendo' : 'Pausado'}`,
          data: {
            type: 'audio_player',
            track: currentTrack.title,
            content: currentContent.nombre
          },
          categoryIdentifier: 'AUDIO_PLAYER',
          sound: false, // No sonido para evitar interferir con la música
        },
        trigger: null, // Mostrar inmediatamente
      });
    } catch (error) {
      console.error('Error mostrando notificación:', error);
    }
  };

  const clearNotification = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
    }
  };

  // Función para configurar las categorías de notificación
  const setupNotificationCategories = async () => {
    try {
      await Notifications.setNotificationCategoryAsync('AUDIO_PLAYER', [
        {
          identifier: 'previous',
          buttonTitle: '⏮️',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'play_pause',
          buttonTitle: isPlaying ? '⏸️' : '▶️',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'next',
          buttonTitle: '⏭️',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'stop',
          buttonTitle: '⏹️',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Error configurando categorías de notificación:', error);
    }
  };

  useEffect(() => {
    setupNotificationCategories();
  }, [isPlaying]);

  return {
    updateNotification,
    clearNotification,
  };
};

export default useAudioNotifications;