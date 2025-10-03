import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SoundtrackItem, ContentItem } from '../components/ContentData';
import { userProgressService } from '../services/UserProgressService';
import { auth } from '../components/firebaseConfig';
import StatsLogger from '../utils/statsLogger';

// Configurar notificaciones básicas para controles de música
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,  // Permitir mostrar en banner
    shouldShowList: true,    // Permitir mostrar en lista de notificaciones
  }),
});

// Solicitar permisos de notificación al inicializar
const initializeNotifications = async () => {
  try {
    console.log('🔔 Solicitando permisos de notificación...');
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Permisos de notificación denegados');
      return false;
    }
    
    console.log('✅ Permisos de notificación concedidos');
    return true;
  } catch (error) {
    console.error('❌ Error solicitando permisos:', error);
    return false;
  }
};

// Inicializar permisos inmediatamente
initializeNotifications();

console.log('🎵 Sistema de notificaciones musicales configurado');

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
  
  // Modos de reproducción
  isAutoPlayEnabled: boolean;
  isShuffleEnabled: boolean;
  isRepeatEnabled: boolean;
  repeatMode: 'off' | 'all' | 'one';
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
  
  // Modos de reproducción
  toggleAutoPlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
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
  
  // Modos de reproducción
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true); // Auto-play habilitado por defecto
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  
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

  // Configurar controles multimedia cuando cambie el estado
  useEffect(() => {
    if (currentTrack && currentContent) {
      updateMusicControl();
    } else {
      clearMusicControl();
    }
  }, [currentTrack, currentContent, isPlaying]);

  // Configurar listeners para notificaciones musicales
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🎵 Notificación tocada:', response.notification.request.content.title);
      // La notificación abre la app automáticamente
    });

    return () => subscription.remove();
  }, []);

  // Configurar notificaciones musicales básicas
  const setupMusicControls = async () => {
    try {
      // Configurar canal de notificación para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('music-channel', {
          name: 'JojoFlix Music Player',
          description: 'Controles del reproductor de música',
          importance: Notifications.AndroidImportance.LOW,
          sound: null,
          vibrationPattern: [0],
          lightColor: '#DF2892',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          showBadge: false,
          enableLights: true,
          enableVibrate: false,
        });
        
        console.log('🎵 Canal Android configurado: music-channel');
      }

      return true;
    } catch (error) {
      console.error('❌ Error configurando canal de notificaciones:', error);
      return false;
    }
  };

  // Actualizar notificación
  const updateMusicControl = async () => {
    if (!currentTrack || !currentContent) {
      console.log('🚫 No hay canción o contenido para mostrar notificación');
      return;
    }

    try {
      console.log('🔔 Actualizando notificación musical...', {
        track: currentTrack.title,
        content: currentContent.nombre,
        isPlaying: isPlaying
      });

      // Verificar permisos antes de mostrar notificación
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Sin permisos de notificación, solicitando...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.error('❌ Permisos de notificación denegados');
          return;
        }
      }

      await setupMusicControls();

      // Preparar imagen del álbum
      let albumArtwork = null;
      if (currentContent.verticalbanner) {
        albumArtwork = typeof currentContent.verticalbanner === 'string' 
          ? currentContent.verticalbanner 
          : currentContent.verticalbanner.uri || null;
      }

      // Limpiar notificación anterior
      await Notifications.dismissNotificationAsync('music-player-notification');

      // Configuración de notificación mejorada
      const notificationContent: any = {
        title: `🎵 ${currentTrack.title}`,
        body: `${currentContent.nombre} • ${isPlaying ? 'Reproduciendo' : 'Pausado'}`,
        subtitle: 'JojoFlix Music Player',
        sound: false,
        sticky: true,
        priority: Notifications.AndroidImportance.LOW,
        color: '#DF2892',
        data: {
          type: 'music_player',
          track: currentTrack.title,
          content: currentContent.nombre,
          isPlaying: isPlaying,
          timestamp: Date.now(),
        },
      };

      // Para Android, configuración específica
      if (Platform.OS === 'android') {
        notificationContent.channelId = 'music-channel';
        notificationContent.categoryIdentifier = 'music';
        notificationContent.autoDismiss = false;
      }

      // Para iOS, agregar imagen si está disponible
      if (Platform.OS === 'ios' && albumArtwork) {
        notificationContent.attachments = [{
          identifier: 'album-art',
          url: albumArtwork,
          typeHint: 'public.jpeg',
        }];
      }

      // Mostrar notificación inmediatamente
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Mostrar inmediatamente
        identifier: 'music-player-notification',
      });

      console.log('✅ Notificación musical mostrada exitosamente:', {
        title: currentTrack.title,
        artist: currentContent.nombre,
        isPlaying: isPlaying,
        hasArtwork: !!albumArtwork,
      });

    } catch (error) {
      console.error('❌ Error actualizando notificación musical:', error);
      console.error('Detalles del error:', error instanceof Error ? error.message : String(error));
      
      // Fallback: intentar una notificación más simple
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎵 JojoFlix Music',
            body: `${currentTrack.title} - ${currentContent.nombre}`,
            data: { type: 'music_player' },
          },
          trigger: null,
          identifier: 'music-player-simple',
        });
        console.log('🔄 Notificación simple mostrada como fallback');
      } catch (fallbackError) {
        console.error('❌ Error también en notificación fallback:', fallbackError);
      }
    }
  };

  // Limpiar notificaciones musicales
  const clearMusicControl = async () => {
    try {
      await Notifications.dismissNotificationAsync('music-player-notification');
      await Notifications.dismissAllNotificationsAsync();
      console.log('🎵 Notificaciones musicales limpiadas');
    } catch (error) {
      console.error('Error limpiando notificaciones musicales:', error);
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

  // Manejar cuando una canción termina
  const handleTrackFinished = async () => {
    console.log('🎵 Procesando fin de canción...', {
      repeatMode,
      isAutoPlayEnabled,
      isShuffleEnabled,
      playlistLength: playlist.length,
      currentIndex
    });

    // Modo repeat "one" - repetir la misma canción
    if (repeatMode === 'one') {
      console.log('🔂 Repitiendo canción actual...');
      if (sound) {
        try {
          await sound.setPositionAsync(0);
          await sound.playAsync();
          return;
        } catch (error) {
          console.error('Error repitiendo canción:', error);
        }
      }
    }

    // Si auto-play está deshabilitado, solo parar
    if (!isAutoPlayEnabled) {
      console.log('⏹️ Auto-play deshabilitado, parando...');
      await stop();
      return;
    }

    // Determinar siguiente canción
    let nextIndex: number;
    
    if (isShuffleEnabled) {
      // Modo shuffle - canción aleatoria (que no sea la actual)
      const availableIndices = playlist
        .map((_, index) => index)
        .filter(index => index !== currentIndex);
      
      if (availableIndices.length === 0) {
        // Solo hay una canción, repetir si está en modo repeat all
        nextIndex = repeatMode === 'all' ? currentIndex : -1;
      } else {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        nextIndex = availableIndices[randomIndex];
      }
      
      console.log('🔀 Modo shuffle - siguiente canción aleatoria:', nextIndex);
    } else {
      // Modo normal - siguiente en orden
      nextIndex = currentIndex + 1;
      
      // Si llegamos al final de la playlist
      if (nextIndex >= playlist.length) {
        if (repeatMode === 'all') {
          nextIndex = 0; // Volver al inicio
          console.log('🔁 Repeat all - volviendo al inicio');
        } else {
          nextIndex = -1; // Terminar playlist
          console.log('⏹️ Fin de playlist alcanzado');
        }
      }
    }

    // Reproducir siguiente canción o terminar
    if (nextIndex >= 0 && nextIndex < playlist.length) {
      const nextTrackItem = playlist[nextIndex];
      console.log(`⏭️ Reproduciendo siguiente: ${nextTrackItem.title} (${nextIndex + 1}/${playlist.length})`);
      await playTrack(nextTrackItem, currentContent!, playlist, nextIndex);
    } else {
      console.log('🏁 Finalizando reproducción');
      await stop();
    }
  };

  // Funciones de control de modos
  const toggleAutoPlay = () => {
    setIsAutoPlayEnabled(!isAutoPlayEnabled);
    console.log('🎵 Auto-play:', !isAutoPlayEnabled ? 'activado' : 'desactivado');
  };

  const toggleShuffle = () => {
    setIsShuffleEnabled(!isShuffleEnabled);
    console.log('🔀 Shuffle:', !isShuffleEnabled ? 'activado' : 'desactivado');
  };

  const toggleRepeat = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    
    setRepeatMode(nextMode);
    setIsRepeatEnabled(nextMode !== 'off');
    
    const modeNames = {
      'off': 'desactivado',
      'all': 'repetir lista',
      'one': 'repetir canción'
    };
    
    console.log('🔁 Repeat:', modeNames[nextMode]);
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
      
      // Si la canción terminó, manejar según el modo de reproducción
      if (status.didJustFinish && playlist.length > 0) {
        console.log('🎵 Canción terminada, procesando siguiente acción...');
        
        setTimeout(() => {
          handleTrackFinished();
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
    
    // Resetear modos de reproducción a valores por defecto
    setIsAutoPlayEnabled(true);
    setIsShuffleEnabled(false);
    setIsRepeatEnabled(false);
    setRepeatMode('off');
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
    
    // Modos de reproducción
    isAutoPlayEnabled,
    isShuffleEnabled,
    isRepeatEnabled,
    repeatMode,
    
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
    
    // Controles de modo
    toggleAutoPlay,
    toggleShuffle,
    toggleRepeat,
    
    cleanup,
  };

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerContext;