import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../components/firebaseConfig';
import { userProgressService, UserProgressData } from './UserProgressService';

// Definición de logros disponibles
export interface Achievement {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  statRequired: keyof UserProgressData;
  icon: string;
  category: 'reviews' | 'social' | 'music' | 'time';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Progreso individual de un logro para un usuario
export interface UserAchievementProgress {
  id: string;
  userId: string;
  achievementId: string;
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
  notificationShown?: boolean;
  
  // Metadatos de verificación
  lastProgressUpdate: Date;
  verificationCount: number;
  dataSource: 'calculated' | 'manual' | 'migration';
  
  // Historial para redundancia
  progressHistory: Array<{
    value: number;
    timestamp: Date;
    source: string;
    trigger: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

// Resumen de logros del usuario
export interface UserAchievementSummary {
  userId: string;
  totalAchievements: number;
  completedAchievements: number;
  totalPoints: number;
  completionPercentage: number;
  
  // Por categoría
  categoryStats: {
    [category: string]: {
      total: number;
      completed: number;
      points: number;
    };
  };
  
  // Últimos logros
  recentAchievements: UserAchievementProgress[];
  
  // Próximos logros (los más cercanos a completar)
  upcomingAchievements: UserAchievementProgress[];
  
  lastUpdated: Date;
}

class RobustAchievementService {
  private achievementsCollection = collection(db, 'userAchievementProgress');
  private summaryCollection = collection(db, 'userAchievementSummary');
  
  // Definición de todos los logros disponibles
  private readonly ACHIEVEMENTS: Achievement[] = [
    // Logros de reseñas
    {
      id: 'first_review',
      title: 'Primera Crítica',
      description: 'Escribe tu primera reseña',
      targetValue: 1,
      statRequired: 'totalReviews',
      icon: 'star',
      category: 'reviews',
      points: 10,
      rarity: 'common'
    },
    {
      id: 'review_enthusiast',
      title: 'Entusiasta de Críticas',
      description: 'Escribe 10 reseñas',
      targetValue: 10,
      statRequired: 'totalReviews',
      icon: 'stars',
      category: 'reviews',
      points: 50,
      rarity: 'common'
    },
    {
      id: 'review_master',
      title: 'Maestro Crítico',
      description: 'Escribe 50 reseñas',
      targetValue: 50,
      statRequired: 'totalReviews',
      icon: 'trophy',
      category: 'reviews',
      points: 200,
      rarity: 'rare'
    },
    {
      id: 'review_legend',
      title: 'Leyenda de las Críticas',
      description: 'Escribe 100 reseñas',
      targetValue: 100,
      statRequired: 'totalReviews',
      icon: 'award',
      category: 'reviews',
      points: 500,
      rarity: 'epic'
    },
    
    // Logros sociales
    {
      id: 'first_message',
      title: 'Primera Conversación',
      description: 'Envía tu primer mensaje',
      targetValue: 1,
      statRequired: 'totalMessages',
      icon: 'message-circle',
      category: 'social',
      points: 5,
      rarity: 'common'
    },
    {
      id: 'social_butterfly',
      title: 'Mariposa Social',
      description: 'Envía 50 mensajes',
      targetValue: 50,
      statRequired: 'totalMessages',
      icon: 'users',
      category: 'social',
      points: 100,
      rarity: 'rare'
    },
    
    // Logros de tiempo de música
    {
      id: 'music_lover',
      title: 'Amante de la Música',
      description: 'Escucha 60 minutos de música',
      targetValue: 60,
      statRequired: 'totalMusicTime',
      icon: 'music',
      category: 'music',
      points: 30,
      rarity: 'common'
    },
    {
      id: 'music_addict',
      title: 'Adicto a la Música',
      description: 'Escucha 10 horas de música',
      targetValue: 600,
      statRequired: 'totalMusicTime',
      icon: 'headphones',
      category: 'music',
      points: 150,
      rarity: 'rare'
    },
    
    // Logros de tiempo en la app
    {
      id: 'frequent_user',
      title: 'Usuario Frecuente',
      description: 'Usa la app durante 2 horas',
      targetValue: 120,
      statRequired: 'totalAppTime',
      icon: 'clock',
      category: 'time',
      points: 25,
      rarity: 'common'
    },
    {
      id: 'power_user',
      title: 'Usuario Avanzado',
      description: 'Usa la app durante 20 horas',
      targetValue: 1200,
      statRequired: 'totalAppTime',
      icon: 'zap',
      category: 'time',
      points: 200,
      rarity: 'epic'
    }
  ];
  
  /**
   * Inicializar o sincronizar logros del usuario
   */
  async initializeUserAchievements(userId: string): Promise<void> {
    try {
      console.log('🎯 Inicializando logros para usuario:', userId);
      
      // Obtener datos de progreso del usuario
      const progressData = await userProgressService.getUserProgressData(userId);
      console.log('📊 Datos de progreso obtenidos:', progressData);
      
      // Procesar cada logro
      for (const achievement of this.ACHIEVEMENTS) {
        await this.processAchievement(userId, achievement, progressData);
      }
      
      // Actualizar resumen
      await this.updateUserSummary(userId);
      
      console.log('✅ Inicialización de logros completada');
      
    } catch (error) {
      console.error('❌ Error inicializando logros:', error);
      throw error;
    }
  }
  
  /**
   * Procesar un logro específico para un usuario
   */
  private async processAchievement(
    userId: string, 
    achievement: Achievement, 
    progressData: UserProgressData
  ): Promise<void> {
    try {
      const achievementDocId = `${userId}_${achievement.id}`;
      const achievementRef = doc(this.achievementsCollection, achievementDocId);
      
      // Verificar si ya existe
      const existingDoc = await getDoc(achievementRef);
      
      const currentValue = progressData[achievement.statRequired] as number || 0;
      const isCompleted = currentValue >= achievement.targetValue;
      
      const now = new Date();
      
      if (!existingDoc.exists()) {
        // Crear nuevo registro
        const newProgress: Omit<UserAchievementProgress, 'id'> = {
          userId,
          achievementId: achievement.id,
          currentProgress: currentValue,
          targetProgress: achievement.targetValue,
          isCompleted,
          completedAt: isCompleted ? now : undefined,
          lastProgressUpdate: now,
          verificationCount: 1,
          dataSource: 'calculated',
          progressHistory: [{
            value: currentValue,
            timestamp: now,
            source: 'initialization',
            trigger: 'user_data_sync'
          }],
          createdAt: now,
          updatedAt: now
        };
        
        await setDoc(achievementRef, {
          ...newProgress,
          completedAt: isCompleted ? serverTimestamp() : null,
          lastProgressUpdate: serverTimestamp(),
          progressHistory: [{
            ...newProgress.progressHistory[0],
            timestamp: new Date()
          }],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`🆕 Logro ${achievement.id} creado para usuario ${userId}`);
        
      } else {
        // Actualizar existente si es necesario
        const existingData = existingDoc.data() as UserAchievementProgress;
        
        if (existingData.currentProgress !== currentValue || existingData.isCompleted !== isCompleted) {
          const updateData: Partial<UserAchievementProgress> = {
            currentProgress: currentValue,
            isCompleted,
            lastProgressUpdate: now,
            verificationCount: (existingData.verificationCount || 0) + 1,
            updatedAt: now
          };
          
          // Si se completó ahora, agregar fecha de completado
          if (isCompleted && !existingData.isCompleted) {
            updateData.completedAt = now;
            console.log(`🎉 ¡Logro ${achievement.title} completado por usuario ${userId}!`);
          }
          
          // Actualizar historial
          const newHistoryEntry = {
            value: currentValue,
            timestamp: now,
            source: 'auto_update',
            trigger: 'progress_sync'
          };
          
          await updateDoc(achievementRef, {
            ...updateData,
            completedAt: updateData.completedAt ? serverTimestamp() : existingData.completedAt,
            lastProgressUpdate: serverTimestamp(),
            updatedAt: serverTimestamp(),
            progressHistory: [
              ...(existingData.progressHistory || []),
              {
                ...newHistoryEntry,
                timestamp: new Date()
              }
            ]
          });
          
          console.log(`🔄 Logro ${achievement.id} actualizado para usuario ${userId}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error procesando logro ${achievement.id}:`, error);
    }
  }
  
  /**
   * Obtener todos los logros de un usuario
   */
  async getUserAchievements(userId: string): Promise<UserAchievementProgress[]> {
    try {
      console.log('🎯 Obteniendo logros para usuario:', userId);
      
      const q = query(
        this.achievementsCollection,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const achievements: UserAchievementProgress[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        achievements.push({
          id: doc.id,
          ...data,
          completedAt: data.completedAt?.toDate?.() || null,
          lastProgressUpdate: data.lastProgressUpdate?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          progressHistory: (data.progressHistory || []).map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate?.() || new Date()
          }))
        } as UserAchievementProgress);
      });
      
      console.log(`✅ ${achievements.length} logros obtenidos`);
      return achievements;
      
    } catch (error) {
      console.error('❌ Error obteniendo logros:', error);
      return [];
    }
  }
  
  /**
   * Actualizar resumen de logros del usuario
   */
  async updateUserSummary(userId: string): Promise<void> {
    try {
      console.log('📊 Actualizando resumen de logros para:', userId);
      
      const userAchievements = await this.getUserAchievements(userId);
      
      const completed = userAchievements.filter(a => a.isCompleted);
      const totalPoints = completed.reduce((sum, achievement) => {
        const achievementDef = this.ACHIEVEMENTS.find(def => def.id === achievement.achievementId);
        return sum + (achievementDef?.points || 0);
      }, 0);
      
      // Estadísticas por categoría
      const categoryStats: { [category: string]: { total: number; completed: number; points: number } } = {};
      
      for (const achievement of userAchievements) {
        const achievementDef = this.ACHIEVEMENTS.find(def => def.id === achievement.achievementId);
        if (!achievementDef) continue;
        
        const category = achievementDef.category;
        if (!categoryStats[category]) {
          categoryStats[category] = { total: 0, completed: 0, points: 0 };
        }
        
        categoryStats[category].total++;
        if (achievement.isCompleted) {
          categoryStats[category].completed++;
          categoryStats[category].points += achievementDef.points;
        }
      }
      
      // Logros recientes (últimos 5 completados)
      const recentAchievements = completed
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
        .slice(0, 5);
      
      // Próximos logros (los más cercanos a completar)
      const incomplete = userAchievements.filter(a => !a.isCompleted);
      const upcomingAchievements = incomplete
        .map(achievement => ({
          ...achievement,
          completionPercentage: (achievement.currentProgress / achievement.targetProgress) * 100
        }))
        .sort((a, b) => b.completionPercentage - a.completionPercentage)
        .slice(0, 3);
      
      const summary: Omit<UserAchievementSummary, 'lastUpdated'> = {
        userId,
        totalAchievements: this.ACHIEVEMENTS.length,
        completedAchievements: completed.length,
        totalPoints,
        completionPercentage: (completed.length / this.ACHIEVEMENTS.length) * 100,
        categoryStats,
        recentAchievements,
        upcomingAchievements
      };
      
      await setDoc(doc(this.summaryCollection, userId), {
        ...summary,
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Resumen de logros actualizado');
      
    } catch (error) {
      console.error('❌ Error actualizando resumen:', error);
    }
  }
  
  /**
   * Obtener resumen de logros del usuario
   */
  async getUserSummary(userId: string): Promise<UserAchievementSummary | null> {
    try {
      const summaryDoc = await getDoc(doc(this.summaryCollection, userId));
      
      if (!summaryDoc.exists()) {
        console.log('📊 Resumen no existe, creando...');
        await this.updateUserSummary(userId);
        return await this.getUserSummary(userId);
      }
      
      const data = summaryDoc.data();
      return {
        ...data,
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
        recentAchievements: (data.recentAchievements || []).map((achievement: any) => ({
          ...achievement,
          completedAt: achievement.completedAt?.toDate?.() || null,
          lastProgressUpdate: achievement.lastProgressUpdate?.toDate?.() || new Date(),
          createdAt: achievement.createdAt?.toDate?.() || new Date(),
          updatedAt: achievement.updatedAt?.toDate?.() || new Date()
        })),
        upcomingAchievements: (data.upcomingAchievements || []).map((achievement: any) => ({
          ...achievement,
          lastProgressUpdate: achievement.lastProgressUpdate?.toDate?.() || new Date(),
          createdAt: achievement.createdAt?.toDate?.() || new Date(),
          updatedAt: achievement.updatedAt?.toDate?.() || new Date()
        }))
      } as UserAchievementSummary;
      
    } catch (error) {
      console.error('❌ Error obteniendo resumen:', error);
      return null;
    }
  }
  
  /**
   * Suscribirse a cambios en logros de un usuario
   */
  subscribeToUserAchievements(
    userId: string, 
    callback: (achievements: UserAchievementProgress[]) => void
  ): () => void {
    console.log('🔔 Configurando suscripción a logros para:', userId);
    
    const q = query(
      this.achievementsCollection,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const achievements: UserAchievementProgress[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        achievements.push({
          id: doc.id,
          ...data,
          completedAt: data.completedAt?.toDate?.() || null,
          lastProgressUpdate: data.lastProgressUpdate?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          progressHistory: (data.progressHistory || []).map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate?.() || new Date()
          }))
        } as UserAchievementProgress);
      });
      
      callback(achievements);
    }, (error) => {
      console.error('❌ Error en suscripción a logros:', error);
      callback([]);
    });
  }
  
  /**
   * Forzar actualización completa de logros
   */
  async forceUpdateAllAchievements(userId: string): Promise<void> {
    try {
      console.log('🔄 Forzando actualización completa de logros...');
      
      await this.initializeUserAchievements(userId);
      
      console.log('✅ Actualización forzada completada');
      
    } catch (error) {
      console.error('❌ Error en actualización forzada:', error);
      throw error;
    }
  }
  
  /**
   * Marcar notificación de logro como mostrada
   */
  async markNotificationAsShown(userId: string, achievementId: string): Promise<void> {
    try {
      const progressRef = doc(db, 'userAchievementProgress', `${userId}_${achievementId}`);
      
      await updateDoc(progressRef, {
        notificationShown: true,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Notificación marcada como mostrada para logro: ${achievementId}`);
      
    } catch (error) {
      console.error(`❌ Error marcando notificación como mostrada para ${achievementId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtener definiciones de logros
   */
  getAchievementDefinitions(): Achievement[] {
    return [...this.ACHIEVEMENTS];
  }
  
  /**
   * Obtener definición específica de un logro
   */
  getAchievementDefinition(achievementId: string): Achievement | undefined {
    return this.ACHIEVEMENTS.find(a => a.id === achievementId);
  }
}

// Instancia singleton
export const robustAchievementService = new RobustAchievementService();