import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import notificationManager from './NotificationService';
import { useSeasonalNotifications } from './SeasonalNotificationService';
import { useWatchProgress } from './WatchProgressService';

export interface ViewingSession {
  contentId: string;
  contentTitle: string;
  contentType: 'pelicula' | 'serie';
  currentEpisode?: number;
  totalEpisodes?: number;
  startTime: number;
  lastUpdate: number;
  totalWatchTime: number;
  isActive: boolean;
}

export interface ViewingSessionMethods {
  startSession: (contentId: string, contentTitle: string, contentType: 'pelicula' | 'serie', episode?: number) => Promise<void>;
  updateProgress: (currentTime: number, duration: number) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  endSession: (completed?: boolean) => Promise<void>;
  getCurrentSession: () => ViewingSession | null;
  getSessionStats: () => { watchTime: number; progressPercentage: number };
}

export function useViewingSession(): ViewingSessionMethods {
  const [currentSession, setCurrentSession] = useState<ViewingSession | null>(null);
  const sessionRef = useRef<ViewingSession | null>(null);
  const { updateProgress: updateWatchProgress, addToAbandoned } = useWatchProgress();
  const { scheduleContinueWatching } = useSeasonalNotifications();
  
  // Timer para guardar progreso automáticamente cada 30 segundos
  const autoSaveIntervalRef = useRef<any>(null);
  const lastSaveTimeRef = useRef<number>(0);

  useEffect(() => {
    sessionRef.current = currentSession;
  }, [currentSession]);

  // Cargar sesión activa al inicializar
  useEffect(() => {
    loadActiveSession();
    return () => {
      // Limpiar al desmontar
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  const loadActiveSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem('activeViewingSession');
      if (sessionData) {
        const session: ViewingSession = JSON.parse(sessionData);
        // Solo cargar si la sesión es reciente (menos de 1 hora)
        const now = Date.now();
        if (now - session.lastUpdate < 60 * 60 * 1000) {
          setCurrentSession(session);
          startAutoSave();
        } else {
          // Sesión expirada, limpiar
          await AsyncStorage.removeItem('activeViewingSession');
        }
      }
    } catch (error) {
      console.error('Error cargando sesión activa:', error);
    }
  };

  const saveSession = async (session: ViewingSession) => {
    try {
      await AsyncStorage.setItem('activeViewingSession', JSON.stringify(session));
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  };

  const startAutoSave = () => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = setInterval(() => {
      const session = sessionRef.current;
      if (session && session.isActive) {
        const now = Date.now();
        const updatedSession = {
          ...session,
          lastUpdate: now,
          totalWatchTime: session.totalWatchTime + (now - lastSaveTimeRef.current) / 1000,
        };
        
        setCurrentSession(updatedSession);
        saveSession(updatedSession);
        lastSaveTimeRef.current = now;

        // Actualizar progreso en el servicio de watch progress cada minuto
        if (Math.floor(updatedSession.totalWatchTime) % 60 === 0) {
          updateWatchProgress({
            contentId: session.contentId,
            contentTitle: session.contentTitle,
            contentType: session.contentType,
            currentEpisode: session.currentEpisode,
            totalEpisodes: session.totalEpisodes,
            lastWatched: new Date().toISOString(),
            progressPercentage: Math.min((updatedSession.totalWatchTime / 5400) * 100, 100), // Asumiendo 90 min promedio
          });
        }
      }
    }, 30000); // Cada 30 segundos
  };

  const startSession = async (
    contentId: string, 
    contentTitle: string, 
    contentType: 'pelicula' | 'serie',
    episode?: number
  ) => {
    try {
      // Finalizar sesión anterior si existe
      if (currentSession) {
        await endSession(false);
      }

      const now = Date.now();
      const newSession: ViewingSession = {
        contentId,
        contentTitle,
        contentType,
        currentEpisode: episode,
        startTime: now,
        lastUpdate: now,
        totalWatchTime: 0,
        isActive: true,
      };

      setCurrentSession(newSession);
      await saveSession(newSession);
      startAutoSave();
      lastSaveTimeRef.current = now;

      console.log(`📺 Sesión iniciada: ${contentTitle}${episode ? ` - Episodio ${episode}` : ''}`);
      
      // Actualizar actividad del usuario para notificaciones
      await notificationManager.updateLastActivity();
      
    } catch (error) {
      console.error('Error iniciando sesión de visualización:', error);
    }
  };

  const updateProgress = async (currentTime: number, duration: number) => {
    if (!currentSession || !currentSession.isActive) return;

    const progressPercentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
    
    // Solo actualizar si hay un cambio significativo (más de 5%)
    const now = Date.now();
    const timeSinceLastUpdate = (now - currentSession.lastUpdate) / 1000;
    
    if (timeSinceLastUpdate < 5) return; // No actualizar muy frecuentemente

    const updatedSession = {
      ...currentSession,
      lastUpdate: now,
      totalWatchTime: currentSession.totalWatchTime + timeSinceLastUpdate,
    };

    setCurrentSession(updatedSession);

    // Guardar progreso cada 2 minutos o cambio significativo
    if (timeSinceLastUpdate > 120 || Math.abs(progressPercentage - (currentSession.totalWatchTime * 100 / duration)) > 5) {
      await updateWatchProgress({
        contentId: currentSession.contentId,
        contentTitle: currentSession.contentTitle,
        contentType: currentSession.contentType,
        currentEpisode: currentSession.currentEpisode,
        totalEpisodes: currentSession.totalEpisodes,
        lastWatched: new Date().toISOString(),
        progressPercentage: progressPercentage,
      });
      await saveSession(updatedSession);
    }
  };

  const pauseSession = async () => {
    if (!currentSession) return;

    const now = Date.now();
    const updatedSession = {
      ...currentSession,
      isActive: false,
      lastUpdate: now,
      totalWatchTime: currentSession.totalWatchTime + (now - currentSession.lastUpdate) / 1000,
    };

    setCurrentSession(updatedSession);
    await saveSession(updatedSession);

    // Limpiar auto-save cuando se pausa
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    console.log(`⏸️ Sesión pausada: ${currentSession.contentTitle}`);
  };

  const resumeSession = async () => {
    if (!currentSession) return;

    const now = Date.now();
    const updatedSession = {
      ...currentSession,
      isActive: true,
      lastUpdate: now,
    };

    setCurrentSession(updatedSession);
    await saveSession(updatedSession);
    startAutoSave();
    lastSaveTimeRef.current = now;

    console.log(`▶️ Sesión reanudada: ${currentSession.contentTitle}`);
  };

  const endSession = async (completed: boolean = false) => {
    if (!currentSession) return;

    const now = Date.now();
    const finalWatchTime = currentSession.totalWatchTime + (now - currentSession.lastUpdate) / 1000;

    // Actualizar progreso final
    await updateWatchProgress({
      contentId: currentSession.contentId,
      contentTitle: currentSession.contentTitle,
      contentType: currentSession.contentType,
      currentEpisode: currentSession.currentEpisode,
      totalEpisodes: currentSession.totalEpisodes,
      lastWatched: new Date().toISOString(),
      progressPercentage: Math.min((finalWatchTime / 5400) * 100, 100), // Asumiendo 90 min promedio
    });

    // Si no se completó y se vio más de 5 minutos, agregar a contenido abandonado
    if (!completed && finalWatchTime > 300) {
      // Programar notificación de "continuar viendo" para dentro de 2 días
      await scheduleContinueWatching();
    }

    // Limpiar sesión
    setCurrentSession(null);
    await AsyncStorage.removeItem('activeViewingSession');
    
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    console.log(`🏁 Sesión finalizada: ${currentSession.contentTitle} - Tiempo total: ${Math.floor(finalWatchTime / 60)}m`);
  };

  const getCurrentSession = (): ViewingSession | null => {
    return currentSession;
  };

  const getSessionStats = () => {
    if (!currentSession) {
      return { watchTime: 0, progressPercentage: 0 };
    }

    const now = Date.now();
    const totalTime = currentSession.isActive 
      ? currentSession.totalWatchTime + (now - currentSession.lastUpdate) / 1000
      : currentSession.totalWatchTime;

    return {
      watchTime: totalTime,
      progressPercentage: 0, // Se calcula externamente basado en duración del contenido
    };
  };

  return {
    startSession,
    updateProgress,
    pauseSession,
    resumeSession,
    endSession,
    getCurrentSession,
    getSessionStats,
  };
}

// Hook para componentes que necesitan mostrar el estado de la sesión
export function useSessionStatus() {
  const [isWatching, setIsWatching] = useState(false);
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const { getCurrentSession } = useViewingSession();

  useEffect(() => {
    const checkSession = () => {
      const session = getCurrentSession();
      setIsWatching(!!session?.isActive);
      setCurrentContent(session?.contentTitle || null);
    };

    checkSession();
    const interval = setInterval(checkSession, 10000); // Verificar cada 10 segundos

    return () => clearInterval(interval);
  }, [getCurrentSession]);

  return { isWatching, currentContent };
}

export default useViewingSession;
