import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../components/firebaseConfig';

// Tipos de logros disponibles
export enum AchievementType {
  REVIEWS = 'reviews',
  MUSIC_TIME = 'music_time',
  APP_TIME = 'app_time',
  MESSAGES = 'messages',
  MOVIES_WATCHED = 'movies_watched',
  SOCIAL = 'social',
  STREAK = 'streak',
  SPECIAL = 'special'
}

// Categorías de logros para organización
export enum AchievementCategory {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  LEGENDARY = 'legendary'
}

// Interfaz para definir un logro
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: AchievementType;
  category: AchievementCategory;
  requirement: number;
  points: number;
  isSecret?: boolean;
  color?: string;
}

// Interfaz para el progreso del usuario en un logro
export interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  isUnlocked: boolean;
  progress: number;
  unlockedAt?: Date;
  notificationShown?: boolean;
}

// Estadísticas del usuario
export interface UserStats {
  userId: string;
  totalReviews: number;
  totalMusicTime: number; // en minutos
  totalAppTime: number; // en minutos
  totalMessages: number;
  moviesWatched: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  level: number;
  experience: number;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class AchievementService {
  private userStatsCollection = collection(db, 'userStats');
  private userAchievementsCollection = collection(db, 'userAchievements');
  
  // Throttling para evitar llamadas demasiado frecuentes
  private lastCheckTime: { [userId: string]: number } = {};
  private readonly CHECK_COOLDOWN = 5000; // 5 segundos entre verificaciones por usuario

  // Definición de todos los logros disponibles
  private achievements: Achievement[] = [
    // REVIEWS - Logros de reseñas
    {
      id: 'first_review',
      title: 'Primer Crítico',
      description: 'Escribe tu primera reseña',
      icon: 'rate-review',
      type: AchievementType.REVIEWS,
      category: AchievementCategory.BEGINNER,
      requirement: 1,
      points: 10,
      color: '#DF2892'
    },
    {
      id: 'review_enthusiast',
      title: 'Entusiasta de Reseñas',
      description: 'Escribe 5 reseñas',
      icon: 'reviews',
      type: AchievementType.REVIEWS,
      category: AchievementCategory.BEGINNER,
      requirement: 5,
      points: 25,
      color: '#DF2892'
    },
    {
      id: 'review_expert',
      title: 'Experto Crítico',
      description: 'Escribe 25 reseñas',
      icon: 'star',
      type: AchievementType.REVIEWS,
      category: AchievementCategory.INTERMEDIATE,
      requirement: 25,
      points: 100,
      color: '#E91E63'
    },
    {
      id: 'review_master',
      title: 'Maestro de la Crítica',
      description: 'Escribe 100 reseñas',
      icon: 'emoji-events',
      type: AchievementType.REVIEWS,
      category: AchievementCategory.EXPERT,
      requirement: 100,
      points: 500,
      color: '#FF1744'
    },

    // MUSIC TIME - Logros de tiempo escuchando música
    {
      id: 'music_lover',
      title: 'Amante de la Música',
      description: 'Escucha música por 30 minutos',
      icon: 'music-note',
      type: AchievementType.MUSIC_TIME,
      category: AchievementCategory.BEGINNER,
      requirement: 30,
      points: 15,
      color: '#DF2892'
    },
    {
      id: 'music_addict',
      title: 'Adicto a la Música',
      description: 'Escucha música por 5 horas',
      icon: 'headset',
      type: AchievementType.MUSIC_TIME,
      category: AchievementCategory.INTERMEDIATE,
      requirement: 300,
      points: 75,
      color: '#E91E63'
    },
    {
      id: 'music_marathon',
      title: 'Maratón Musical',
      description: 'Escucha música por 24 horas',
      icon: 'album',
      type: AchievementType.MUSIC_TIME,
      category: AchievementCategory.ADVANCED,
      requirement: 1440,
      points: 200,
      color: '#FF1744'
    },
    {
      id: 'music_legend',
      title: 'Leyenda Musical',
      description: 'Escucha música por 100 horas',
      icon: 'piano',
      type: AchievementType.MUSIC_TIME,
      category: AchievementCategory.LEGENDARY,
      requirement: 6000,
      points: 1000,
      color: '#FF6B35'
    },

    // APP TIME - Logros de tiempo en la app
    {
      id: 'first_hour',
      title: 'Primera Hora',
      description: 'Pasa tu primera hora en la app',
      icon: 'schedule',
      type: AchievementType.APP_TIME,
      category: AchievementCategory.BEGINNER,
      requirement: 60,
      points: 20,
      color: '#DF2892'
    },
    {
      id: 'time_explorer',
      title: 'Explorador del Tiempo',
      description: 'Pasa 10 horas en la app',
      icon: 'access-time',
      type: AchievementType.APP_TIME,
      category: AchievementCategory.INTERMEDIATE,
      requirement: 600,
      points: 100,
      color: '#E91E63'
    },
    {
      id: 'time_master',
      title: 'Maestro del Tiempo',
      description: 'Pasa 50 horas en la app',
      icon: 'timer',
      type: AchievementType.APP_TIME,
      category: AchievementCategory.ADVANCED,
      requirement: 3000,
      points: 300,
      color: '#FF1744'
    },

    // MESSAGES - Logros de mensajes en chat
    {
      id: 'first_message',
      title: 'Primer Mensaje',
      description: 'Envía tu primer mensaje',
      icon: 'chat',
      type: AchievementType.MESSAGES,
      category: AchievementCategory.BEGINNER,
      requirement: 1,
      points: 5,
      color: '#DF2892'
    },
    {
      id: 'chatty',
      title: 'Conversador',
      description: 'Envía 50 mensajes',
      icon: 'chat-bubble',
      type: AchievementType.MESSAGES,
      category: AchievementCategory.BEGINNER,
      requirement: 50,
      points: 30,
      color: '#DF2892'
    },
    {
      id: 'social_butterfly',
      title: 'Mariposa Social',
      description: 'Envía 500 mensajes',
      icon: 'forum',
      type: AchievementType.MESSAGES,
      category: AchievementCategory.INTERMEDIATE,
      requirement: 500,
      points: 150,
      color: '#E91E63'
    },
    {
      id: 'chat_master',
      title: 'Maestro del Chat',
      description: 'Envía 2000 mensajes',
      icon: 'speaker-notes',
      type: AchievementType.MESSAGES,
      category: AchievementCategory.EXPERT,
      requirement: 2000,
      points: 400,
      color: '#FF1744'
    },

    // SPECIAL - Logros especiales
    {
      id: 'early_bird',
      title: 'Madrugador',
      description: 'Usa la app entre 5:00 y 7:00 AM',
      icon: 'wb-sunny',
      type: AchievementType.SPECIAL,
      category: AchievementCategory.INTERMEDIATE,
      requirement: 1,
      points: 50,
      color: '#FF6B35',
      isSecret: true
    },
    {
      id: 'night_owl',
      title: 'Búho Nocturno',
      description: 'Usa la app entre 11:00 PM y 2:00 AM',
      icon: 'brightness-3',
      type: AchievementType.SPECIAL,
      category: AchievementCategory.INTERMEDIATE,
      requirement: 1,
      points: 50,
      color: '#9C27B0',
      isSecret: true
    },
    {
      id: 'weekend_warrior',
      title: 'Guerrero del Fin de Semana',
      description: 'Usa la app durante 5 fines de semana consecutivos',
      icon: 'weekend',
      type: AchievementType.SPECIAL,
      category: AchievementCategory.ADVANCED,
      requirement: 5,
      points: 100,
      color: '#FF1744'
    }
  ];

  // Obtener todas las definiciones de logros
  getAllAchievements(): Achievement[] {
    return this.achievements;
  }

  // Función para limpiar documentos con IDs vacíos (usar una sola vez)
  async cleanupInvalidAchievements(userId: string): Promise<void> {
    try {
      console.log('Limpiando achievements con IDs vacíos para usuario:', userId);
      
      const q = query(
        this.userAchievementsCollection,
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      let deletedCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Si el documento tiene un ID vacío en los datos, eliminarlo
        if (data.id === '' || !data.id) {
          console.log('Eliminando documento con ID vacío:', data);
          batch.delete(doc.ref);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`Eliminados ${deletedCount} documentos con IDs vacíos`);
      } else {
        console.log('No se encontraron documentos con IDs vacíos');
      }
    } catch (error) {
      console.error('Error limpiando achievements inválidos:', error);
    }
  }

  // Obtener logros por categoría
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.achievements.filter(achievement => achievement.category === category);
  }

  // Obtener logros por tipo
  getAchievementsByType(type: AchievementType): Achievement[] {
    return this.achievements.filter(achievement => achievement.type === type);
  }

  // Obtener estadísticas del usuario
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const userStatsDoc = await getDoc(doc(this.userStatsCollection, userId));
      
      if (userStatsDoc.exists()) {
        const data = userStatsDoc.data();
        return {
          ...data,
          lastActive: data.lastActive?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as UserStats;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo estadísticas del usuario:', error);
      return null;
    }
  }

  // Inicializar estadísticas para un nuevo usuario
  async initializeUserStats(userId: string): Promise<UserStats> {
    const initialStats: UserStats = {
      userId,
      totalReviews: 0,
      totalMusicTime: 0,
      totalAppTime: 0,
      totalMessages: 0,
      moviesWatched: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      level: 1,
      experience: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await setDoc(doc(this.userStatsCollection, userId), {
        ...initialStats,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return initialStats;
    } catch (error) {
      console.error('Error inicializando estadísticas del usuario:', error);
      throw error;
    }
  }

  // Actualizar estadísticas del usuario
  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<void> {
    try {
      await updateDoc(doc(this.userStatsCollection, userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando estadísticas del usuario:', error);
      throw error;
    }
  }

  // Incrementar estadísticas específicas
  async incrementStat(userId: string, statName: keyof UserStats, value: number = 1): Promise<void> {
    try {
      // Validar que userId no esté vacío
      if (!userId || userId.trim() === '') {
        console.error('Error: userId está vacío en incrementStat');
        throw new Error('UserId no puede estar vacío');
      }

      const updates: any = {
        [statName]: increment(value),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(this.userStatsCollection, userId), updates);

      // Solo verificar logros si NO es totalPoints (para evitar bucle infinito)
      if (statName !== 'totalPoints') {
        // Throttling: solo verificar logros si han pasado al menos 5 segundos
        const now = Date.now();
        const lastCheck = this.lastCheckTime[userId] || 0;
        const timeSinceLastCheck = now - lastCheck;
        
        console.log(`🔍 Verificando throttling para ${userId}: tiempo desde último check = ${timeSinceLastCheck}ms (cooldown = ${this.CHECK_COOLDOWN}ms)`);
        
        if (timeSinceLastCheck >= this.CHECK_COOLDOWN) {
          console.log(`✅ Ejecutando verificación de logros para ${userId} (${statName}: +${value})`);
          this.lastCheckTime[userId] = now;
          await this.checkAndUnlockAchievements(userId);
        } else {
          console.log(`⏳ Verificación de logros en cooldown para ${userId} (faltan ${this.CHECK_COOLDOWN - timeSinceLastCheck}ms)`);
        }
      } else {
        console.log(`💰 Incrementando puntos directamente: ${value} para ${userId} (sin verificar logros)`);
      }
    } catch (error) {
      console.error(`Error incrementando ${statName}:`, error);
      throw error;
    }
  }

  // Incrementar estadísticas sin verificar logros (para uso interno)
  private async incrementStatWithoutChecking(userId: string, statName: keyof UserStats, value: number = 1): Promise<void> {
    try {
      if (!userId || userId.trim() === '') {
        console.error('Error: userId está vacío en incrementStatWithoutChecking');
        throw new Error('UserId no puede estar vacío');
      }

      // Log especial para puntos
      if (statName === 'totalPoints') {
        console.log(`💰 Incrementando puntos: +${value} para usuario ${userId}`);
      }

      const updates: any = {
        [statName]: increment(value),
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(this.userStatsCollection, userId), updates);
    } catch (error) {
      console.error(`Error incrementando ${statName} (sin verificación):`, error);
      throw error;
    }
  }

  // Obtener logros del usuario
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      // Validar que userId no esté vacío
      if (!userId || userId.trim() === '') {
        console.error('Error: userId está vacío en getUserAchievements');
        return [];
      }

      const q = query(
        this.userAchievementsCollection,
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const achievements: UserAchievement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Validar que el documento tenga un ID válido
        if (!doc.id || doc.id.trim() === '') {
          console.error('Documento de achievement sin ID válido:', data);
          return;
        }

        achievements.push({
          id: doc.id,
          ...data,
          unlockedAt: data.unlockedAt?.toDate()
        } as UserAchievement);
      });

      return achievements;
    } catch (error) {
      console.error('Error obteniendo logros del usuario:', error);
      return [];
    }
  }

  // Verificar y desbloquear logros
  async checkAndUnlockAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      // Validar que userId no esté vacío
      if (!userId || userId.trim() === '') {
        console.error('Error: userId está vacío en checkAndUnlockAchievements');
        return [];
      }

      console.log('Verificando logros para usuario:', userId);

      const userStats = await this.getUserStats(userId);
      if (!userStats) {
        console.log('No se encontraron estadísticas de usuario, inicializando...');
        await this.initializeUserStats(userId);
        return [];
      }

      const userAchievements = await this.getUserAchievements(userId);
      console.log('UserAchievements obtenidos:', userAchievements.length);
      
      const unlockedAchievements: UserAchievement[] = [];

      for (const achievement of this.achievements) {
        const existingUserAchievement = userAchievements.find(
          ua => ua.achievementId === achievement.id
        );

        if (existingUserAchievement?.isUnlocked) continue;

        const progress = this.calculateProgress(achievement, userStats);
        const isUnlocked = progress >= achievement.requirement;

        if (existingUserAchievement) {
          // Actualizar progreso existente
          if (existingUserAchievement.progress !== progress || isUnlocked) {
            // Validar que el ID del achievement no esté vacío
            if (!existingUserAchievement.id || existingUserAchievement.id.trim() === '') {
              console.error('Error: existingUserAchievement.id está vacío', existingUserAchievement);
              continue;
            }

            // IMPORTANTE: Solo otorgar puntos si el logro NO estaba desbloqueado antes
            const wasAlreadyUnlocked = existingUserAchievement.isUnlocked;

            await updateDoc(doc(this.userAchievementsCollection, existingUserAchievement.id), {
              progress,
              isUnlocked,
              unlockedAt: isUnlocked ? serverTimestamp() : null,
              notificationShown: false
            });

            if (isUnlocked && !wasAlreadyUnlocked) {
              // Solo incrementar puntos si se acaba de desbloquear (no estaba desbloqueado antes)
              console.log(`🏆 Logro desbloqueado (existente): ${achievement.title} - Otorgando ${achievement.points} puntos`);
              await this.incrementStatWithoutChecking(userId, 'totalPoints', achievement.points);
              
              unlockedAchievements.push({
                ...existingUserAchievement,
                progress,
                isUnlocked,
                unlockedAt: new Date()
              });
            } else if (isUnlocked && wasAlreadyUnlocked) {
              console.log(`⚠️ Logro ya estaba desbloqueado: ${achievement.title} - NO se otorgan puntos`);
            }
          }
        } else {
          // Crear nuevo progreso de logro
          const docRef = doc(this.userAchievementsCollection);
          
          const newUserAchievement: UserAchievement = {
            id: docRef.id, // Asignar el ID inmediatamente
            achievementId: achievement.id,
            userId,
            isUnlocked,
            progress,
            notificationShown: false
          };

          if (isUnlocked) {
            newUserAchievement.unlockedAt = new Date();
            // Incrementar puntos del usuario SIN verificar logros (evitar bucle)
            console.log(`🏆 Logro desbloqueado (nuevo): ${achievement.title} - Otorgando ${achievement.points} puntos`);
            await this.incrementStatWithoutChecking(userId, 'totalPoints', achievement.points);
            unlockedAchievements.push(newUserAchievement);
          }

          await setDoc(docRef, {
            ...newUserAchievement,
            unlockedAt: isUnlocked ? serverTimestamp() : null
          });
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error verificando logros:', error);
      return [];
    }
  }

  // Calcular progreso hacia un logro
  private calculateProgress(achievement: Achievement, userStats: UserStats): number {
    switch (achievement.type) {
      case AchievementType.REVIEWS:
        return userStats.totalReviews;
      case AchievementType.MUSIC_TIME:
        return userStats.totalMusicTime;
      case AchievementType.APP_TIME:
        return userStats.totalAppTime;
      case AchievementType.MESSAGES:
        return userStats.totalMessages;
      case AchievementType.MOVIES_WATCHED:
        return userStats.moviesWatched;
      case AchievementType.STREAK:
        return userStats.currentStreak;
      case AchievementType.SPECIAL:
        // Los logros especiales requieren lógica personalizada
        return this.calculateSpecialProgress(achievement.id, userStats);
      default:
        return 0;
    }
  }

  // Calcular progreso para logros especiales
  private calculateSpecialProgress(achievementId: string, userStats: UserStats): number {
    // Por ahora retorna 0, se implementará lógica específica después
    return 0;
  }

  // Marcar notificación como mostrada
  async markNotificationShown(userAchievementId: string): Promise<void> {
    try {
      // Validar que el ID no esté vacío
      if (!userAchievementId || userAchievementId.trim() === '') {
        console.error('Error: userAchievementId está vacío en markNotificationShown');
        return;
      }

      await updateDoc(doc(this.userAchievementsCollection, userAchievementId), {
        notificationShown: true
      });
    } catch (error) {
      console.error('Error marcando notificación como mostrada:', error);
    }
  }

  // Calcular nivel basado en experiencia/puntos
  calculateLevel(totalPoints: number): number {
    // Fórmula: nivel = floor(sqrt(puntos / 100)) + 1
    return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  }

  // Obtener puntos necesarios para el siguiente nivel
  getPointsForNextLevel(currentLevel: number): number {
    return Math.pow(currentLevel, 2) * 100;
  }

  // Suscribirse a cambios en estadísticas del usuario
  subscribeToUserStats(userId: string, callback: (stats: UserStats | null) => void): () => void {
    // Validar que userId no esté vacío
    if (!userId || userId.trim() === '') {
      console.error('Error: userId está vacío en subscribeToUserStats');
      callback(null);
      return () => {}; // Retornar función vacía para cleanup
    }

    return onSnapshot(
      doc(this.userStatsCollection, userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            ...data,
            lastActive: data.lastActive?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as UserStats);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error en suscripción a estadísticas:', error);
        callback(null);
      }
    );
  }

  // Suscribirse a cambios en logros del usuario
  subscribeToUserAchievements(userId: string, callback: (achievements: UserAchievement[]) => void): () => void {
    // Validar que userId no esté vacío
    if (!userId || userId.trim() === '') {
      console.error('Error: userId está vacío en subscribeToUserAchievements');
      callback([]);
      return () => {}; // Retornar función vacía para cleanup
    }

    const q = query(
      this.userAchievementsCollection,
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const achievements: UserAchievement[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Validar que el documento tenga un ID válido
          if (!doc.id || doc.id.trim() === '') {
            console.error('Documento de achievement sin ID válido en suscripción:', data);
            return;
          }

          achievements.push({
            id: doc.id,
            ...data,
            unlockedAt: data.unlockedAt?.toDate()
          } as UserAchievement);
        });
        callback(achievements);
      },
      (error) => {
        console.error('Error en suscripción a logros:', error);
        callback([]);
      }
    );
  }
}

// Instancia singleton del servicio
export const achievementService = new AchievementService();