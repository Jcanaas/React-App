import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../components/firebaseConfig';
import { userProgressService, UserProgressData } from '../services/UserProgressService';
import { 
  robustAchievementService, 
  UserAchievementProgress, 
  UserAchievementSummary,
  Achievement 
} from '../services/RobustAchievementService';

interface RobustGamificationContextType {
  // Estados principales
  userProgress: UserProgressData | null;
  userAchievements: UserAchievementProgress[];
  achievementSummary: UserAchievementSummary | null;
  allAchievements: Achievement[];
  isLoading: boolean;
  isInitialized: boolean;
  
  // Estadísticas calculadas
  totalPoints: number;
  completionPercentage: number;
  recentAchievements: UserAchievementProgress[];
  upcomingAchievements: UserAchievementProgress[];
  
  // Sistema de notificaciones
  pendingNotifications: UserAchievementProgress[];
  markNotificationAsShown: (achievementId: string) => Promise<void>;
  getAchievementById: (achievementId: string) => Achievement | undefined;
  
  // Funciones para incrementar estadísticas
  incrementReviews: (count?: number) => Promise<void>;
  incrementMusicTime: (minutes: number) => Promise<void>;
  incrementAppTime: (minutes: number) => Promise<void>;
  incrementMessages: (count?: number) => Promise<void>;
  
  // Funciones de utilidad
  refreshAllData: () => Promise<void>;
  forceInitialization: () => Promise<void>;
  syncOnAchievementsView: () => Promise<void>;
  getAchievementDefinition: (achievementId: string) => Achievement | undefined;
  
  // Sistema de auto-guardado
  scheduleAutoSave: () => void;
  saveImmediately: () => Promise<void>;
  pendingSave: boolean;
  
  // Funciones de diagnóstico
  runDiagnostics: () => Promise<void>;
}

const RobustGamificationContext = createContext<RobustGamificationContextType | undefined>(undefined);

export const useRobustGamification = () => {
  const context = useContext(RobustGamificationContext);
  if (context === undefined) {
    throw new Error('useRobustGamification must be used within a RobustGamificationProvider');
  }
  return context;
};

interface RobustGamificationProviderProps {
  children: React.ReactNode;
}

export const RobustGamificationProvider: React.FC<RobustGamificationProviderProps> = ({ children }) => {
  // Estados principales
  const [userProgress, setUserProgress] = useState<UserProgressData | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievementProgress[]>([]);
  const [achievementSummary, setAchievementSummary] = useState<UserAchievementSummary | null>(null);
  const [allAchievements] = useState<Achievement[]>(robustAchievementService.getAchievementDefinitions());
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Cache para evitar recargas innecesarias
  const [lastLoadedUserId, setLastLoadedUserId] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [lastMinutesSyncTime, setLastMinutesSyncTime] = useState<number>(0);
  const [achievementsSyncCount, setAchievementsSyncCount] = useState<number>(0);
  const [lastAchievementsSyncTime, setLastAchievementsSyncTime] = useState<number>(0);
  
  // Sistema de auto-guardado con debounce
  const autoSaveTimerRef = useRef<number | null>(null);
  const [pendingSave, setPendingSave] = useState<boolean>(false);

  // Inicialización completa del sistema
  const initializeSystem = useCallback(async (userId: string, forceReinit: boolean = false) => {
    try {
      console.log('🚀 [ROBUST] Inicializando sistema para usuario:', userId, 'Force:', forceReinit);
      
      // Verificar cache - si es el mismo usuario y no es forzado y ya tenemos datos
      const now = Date.now();
      const cacheValidTime = 5 * 60 * 1000; // 5 minutos
      const hasValidCache = lastLoadedUserId === userId && 
                           (now - lastLoadTime) < cacheValidTime && 
                           !forceReinit && 
                           isInitialized && 
                           userProgress && 
                           userAchievements.length > 0;
      
      console.log('🔍 [CACHE] Verificando cache:', {
        lastLoadedUserId,
        currentUserId: userId,
        timeSinceLastLoad: Math.round((now - lastLoadTime) / 1000),
        cacheValidTime: Math.round(cacheValidTime / 1000),
        forceReinit,
        isInitialized,
        hasUserProgress: !!userProgress,
        achievementsCount: userAchievements.length,
        hasValidCache
      });
      
      if (hasValidCache) {
        console.log('✅ [ROBUST] Usando datos en cache válidos - NO se reinicializa');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      // 1. Obtener/crear datos de progreso (sin migración automática)
      console.log('📊 [ROBUST] Paso 1: Obteniendo datos de progreso...');
      const progressData = await userProgressService.getUserProgressData(userId);
      setUserProgress(progressData);
      
      // 2. Obtener logros existentes primero
      console.log('🎯 [ROBUST] Paso 2: Verificando logros existentes...');
      const existingAchievements = await robustAchievementService.getUserAchievements(userId);
      
      // Solo inicializar logros si no hay ninguno o es reinicialización forzada
      if (existingAchievements.length === 0 || forceReinit) {
        console.log('🔄 [ROBUST] Paso 2b: Inicializando logros (no hay datos previos)...');
        await robustAchievementService.initializeUserAchievements(userId);
        // Obtener los logros recién creados
        const newAchievements = await robustAchievementService.getUserAchievements(userId);
        setUserAchievements(newAchievements);
      } else {
        console.log('✅ [ROBUST] Logros existentes encontrados:', existingAchievements.length);
        setUserAchievements(existingAchievements);
      }
      
      // 3. Obtener resumen de logros
      console.log('📋 [ROBUST] Paso 3: Obteniendo resumen de logros...');
      const summary = await robustAchievementService.getUserSummary(userId);
      setAchievementSummary(summary);
      
      // Actualizar cache
      setLastLoadedUserId(userId);
      setLastLoadTime(now);
      
      console.log('✅ [ROBUST] Sistema inicializado exitosamente');
      setIsInitialized(true);
      
    } catch (error) {
      console.error('❌ [ROBUST] Error inicializando sistema:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, userProgress, userAchievements, lastLoadedUserId, lastLoadTime]);

  // Sistema de auto-guardado (definido antes del useEffect)
  const scheduleAutoSave = useCallback(() => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    console.log('⏰ [AUTO-SAVE] Programando auto-guardado en 10 segundos...');
    setPendingSave(true);

    // Limpiar timer anterior si existe
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Programar nuevo auto-guardado en 10 segundos
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        console.log('💾 [AUTO-SAVE] Ejecutando auto-guardado...');
        
        // Guardar progreso actual
        const currentProgress = await userProgressService.getUserProgressData(user.uid);
        if (currentProgress) {
          console.log('📊 [AUTO-SAVE] Progreso guardado:', currentProgress);
        }

        // Actualizar y guardar logros
        await robustAchievementService.forceUpdateAllAchievements(user.uid);
        const achievements = await robustAchievementService.getUserAchievements(user.uid);
        console.log('🎯 [AUTO-SAVE] Logros actualizados y guardados:', achievements.length);

        // Actualizar resumen
        await robustAchievementService.updateUserSummary(user.uid);
        const summary = await robustAchievementService.getUserSummary(user.uid);
        console.log('📋 [AUTO-SAVE] Resumen actualizado y guardado');

        // Actualizar estados locales
        setUserProgress(currentProgress);
        setUserAchievements(achievements);
        setAchievementSummary(summary);

        setPendingSave(false);
        console.log('✅ [AUTO-SAVE] Auto-guardado completado exitosamente');

      } catch (error) {
        console.error('❌ [AUTO-SAVE] Error en auto-guardado:', error);
        setPendingSave(false);
      }

      autoSaveTimerRef.current = null;
    }, 10000); // 10 segundos

  }, []);

  const saveImmediately = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      console.log('💾 [IMMEDIATE-SAVE] Guardando inmediatamente...');

      // Cancelar auto-guardado pendiente
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      // Guardar progreso actual
      const currentProgress = await userProgressService.getUserProgressData(user.uid);
      
      // Actualizar y guardar logros
      await robustAchievementService.forceUpdateAllAchievements(user.uid);
      const achievements = await robustAchievementService.getUserAchievements(user.uid);
      
      // Actualizar resumen
      await robustAchievementService.updateUserSummary(user.uid);
      const summary = await robustAchievementService.getUserSummary(user.uid);

      // Actualizar estados locales
      setUserProgress(currentProgress);
      setUserAchievements(achievements);
      setAchievementSummary(summary);

      setPendingSave(false);
      console.log('✅ [IMMEDIATE-SAVE] Guardado inmediato completado');

    } catch (error) {
      console.error('❌ [IMMEDIATE-SAVE] Error en guardado inmediato:', error);
      setPendingSave(false);
    }
  }, []);

  // Configurar suscripciones
  useEffect(() => {
    console.log('🔔 [ROBUST] Configurando suscripciones...');
    const user = auth.currentUser;
    
    if (!user || !user.uid || user.uid.trim() === '') {
      console.log('⚠️ [ROBUST] Usuario no válido para suscripciones');
      setIsLoading(false);
      return;
    }

    // 🚀 GUARDADO INMEDIATO AL ENTRAR EN LA APP
    console.log('🚀 [AUTO-SAVE] Ejecutando guardado inmediato al iniciar la app...');
    saveImmediately();

    let unsubscribeProgress: (() => void) | undefined;
    let unsubscribeAchievements: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        // NO inicializar aquí - eso se hace manualmente desde syncOnAchievementsView
        
        // TEMPORALMENTE DESACTIVADAS - Solo para testing
        console.log('🔕 [ROBUST] Suscripciones desactivadas para evitar bucles');
        
        /* COMENTADO TEMPORALMENTE
        // Suscribirse a cambios en progreso
        console.log('🔔 [ROBUST] Configurando suscripción a progreso...');
        unsubscribeProgress = userProgressService.subscribeToUserProgress(
          user.uid,
          (progressData) => {
            console.log('📊 [ROBUST] Progreso actualizado:', progressData);
            setUserProgress(progressData);
          }
        );

        // Suscribirse a cambios en logros
        console.log('🔔 [ROBUST] Configurando suscripción a logros...');
        unsubscribeAchievements = robustAchievementService.subscribeToUserAchievements(
          user.uid,
          (achievements) => {
            console.log('🎯 [ROBUST] Logros actualizados:', achievements.length);
            setUserAchievements(achievements);
            
            // Actualizar resumen cuando cambien los logros
            robustAchievementService.updateUserSummary(user.uid).then(() => {
              robustAchievementService.getUserSummary(user.uid).then(setAchievementSummary);
            });
          }
        );
        */

        console.log('✅ [ROBUST] Suscripciones configuradas');
        
      } catch (error) {
        console.error('❌ [ROBUST] Error configurando suscripciones:', error);
        setIsLoading(false);
      }
    };

    setupSubscriptions();

    // Cleanup
    return () => {
      console.log('🧹 [ROBUST] Limpiando suscripciones...');
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeAchievements) unsubscribeAchievements();
      
      // Limpiar timer de auto-guardado
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
        console.log('🧹 [AUTO-SAVE] Timer de auto-guardado limpiado');
      }
    };
  }, []); // Sin dependencies para evitar bucles - saveImmediately se llama directamente

  // Funciones para incrementar estadísticas
  const incrementReviews = useCallback(async (count: number = 1) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      console.log(`📈 [ROBUST] Incrementando reseñas: +${count}`);
      await userProgressService.incrementStat(user.uid, 'totalReviews', count);
      
      // Actualizar logros después del incremento
      await robustAchievementService.forceUpdateAllAchievements(user.uid);
      
      // Programar auto-guardado en 10 segundos
      scheduleAutoSave();
      
    } catch (error) {
      console.error('❌ [ROBUST] Error incrementando reseñas:', error);
    }
  }, [scheduleAutoSave]);

  const incrementMusicTime = useCallback(async (minutes: number) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '' || minutes <= 0) return;

    try {
      console.log(`🎵 [ROBUST] Incrementando tiempo de música: +${minutes} minutos`);
      await userProgressService.incrementStat(user.uid, 'totalMusicTime', minutes);
      
      // Actualizar logros después del incremento
      await robustAchievementService.forceUpdateAllAchievements(user.uid);
      
      // Programar auto-guardado en 10 segundos
      scheduleAutoSave();
      
    } catch (error) {
      console.error('❌ [ROBUST] Error incrementando tiempo de música:', error);
    }
  }, [scheduleAutoSave]);

  const incrementAppTime = useCallback(async (minutes: number) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '' || minutes <= 0) return;

    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutos en ms

    // Solo enviar a Firebase cada 5 minutos
    if (now - lastMinutesSyncTime >= FIVE_MINUTES) {
      try {
        console.log(`⏱️ [ROBUST] Sincronizando tiempo de app: +${minutes} minutos con Firebase (lastMinutesSyncTime=${lastMinutesSyncTime})`);
        await userProgressService.incrementStat(user.uid, 'totalAppTime', minutes);

        // Actualizar logros después del incremento
        await robustAchievementService.forceUpdateAllAchievements(user.uid);
        setLastMinutesSyncTime(now);
        
        // Programar auto-guardado en 10 segundos
        scheduleAutoSave();
        
        console.log('✅ [ROBUST] Tiempo de app sincronizado con éxito');

      } catch (error) {
        console.error('❌ [ROBUST] Error incrementando tiempo de app:', error);
      }
    } else {
      const msLeft = FIVE_MINUTES - (now - lastMinutesSyncTime);
      const timeUntilNext = Math.ceil(msLeft / 1000 / 60);
      console.log(`⏱️ [LOCAL] Tiempo actualizado localmente (+${minutes} min). Próxima sync en ${timeUntilNext} min (msLeft=${msLeft})`);
    }
  }, [lastMinutesSyncTime, scheduleAutoSave]);

  // Función SIMPLE para leer BD una sola vez al entrar a logros
  const syncOnAchievementsView = useCallback(async () => {
    const user = auth.currentUser;
    if (!user?.uid) return;

    try {
      console.log('🏆 [SIMPLE SYNC] Leyendo BD una sola vez...');
      
      // Solo inicializar SIN force, respetando cache
      await initializeSystem(user.uid, false);
      
      console.log('✅ [SIMPLE SYNC] Lectura completada');
    } catch (error) {
      console.error('❌ [SIMPLE SYNC] Error:', error);
    }
  }, []); // Sin dependencies para evitar recreaciones

  const incrementMessages = useCallback(async (count: number = 1) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      console.log(`💬 [ROBUST] Incrementando mensajes: +${count}`);
      await userProgressService.incrementStat(user.uid, 'totalMessages', count);
      
      // Actualizar logros después del incremento
      await robustAchievementService.forceUpdateAllAchievements(user.uid);
      
      // Programar auto-guardado en 10 segundos
      scheduleAutoSave();
      
    } catch (error) {
      console.error('❌ [ROBUST] Error incrementando mensajes:', error);
    }
  }, [scheduleAutoSave]);

  // Funciones de utilidad
  const refreshAllData = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      console.log('🔄 [ROBUST] Refrescando todos los datos...');
      setIsLoading(true);
      
      await initializeSystem(user.uid, false); // No forzar en refresh normal
      
      console.log('✅ [ROBUST] Datos refrescados');
      
    } catch (error) {
      console.error('❌ [ROBUST] Error refrescando datos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Sin dependencies para evitar bucles

  const forceInitialization = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      console.log('🔧 [ROBUST] Forzando reinicialización completa...');
      setIsLoading(true);
      setIsInitialized(false);
      
      // Limpiar estados y cache
      setUserProgress(null);
      setUserAchievements([]);
      setAchievementSummary(null);
      setLastLoadedUserId(null);
      setLastLoadTime(0);
      setLastMinutesSyncTime(0);
      setAchievementsSyncCount(0);
      setLastAchievementsSyncTime(0);
      
      // Reinicializar desde cero con force = true
      await initializeSystem(user.uid, true);
      
      console.log('✅ [ROBUST] Reinicialización completada');
      
    } catch (error) {
      console.error('❌ [ROBUST] Error en reinicialización:', error);
    }
  }, []); // Sin dependencies para evitar bucles

  const getAchievementDefinition = useCallback((achievementId: string): Achievement | undefined => {
    return robustAchievementService.getAchievementDefinition(achievementId);
  }, []);

  const runDiagnostics = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      console.log('🔍 [ROBUST] Ejecutando diagnósticos...');
      
      // Verificar datos de progreso
      const progress = await userProgressService.getUserProgressData(user.uid);
      console.log('📊 [DIAGNOSTICS] Progreso actual:', progress);
      
      // Verificar logros
      const achievements = await robustAchievementService.getUserAchievements(user.uid);
      console.log('🎯 [DIAGNOSTICS] Logros encontrados:', achievements.length);
      
      // Verificar resumen
      const summary = await robustAchievementService.getUserSummary(user.uid);
      console.log('📋 [DIAGNOSTICS] Resumen:', summary);
      
      // Verificar definiciones
      const definitions = robustAchievementService.getAchievementDefinitions();
      console.log('📖 [DIAGNOSTICS] Definiciones disponibles:', definitions.length);
      
      console.log('✅ [DIAGNOSTICS] Diagnósticos completados');
      
    } catch (error) {
      console.error('❌ [DIAGNOSTICS] Error en diagnósticos:', error);
    }
  }, []);

  // Funciones de notificaciones
  const markNotificationAsShown = useCallback(async (achievementId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Marcar la notificación como mostrada en el servicio
      await robustAchievementService.markNotificationAsShown(user.uid, achievementId);
      
      // Actualizar el estado local
      setUserAchievements(prev => 
        prev.map(achievement => 
          achievement.achievementId === achievementId 
            ? { ...achievement, notificationShown: true }
            : achievement
        )
      );
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error marcando notificación como mostrada:', error);
    }
  }, []);

  const getAchievementById = useCallback((achievementId: string): Achievement | undefined => {
    return allAchievements.find(achievement => achievement.id === achievementId);
  }, [allAchievements]);

  // Estadísticas calculadas
  const totalPoints = achievementSummary?.totalPoints || 0;
  const completionPercentage = achievementSummary?.completionPercentage || 0;
  const recentAchievements = achievementSummary?.recentAchievements || [];
  const upcomingAchievements = achievementSummary?.upcomingAchievements || [];
  
  // Calcular notificaciones pendientes
  const pendingNotifications = userAchievements.filter(
    achievement => achievement.isCompleted && !achievement.notificationShown
  );

  const value: RobustGamificationContextType = {
    // Estados principales
    userProgress,
    userAchievements,
    achievementSummary,
    allAchievements,
    isLoading,
    isInitialized,
    
    // Estadísticas calculadas
    totalPoints,
    completionPercentage,
    recentAchievements,
    upcomingAchievements,
    
    // Sistema de notificaciones
    pendingNotifications,
    markNotificationAsShown,
    getAchievementById,
    
    // Funciones para incrementar estadísticas
    incrementReviews,
    incrementMusicTime,
    incrementAppTime,
    incrementMessages,
    
    // Funciones de utilidad
    refreshAllData,
    forceInitialization,
    syncOnAchievementsView,
    getAchievementDefinition,
    
    // Sistema de auto-guardado
    scheduleAutoSave,
    saveImmediately,
    pendingSave,
    
    // Funciones de diagnóstico
    runDiagnostics
  };

  // Debug logging
  useEffect(() => {
    console.log('🎮 [ROBUST CONTEXT DEBUG] Estado actual:');
    console.log('📊 userProgress:', userProgress);
    console.log('🎯 userAchievements count:', userAchievements?.length || 0);
    console.log('📋 achievementSummary:', achievementSummary);
    console.log('📖 allAchievements count:', allAchievements?.length || 0);
    console.log('⏳ isLoading:', isLoading);
    console.log('✅ isInitialized:', isInitialized);
    console.log('🏆 totalPoints:', totalPoints);
    console.log('📈 completionPercentage:', completionPercentage);
  }, [userProgress, userAchievements, achievementSummary, allAchievements, isLoading, isInitialized, totalPoints, completionPercentage]);

  return (
    <RobustGamificationContext.Provider value={value}>
      {children}
    </RobustGamificationContext.Provider>
  );
};

export default RobustGamificationProvider;