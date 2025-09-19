import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { SoundtrackItem, ContentItem } from '../components/ContentData';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  }, []);

  // Configurar categorías de notificación
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
          sound: false,
        },
        trigger: null,
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