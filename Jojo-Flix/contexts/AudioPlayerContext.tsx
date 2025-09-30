import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SoundtrackItem, ContentItem } from '../components/ContentData';
import { userProgressService } from '../services/UserProgressService';
import { auth } from '../components/firebaseConfig';
import StatsLogger from '../utils/statsLogger';

// Configurar el comportamiento de las notificaciones para media
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Configurar canales de notificación para Android
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('music-channel', {
    name: 'Reproductor de Música',
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
    vibrationPattern: [0],
    lightColor: '#DF2892',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
}

interface AudioPlayerState {
  // Estado del reproductor
  sound: Audio.Sound | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  isSliding: boolean;
  
  // Información de la canción actual
  currentTrack: SoundtrackItem | null;
  currentContent: ContentItem | null;
  playlist: SoundtrackItem[];
  currentIndex: number;
  
  // Estado de la interfaz
  isPlayerVisible: boolean;
}

interface AudioPlayerActions {
  // Controles básicos
  playPause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  
  // Navegación de playlist
  playTrack: (track: SoundtrackItem, content: ContentItem, playlist: SoundtrackItem[], index: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  
  // Control de estado
  setSliding: (sliding: boolean) => void;
  setPosition: (position: number) => void;
  showPlayer: () => void;
  hidePlayer: () => void;
  
  // Limpieza
  cleanup: () => Promise<void>;
}

type AudioPlayerContextType = AudioPlayerState & AudioPlayerActions;

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
};

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  // Estado del reproductor
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  
  // Estado de la playlist
  const [currentTrack, setCurrentTrack] = useState<SoundtrackItem | null>(null);
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null);
  const [playlist, setPlaylist] = useState<SoundtrackItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Estado de la interfaz
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  
  // Referencias
  const statusUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const isLoadingTrack = useRef(false); // Evitar cargas múltiples
  const currentSoundRef = useRef<Audio.Sound | null>(null); // Referencia inmutable al sonido actual
  const lastTrackChangeTime = useRef<number>(0); // Para debouncing
  
  // 🎮 GAMIFICACIÓN: Referencias para tracking de tiempo de música
  const musicTimeTracker = useRef<{
    lastUpdateTime: number;
    accumulatedTime: number; // tiempo acumulado en segundos
    lastSentTime: number; // último tiempo enviado para evitar envíos duplicados
  }>({
    lastUpdateTime: 0,
    accumulatedTime: 0,
    lastSentTime: 0
  });

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Función para limpiar completamente el audio actual
  const stopAndCleanAudio = async () => {
    const promises = [];
    
    // Limpiar desde state
    if (sound) {
      promises.push(
        sound.stopAsync().catch(console.error),
        sound.unloadAsync().catch(console.error)
      );
    }
    
    // Limpiar desde ref (por si acaso)
    if (currentSoundRef.current && currentSoundRef.current !== sound) {
      promises.push(
        currentSoundRef.current.stopAsync().catch(console.error),
        currentSoundRef.current.unloadAsync().catch(console.error)
      );
    }
    
    // Esperar a que todas las limpiezas terminen
    await Promise.all(promises);
    
    // Reset de referencias y estado
    setSound(null);
    currentSoundRef.current = null;
    setIsPlaying(false);
    setPosition(0);
    
    console.log('Audio completamente limpiado');
  };

  // Configurar notificaciones cuando cambie el estado
  useEffect(() => {
    if (currentTrack && currentContent) {
      updateNotification();
    } else {
      clearNotification();
    }
  }, [currentTrack, currentContent, isPlaying]);

  // Listener para las acciones de notificación
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const action = response.actionIdentifier;
      console.log('🎵 Acción de notificación recibida:', action);
      
      switch (action) {
        case 'TOGGLE_PLAYBACK':
          playPause();
          break;
        case 'NEXT_TRACK':
          nextTrack();
          break;
        case 'PREVIOUS_TRACK':
          previousTrack();
          break;
        default:
          console.log('🎵 Acción no reconocida:', action);
          break;
      }
    });

    return () => subscription.remove();
  }, []);

  // Configurar categorías de notificación multimedia
  const setupNotificationCategories = async () => {
    try {
      // Crear categoría con acciones específicas para media
      await Notifications.setNotificationCategoryAsync('MEDIA_PLAYER', [
        {
          identifier: 'PREVIOUS_TRACK',
          buttonTitle: '⏮️ Anterior',
          options: {
            opensAppToForeground: false,
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'TOGGLE_PLAYBACK',
          buttonTitle: isPlaying ? '⏸️ Pausar' : '▶️ Reproducir',
          options: {
            opensAppToForeground: false,
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
        {
          identifier: 'NEXT_TRACK',
          buttonTitle: '⏭️ Siguiente',
          options: {
            opensAppToForeground: false,
            isDestructive: false,
            isAuthenticationRequired: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Error configurando categorías de notificación:', error);
    }
  };

  // Actualizar notificación
  const updateNotification = async () => {
    if (!currentTrack || !currentContent) return;

    try {
      await setupNotificationCategories();
      await Notifications.dismissAllNotificationsAsync();

      // Preparar la imagen del álbum
      let albumArtUrl = null;
      if (currentContent.verticalbanner) {
        albumArtUrl = typeof currentContent.verticalbanner === 'string' 
          ? currentContent.verticalbanner 
          : currentContent.verticalbanner.uri || null;
      }

      console.log('🖼️ Album art URL:', albumArtUrl);

      // Crear notificación multimedia simplificada
      const notificationContent: any = {
        title: currentTrack.title,
        body: currentContent.nombre,
        subtitle: isPlaying ? '🎵 Reproduciendo' : '⏸️ Pausado',
        categoryIdentifier: 'MEDIA_PLAYER',
        sound: false,
        sticky: true,
        priority: 'high' as const,
        color: '#DF2892',
        badge: 0,
        data: {
          type: 'multimedia',
          track: currentTrack.title,
          artist: currentContent.nombre,
          isPlaying: isPlaying,
          albumArt: albumArtUrl,
        },
      };

      // Configuración específica por plataforma
      if (Platform.OS === 'android') {
        notificationContent.channelId = 'music-channel';
      } else if (Platform.OS === 'ios' && albumArtUrl) {
        // iOS: usar attachments para mostrar imagen
        notificationContent.attachments = [{
          type: 'UNNotificationAttachmentTypeImage',
          identifier: 'album-artwork',
          url: albumArtUrl,
          typeHint: 'public.jpeg',
        }];
      }

      console.log('📱 Enviando notificación multimedia:', {
        title: notificationContent.title,
        hasImage: !!albumArtUrl,
        platform: Platform.OS,
      });

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
        identifier: 'multimedia-notification',
      });
    } catch (error) {
      console.error('Error mostrando notificación:', error);
    }
  };

  // Limpiar notificaciones
  const clearNotification = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
    }
  };

  // Configurar audio
  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error configurando audio:', error);
    }
  };

  // Callback de estado de reproducción
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (!isSliding) {
        setPosition(status.positionMillis || 0);
      }
      
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }
      
      setIsPlaying(status.isPlaying);
      
      // 🎮 GAMIFICACIÓN: Trackear tiempo de música cuando está reproduciéndose
      if (status.isPlaying && auth.currentUser) {
        const now = Date.now();
        
        // Si es la primera vez o se reanudó la reproducción
        if (musicTimeTracker.current.lastUpdateTime === 0) {
          musicTimeTracker.current.lastUpdateTime = now;
        }
        
        // Calcular tiempo transcurrido desde la última actualización
        const timeDiff = (now - musicTimeTracker.current.lastUpdateTime) / 1000; // en segundos
        
        // Solo contar si es un intervalo razonable (entre 0.5 y 2 segundos)
        if (timeDiff >= 0.5 && timeDiff <= 2) {
          musicTimeTracker.current.accumulatedTime += timeDiff;
          
          // Enviar estadísticas cada 5 minutos (300 segundos)
          const totalMinutesAccumulated = Math.floor(musicTimeTracker.current.accumulatedTime / 60);
          const blocksOf5Minutes = Math.floor(totalMinutesAccumulated / 5);
          const blocksSent = Math.floor(musicTimeTracker.current.lastSentTime / 5);
          
          // Log del progreso actual
          StatsLogger.logProgress('music', musicTimeTracker.current.accumulatedTime, (blocksSent + 1) * 5);
          
          if (blocksOf5Minutes > blocksSent) {
            const minutesToSend = (blocksOf5Minutes - blocksSent) * 5;
            
            // Solo enviar si son minutos válidos (múltiplos de 5 y no excesivos)
            if (minutesToSend >= 5 && minutesToSend <= 30) {
              // Enviar de manera asíncrona sin bloquear la UI
              userProgressService.incrementStat(auth.currentUser.uid, 'totalMusicTime', minutesToSend)
                .then(() => {
                  StatsLogger.logMusicTime(minutesToSend, auth.currentUser!.uid, blocksOf5Minutes);
                  musicTimeTracker.current.lastSentTime = blocksOf5Minutes * 5;
                })
                .catch((error: any) => {
                  console.error('⚠️ Error actualizando tiempo de música:', error);
                });
            } else {
              console.warn(`⚠️ Minutos de música inválidos: ${minutesToSend}, ignorando`);
            }
          }
        }
        
        musicTimeTracker.current.lastUpdateTime = now;
      } else {
        // Pausado o detenido, resetear el tiempo de última actualización
        musicTimeTracker.current.lastUpdateTime = 0;
      }
      
      // Si la canción terminó, pasar a la siguiente automáticamente
      if (status.didJustFinish && playlist.length > 0) {
        console.log('Canción terminada, pasando a la siguiente...');
        // Usar setTimeout para evitar problemas de timing
        setTimeout(() => {
          nextTrack();
        }, 100);
      }
    }
  };

  // Cargar y reproducir una canción
  const playTrack = async (track: SoundtrackItem, content: ContentItem, trackPlaylist: SoundtrackItem[], index: number) => {
    // Evitar cargas múltiples simultáneas
    if (isLoadingTrack.current) {
      console.log('Ya se está cargando otra canción, omitiendo...');
      return;
    }
    
    isLoadingTrack.current = true;
    setIsLoading(true);
    
    console.log(`🎵 Iniciando carga: ${track.title} (${index + 1}/${trackPlaylist.length})`);
    
    try {
      // PASO 1: Limpieza completa del audio anterior
      console.log('🧹 Limpiando audio anterior...');
      await stopAndCleanAudio();
      
      // PASO 2: Pequeña pausa para asegurar limpieza
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // PASO 3: Configurar audio
      await configureAudio();
      
      // PASO 4: Crear nuevo sound
      console.log('🎧 Creando nuevo audio...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        track.file,
        {
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          positionMillis: 0,
          progressUpdateIntervalMillis: 1000,
        },
        onPlaybackStatusUpdate
      );
      
      // PASO 5: Verificar que no se canceló durante la carga
      if (!isLoadingTrack.current) {
        console.log('⚠️ Carga cancelada, limpiando...');
        await newSound.unloadAsync();
        return;
      }
      
      // PASO 6: Actualizar estado solo si la carga sigue activa
      setSound(newSound);
      currentSoundRef.current = newSound;
      setCurrentTrack(track);
      setCurrentContent(content);
      setPlaylist(trackPlaylist);
      setCurrentIndex(index);
      setPosition(0);
      setIsPlayerVisible(true);
      
      console.log(`✅ Canción cargada: ${track.title}`);
      
    } catch (error) {
      console.error('❌ Error cargando audio:', error);
      await stopAndCleanAudio();
    }
    
    setIsLoading(false);
    isLoadingTrack.current = false;
  };

  // Controles básicos
  const playPause = async () => {
    if (!sound) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      }
    } catch (error) {
      console.error('Error play/pause:', error);
    }
  };

  const stop = async () => {
    if (sound) {
      try {
        console.log('Deteniendo reproductor completamente...');
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPosition(0);
        setIsPlaying(false);
        setCurrentTrack(null);
        setCurrentContent(null);
        setPlaylist([]);
        setCurrentIndex(0);
        setIsPlayerVisible(false);
        console.log('Reproductor detenido y limpiado');
      } catch (error) {
        console.error('Error stopping:', error);
      }
    }
  };

  const seekTo = async (newPosition: number) => {
    if (sound && !isSliding) {
      try {
        await sound.setPositionAsync(newPosition);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  // Navegación de playlist
  const nextTrack = async () => {
    // Debouncing: evitar cambios muy rápidos
    const now = Date.now();
    if (now - lastTrackChangeTime.current < 500) { // 500ms mínimo entre cambios
      console.log('🚫 Cambio de canción muy rápido, ignorando...');
      return;
    }
    
    if (playlist.length === 0 || !currentContent) {
      console.log('No hay playlist o contenido actual');
      return;
    }
    
    lastTrackChangeTime.current = now;
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextTrackItem = playlist[nextIndex];
    
    console.log(`⏭️ Siguiente: ${nextTrackItem.title}`);
    await playTrack(nextTrackItem, currentContent, playlist, nextIndex);
  };

  const previousTrack = async () => {
    // Debouncing: evitar cambios muy rápidos
    const now = Date.now();
    if (now - lastTrackChangeTime.current < 500) { // 500ms mínimo entre cambios
      console.log('🚫 Cambio de canción muy rápido, ignorando...');
      return;
    }
    
    if (playlist.length === 0 || !currentContent) {
      console.log('No hay playlist o contenido actual');
      return;
    }
    
    lastTrackChangeTime.current = now;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevTrackItem = playlist[prevIndex];
    
    console.log(`⏮️ Anterior: ${prevTrackItem.title}`);
    await playTrack(prevTrackItem, currentContent, playlist, prevIndex);
  };

  // Control de sliding
  const setSliding = (sliding: boolean) => {
    setIsSliding(sliding);
  };

  // Control de visibilidad
  const showPlayer = () => {
    setIsPlayerVisible(true);
  };
  
  const hidePlayer = () => {
    setIsPlayerVisible(false);
  };

  // Limpieza
  const cleanup = async () => {
    if (statusUpdateInterval.current) {
      clearInterval(statusUpdateInterval.current);
    }
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error cleaning up:', error);
      }
    }
    setSound(null);
    setCurrentTrack(null);
    setCurrentContent(null);
    setPlaylist([]);
    setPosition(0);
    setDuration(0);
    setIsPlaying(false);
    setIsPlayerVisible(false);
  };

  const contextValue: AudioPlayerContextType = {
    // Estado
    sound,
    isPlaying,
    isLoading,
    position,
    duration,
    isSliding,
    currentTrack,
    currentContent,
    playlist,
    currentIndex,
    isPlayerVisible,
    
    // Acciones
    playPause,
    stop,
    seekTo,
    playTrack,
    nextTrack,
    previousTrack,
    setSliding,
    setPosition,
    showPlayer,
    hidePlayer,
    cleanup,
  };

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerContext;