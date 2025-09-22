// Servicio de migración para sincronizar estadísticas existentes con gamificación
import { auth, db } from '../components/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { achievementService } from './AchievementService';
import { reviewService } from './ReviewService';

export class MigrationService {
  
  // Migrar estadísticas de un usuario específico
  static async migrateUserStats(userId: string): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      console.log(`🔄 Iniciando migración para usuario: ${userId}`);
      
      const migrationResults = {
        reviews: { real: 0, current: 0, migrated: 0 },
        messages: { real: 0, current: 0, migrated: 0 },
        statsCreated: false
      };
      
      // 1. Verificar/crear estadísticas base
      let userStats = await achievementService.getUserStats(userId);
      if (!userStats) {
        console.log('📊 Creando estadísticas base...');
        userStats = await achievementService.initializeUserStats(userId);
        migrationResults.statsCreated = true;
      }
      
      // 2. Migrar reseñas
      console.log('📝 Migrando reseñas...');
      const userReviews = await reviewService.getUserReviews(userId, 1000);
      const realReviewCount = userReviews.length;
      const currentReviewCount = userStats.totalReviews;
      
      migrationResults.reviews.real = realReviewCount;
      migrationResults.reviews.current = currentReviewCount;
      
      if (realReviewCount > currentReviewCount) {
        const reviewsToMigrate = realReviewCount - currentReviewCount;
        console.log(`📝 Migrando ${reviewsToMigrate} reseñas...`);
        await achievementService.incrementStat(userId, 'totalReviews', reviewsToMigrate);
        migrationResults.reviews.migrated = reviewsToMigrate;
      }
      
      // 3. Migrar mensajes
      console.log('💬 Migrando mensajes...');
      try {
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, where('userId', '==', userId));
        const messagesSnapshot = await getDocs(messagesQuery);
        const realMessageCount = messagesSnapshot.size;
        const currentMessageCount = userStats.totalMessages;
        
        migrationResults.messages.real = realMessageCount;
        migrationResults.messages.current = currentMessageCount;
        
        if (realMessageCount > currentMessageCount) {
          const messagesToMigrate = realMessageCount - currentMessageCount;
          console.log(`💬 Migrando ${messagesToMigrate} mensajes...`);
          await achievementService.incrementStat(userId, 'totalMessages', messagesToMigrate);
          migrationResults.messages.migrated = messagesToMigrate;
        }
      } catch (error: any) {
        console.warn('⚠️ No se pudieron migrar mensajes:', error.message);
      }
      
      // 4. Verificar logros después de la migración
      console.log('🏆 Verificando logros...');
      await achievementService.checkAndUnlockAchievements(userId);
      
      console.log('✅ Migración completada:', migrationResults);
      
      return {
        success: true,
        message: 'Migración completada exitosamente',
        details: migrationResults
      };
      
    } catch (error: any) {
      console.error('❌ Error en migración:', error);
      return {
        success: false,
        message: `Error en migración: ${error.message}`,
        details: null
      };
    }
  }
  
  // Migrar todos los usuarios (para admin)
  static async migrateAllUsers(): Promise<{
    success: boolean;
    message: string;
    totalUsers: number;
    successful: number;
    failed: string[];
  }> {
    try {
      console.log('🔄 Iniciando migración masiva...');
      
      // Obtener todos los usuarios únicos de reseñas
      const reviewsRef = collection(db, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsRef);
      
      const userIds = new Set<string>();
      reviewsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId) {
          userIds.add(data.userId);
        }
      });
      
      console.log(`👥 Encontrados ${userIds.size} usuarios únicos`);
      
      const results = {
        success: true,
        message: '',
        totalUsers: userIds.size,
        successful: 0,
        failed: [] as string[]
      };
      
      // Migrar cada usuario
      for (const userId of userIds) {
        try {
          console.log(`🔄 Migrando usuario: ${userId}`);
          const userResult = await this.migrateUserStats(userId);
          
          if (userResult.success) {
            results.successful++;
          } else {
            results.failed.push(userId);
          }
          
          // Pausa pequeña para no sobrecargar Firebase
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Error migrando usuario ${userId}:`, error);
          results.failed.push(userId);
        }
      }
      
      results.message = `Migración completada: ${results.successful}/${results.totalUsers} usuarios`;
      
      if (results.failed.length > 0) {
        results.success = false;
        console.warn('⚠️ Usuarios con errores:', results.failed);
      }
      
      return results;
      
    } catch (error: any) {
      console.error('❌ Error en migración masiva:', error);
      return {
        success: false,
        message: `Error en migración masiva: ${error.message}`,
        totalUsers: 0,
        successful: 0,
        failed: []
      };
    }
  }
}

export const migrationService = new MigrationService();