import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '../components/firebaseConfig';
import { 
  achievementService, 
  UserStats, 
  UserAchievement,
  Achievement,
  AchievementType 
} from '../services/AchievementService';

interface GamificationContextType {
  // Estados
  userStats: UserStats | null;
  userAchievements: UserAchievement[];
  allAchievements: Achievement[];
  isLoading: boolean;
  
  // Estadísticas calculadas
  unlockedAchievements: UserAchievement[];
  totalProgress: number;
  currentLevel: number;
  pointsForNextLevel: number;
  progressToNextLevel: number;
  
  // Funciones para incrementar estadísticas
  incrementReviews: (count?: number) => Promise<void>;
  incrementMusicTime: (minutes: number) => Promise<void>;
  incrementAppTime: (minutes: number) => Promise<void>;
  incrementMessages: (count?: number) => Promise<void>;
  incrementMoviesWatched: (count?: number) => Promise<void>;
  
  // Funciones utilitarias
  getAchievementById: (id: string) => Achievement | undefined;
  getUserAchievementProgress: (achievementId: string) => UserAchievement | undefined;
  checkForNewAchievements: () => Promise<UserAchievement[]>;
  refreshData: () => Promise<void>;
  cleanupInvalidAchievements: () => Promise<void>;
  
  // Logros pendientes de notificación
  pendingNotifications: UserAchievement[];
  markNotificationAsShown: (achievementId: string) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

interface GamificationProviderProps {
  children: React.ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements] = useState<Achievement[]>(achievementService.getAllAchievements());
  const [isLoading, setIsLoading] = useState(true);
  const [pendingNotifications, setPendingNotifications] = useState<UserAchievement[]>([]);

  // Suscripciones a datos de Firestore
  useEffect(() => {
    console.log('🎮 GamificationContext: useEffect ejecutado');
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') {
      console.log('🎮 Usuario no válido para suscripciones:', user);
      setIsLoading(false);
      return;
    }

    console.log('🎮 Configurando suscripciones para usuario:', user.uid);
    setIsLoading(true);
    let unsubscribeStats: (() => void) | undefined;
    let unsubscribeAchievements: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        console.log('🎮 Iniciando setup de suscripciones...');
        
        // Verificar si el usuario tiene estadísticas, si no, inicializarlas
        let stats = await achievementService.getUserStats(user.uid);
        if (!stats) {
          console.log('🎮 Creando estadísticas iniciales...');
          stats = await achievementService.initializeUserStats(user.uid);
        }
        console.log('🎮 Estadísticas cargadas:', stats);

        // Limpiar achievements con IDs vacíos (solo una vez por sesión)
        await achievementService.cleanupInvalidAchievements(user.uid);

        // Suscribirse a cambios en estadísticas
        console.log('🎮 Configurando suscripción a estadísticas...');
        unsubscribeStats = achievementService.subscribeToUserStats(
          user.uid,
          (stats) => {
            console.log('🎮 Estadísticas actualizadas:', stats);
            setUserStats(stats);
          }
        );

        // Suscribirse a cambios en logros
        console.log('🎮 Configurando suscripción a logros...');
        unsubscribeAchievements = achievementService.subscribeToUserAchievements(
          user.uid,
          (achievements) => {
            console.log('🎮 Logros actualizados:', achievements.length, 'logros');
            setUserAchievements(achievements);
            
            // Detectar nuevos logros para notificaciones
            const newUnlocked = achievements.filter(
              achievement => achievement.isUnlocked && !achievement.notificationShown
            );
            
            if (newUnlocked.length > 0) {
              console.log('🎮 Nuevos logros desbloqueados:', newUnlocked.length);
              setPendingNotifications(prev => {
                const existingIds = prev.map(p => p.achievementId);
                const reallyNew = newUnlocked.filter(
                  nu => !existingIds.includes(nu.achievementId)
                );
                return [...prev, ...reallyNew];
              });
            }
          }
        );

        console.log('🎮 Suscripciones configuradas exitosamente');
        setIsLoading(false);
      } catch (error) {
        console.error('Error configurando suscripciones de gamificación:', error);
        setIsLoading(false);
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions
    return () => {
      if (unsubscribeStats) unsubscribeStats();
      if (unsubscribeAchievements) unsubscribeAchievements();
    };
  }, []);

  // Estadísticas calculadas
  const unlockedAchievements = userAchievements.filter(ua => ua.isUnlocked);
  const totalProgress = Math.round(
    (unlockedAchievements.length / allAchievements.length) * 100
  );
  
  const currentLevel = userStats ? achievementService.calculateLevel(userStats.totalPoints) : 1;
  const pointsForNextLevel = achievementService.getPointsForNextLevel(currentLevel);
  const currentPoints = userStats?.totalPoints || 0;
  const pointsInCurrentLevel = currentPoints - achievementService.getPointsForNextLevel(currentLevel - 1);
  const pointsNeededForLevel = pointsForNextLevel - achievementService.getPointsForNextLevel(currentLevel - 1);
  const progressToNextLevel = Math.round((pointsInCurrentLevel / pointsNeededForLevel) * 100);

  // Funciones para incrementar estadísticas
  const incrementReviews = useCallback(async (count: number = 1) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      await achievementService.incrementStat(user.uid, 'totalReviews', count);
    } catch (error) {
      console.error('Error incrementando reseñas:', error);
    }
  }, []);

  const incrementMusicTime = useCallback(async (minutes: number) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '' || minutes <= 0) return;

    try {
      await achievementService.incrementStat(user.uid, 'totalMusicTime', minutes);
    } catch (error) {
      console.error('Error incrementando tiempo de música:', error);
    }
  }, []);

  const incrementAppTime = useCallback(async (minutes: number) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '' || minutes <= 0) return;

    try {
      await achievementService.incrementStat(user.uid, 'totalAppTime', minutes);
    } catch (error) {
      console.error('Error incrementando tiempo de app:', error);
    }
  }, []);

  const incrementMessages = useCallback(async (count: number = 1) => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      await achievementService.incrementStat(user.uid, 'totalMessages', count);
    } catch (error) {
      console.error('Error incrementando mensajes:', error);
    }
  }, []);

  const incrementMoviesWatched = useCallback(async (count: number = 1) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await achievementService.incrementStat(user.uid, 'moviesWatched', count);
    } catch (error) {
      console.error('Error incrementando películas vistas:', error);
    }
  }, []);

  // Funciones utilitarias
  const getAchievementById = useCallback((id: string): Achievement | undefined => {
    return allAchievements.find(achievement => achievement.id === id);
  }, [allAchievements]);

  const getUserAchievementProgress = useCallback((achievementId: string): UserAchievement | undefined => {
    return userAchievements.find(ua => ua.achievementId === achievementId);
  }, [userAchievements]);

  const checkForNewAchievements = useCallback(async (): Promise<UserAchievement[]> => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') {
      console.warn('Usuario no válido para verificar logros');
      return [];
    }

    try {
      return await achievementService.checkAndUnlockAchievements(user.uid);
    } catch (error) {
      console.error('Error verificando nuevos logros:', error);
      return [];
    }
  }, []);

  const refreshData = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setIsLoading(true);
      await checkForNewAchievements();
    } catch (error) {
      console.error('Error refrescando datos de gamificación:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checkForNewAchievements]);

  const markNotificationAsShown = useCallback(async (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    if (!userAchievement) return;

    try {
      await achievementService.markNotificationShown(userAchievement.id);
      
      // Remover de notificaciones pendientes
      setPendingNotifications(prev => 
        prev.filter(p => p.achievementId !== achievementId)
      );
    } catch (error) {
      console.error('Error marcando notificación como mostrada:', error);
    }
  }, [userAchievements]);

  const cleanupInvalidAchievements = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !user.uid || user.uid.trim() === '') return;

    try {
      await achievementService.cleanupInvalidAchievements(user.uid);
    } catch (error) {
      console.error('Error limpiando achievements inválidos:', error);
    }
  }, []);

  const value: GamificationContextType = {
    // Estados
    userStats,
    userAchievements,
    allAchievements,
    isLoading,
    
    // Estadísticas calculadas
    unlockedAchievements,
    totalProgress,
    currentLevel,
    pointsForNextLevel,
    progressToNextLevel,
    
    // Funciones para incrementar estadísticas
    incrementReviews,
    incrementMusicTime,
    incrementAppTime,
    incrementMessages,
    incrementMoviesWatched,
    
    // Funciones utilitarias
    getAchievementById,
    getUserAchievementProgress,
    checkForNewAchievements,
    refreshData,
    cleanupInvalidAchievements,
    
    // Notificaciones
    pendingNotifications,
    markNotificationAsShown
  };

  // DEBUG: Log de los datos que se envían a los componentes
  useEffect(() => {
    console.log('🎮 [CONTEXT DEBUG] Datos enviados a componentes:');
    console.log('📊 userStats:', userStats);
    console.log('🎯 userAchievements count:', userAchievements?.length || 0);
    console.log('🏅 unlockedAchievements count:', unlockedAchievements?.length || 0);
    console.log('📋 allAchievements count:', allAchievements?.length || 0);
    console.log('⏳ isLoading:', isLoading);
    console.log('📈 totalProgress:', totalProgress);
    console.log('🔢 currentLevel:', currentLevel);
  }, [userStats, userAchievements, unlockedAchievements, allAchievements, isLoading, totalProgress, currentLevel]);

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export default GamificationProvider;