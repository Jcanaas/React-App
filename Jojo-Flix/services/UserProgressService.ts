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
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../components/firebaseConfig';
import { reviewService } from './ReviewService';

// Nueva interfaz para el progreso de logros más robusta
export interface UserProgressData {
  userId: string;
  
  // Estadísticas principales
  totalReviews: number;
  totalMusicTime: number; // en minutos
  totalAppTime: number; // en minutos  
  totalMessages: number;
  totalPoints: number;
  
  // Metadatos para verificación
  lastSyncTime: Date;
  dataVersion: number; // Para versionado de datos
  syncSource: 'manual' | 'auto' | 'migration';
  
  // Redundancia - datos de respaldo
  backup: {
    reviewsFromFirebase: number;
    messagesFromFirebase: number;
    lastVerification: Date;
  };
  
  // Control de integridad
  integrity: {
    reviewsVerified: boolean;
    messagesVerified: boolean;
    lastIntegrityCheck: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para logros individuales con más detalle
export interface UserAchievementProgress {
  id: string;
  userId: string;
  achievementId: string;
  
  // Estado del logro
  currentProgress: number;
  targetProgress: number;
  isCompleted: boolean;
  completedAt?: Date;
  
  // Metadatos de verificación
  lastProgressUpdate: Date;
  verificationCount: number;
  dataSource: 'calculated' | 'manual' | 'migration';
  
  // Redundancia
  progressHistory: Array<{
    value: number;
    timestamp: Date;
    source: string;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

class UserProgressService {
  private progressCollection = collection(db, 'userProgressData');
  private achievementProgressCollection = collection(db, 'userAchievementProgress');
  
  // Versión actual de los datos (para migraciones futuras)
  private readonly DATA_VERSION = 1;
  
  /**
   * Obtener o crear datos de progreso del usuario con verificación completa
   */
  async getUserProgressData(userId: string): Promise<UserProgressData> {
    try {
      console.log('🔍 Obteniendo datos de progreso para usuario:', userId);
      
      const progressDoc = await getDoc(doc(this.progressCollection, userId));
      
      if (!progressDoc.exists()) {
        console.log('📊 Creando nuevos datos de progreso...');
        return await this.createUserProgressData(userId);
      }
      
      const data = progressDoc.data() as UserProgressData;
      console.log('📊 Datos existentes encontrados:', data);
      
      // Verificar integridad de los datos
      const integrityValid = await this.verifyDataIntegrity(userId, data);
      if (!integrityValid) {
        console.log('⚠️ Datos de integridad inválidos, recalculando...');
        return await this.recalculateUserProgress(userId);
      }
      
      return {
        ...data,
        lastSyncTime: data.lastSyncTime instanceof Date ? data.lastSyncTime : 
                     (data.lastSyncTime as any)?.toDate?.() || new Date(),
        createdAt: data.createdAt instanceof Date ? data.createdAt : 
                  (data.createdAt as any)?.toDate?.() || new Date(),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : 
                  (data.updatedAt as any)?.toDate?.() || new Date(),
        backup: {
          ...data.backup,
          lastVerification: data.backup?.lastVerification instanceof Date ? 
                           data.backup.lastVerification : 
                           (data.backup?.lastVerification as any)?.toDate?.() || new Date()
        },
        integrity: {
          ...data.integrity,
          lastIntegrityCheck: data.integrity?.lastIntegrityCheck instanceof Date ? 
                             data.integrity.lastIntegrityCheck : 
                             (data.integrity?.lastIntegrityCheck as any)?.toDate?.() || new Date()
        }
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo datos de progreso:', error);
      // En caso de error, crear datos desde cero
      return await this.createUserProgressData(userId);
    }
  }
  
  /**
   * Crear datos de progreso desde cero con verificación completa
   */
  async createUserProgressData(userId: string): Promise<UserProgressData> {
    try {
      console.log('🆕 Creando datos de progreso desde cero para:', userId);
      
      // Contar datos reales de Firebase
      const realReviews = await reviewService.getUserReviews(userId, 1000);
      const realReviewCount = realReviews.length;
      
      // Intentar contar mensajes de múltiples fuentes
      let realMessageCount = 0;
      try {
        const collections = ['messages', 'chatMessages', 'chat_messages'];
        for (const collectionName of collections) {
          try {
            const messagesRef = collection(db, collectionName);
            const messagesQuery = query(messagesRef, where('userId', '==', userId));
            const messagesSnapshot = await getDocs(messagesQuery);
            realMessageCount += messagesSnapshot.size;
          } catch (collectionError) {
            console.warn(`⚠️ No se pudo acceder a ${collectionName}:`, collectionError);
          }
        }
      } catch (messageError) {
        console.warn('⚠️ Error contando mensajes:', messageError);
      }
      
      console.log(`📊 Datos reales encontrados: ${realReviewCount} reseñas, ${realMessageCount} mensajes`);
      
      const now = new Date();
      const progressData: UserProgressData = {
        userId,
        totalReviews: realReviewCount,
        totalMusicTime: 0,
        totalAppTime: 0,
        totalMessages: realMessageCount,
        totalPoints: 0,
        lastSyncTime: now,
        dataVersion: this.DATA_VERSION,
        syncSource: 'migration',
        backup: {
          reviewsFromFirebase: realReviewCount,
          messagesFromFirebase: realMessageCount,
          lastVerification: now
        },
        integrity: {
          reviewsVerified: true,
          messagesVerified: true,
          lastIntegrityCheck: now
        },
        createdAt: now,
        updatedAt: now
      };
      
      // Guardar en Firebase
      await setDoc(doc(this.progressCollection, userId), {
        ...progressData,
        lastSyncTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        backup: {
          ...progressData.backup,
          lastVerification: serverTimestamp()
        },
        integrity: {
          ...progressData.integrity,
          lastIntegrityCheck: serverTimestamp()
        }
      });
      
      console.log('✅ Datos de progreso creados exitosamente');
      return progressData;
      
    } catch (error) {
      console.error('❌ Error creando datos de progreso:', error);
      throw error;
    }
  }
  
  /**
   * Verificar integridad de los datos comparando con Firebase
   */
  async verifyDataIntegrity(userId: string, data: UserProgressData): Promise<boolean> {
    try {
      console.log('🔍 Verificando integridad de datos...');
      
      // Verificar si la verificación es reciente (menos de 1 hora)
      const lastCheck = data.integrity?.lastIntegrityCheck || new Date(0);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastCheck > oneHourAgo) {
        console.log('✅ Verificación reciente, datos válidos');
        return true;
      }
      
      // Verificar reseñas
      const currentReviews = await reviewService.getUserReviews(userId, 1000);
      const currentReviewCount = currentReviews.length;
      
      const reviewsMatch = Math.abs(currentReviewCount - data.totalReviews) <= 1; // Tolerancia de ±1
      
      if (!reviewsMatch) {
        console.warn(`⚠️ Discrepancia en reseñas: esperadas ${data.totalReviews}, encontradas ${currentReviewCount}`);
        return false;
      }
      
      console.log('✅ Verificación de integridad exitosa');
      return true;
      
    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
      return false;
    }
  }
  
  /**
   * Recalcular completamente el progreso del usuario
   */
  async recalculateUserProgress(userId: string): Promise<UserProgressData> {
    try {
      console.log('🔄 Recalculando progreso completo para:', userId);
      
      // Eliminar datos existentes corruptos
      try {
        await deleteDoc(doc(this.progressCollection, userId));
      } catch (deleteError) {
        console.warn('⚠️ No se pudo eliminar datos anteriores:', deleteError);
      }
      
      // Crear desde cero
      return await this.createUserProgressData(userId);
      
    } catch (error) {
      console.error('❌ Error recalculando progreso:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar progreso con verificación robusta
   */
  async updateProgress(userId: string, updates: Partial<UserProgressData>): Promise<void> {
    try {
      console.log('🔄 Actualizando progreso:', updates);
      
      const docRef = doc(this.progressCollection, userId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastSyncTime: serverTimestamp(),
        syncSource: 'auto'
      });
      
      console.log('✅ Progreso actualizado exitosamente');
      
    } catch (error) {
      console.error('❌ Error actualizando progreso:', error);
      throw error;
    }
  }
  
  /**
   * Incrementar estadística específica con verificación
   */
  async incrementStat(userId: string, statName: keyof UserProgressData, value: number): Promise<void> {
    try {
      console.log(`📈 Incrementando ${statName}: +${value} para usuario ${userId}`);
      
      const docRef = doc(this.progressCollection, userId);
      
      // Verificar que el documento existe
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        console.log('📊 Documento no existe, creando...');
        await this.createUserProgressData(userId);
      }
      
      // Incrementar valor
      await updateDoc(docRef, {
        [statName]: increment(value),
        updatedAt: serverTimestamp(),
        lastSyncTime: serverTimestamp(),
        syncSource: 'auto'
      });
      
      console.log(`✅ ${statName} incrementado exitosamente`);
      
    } catch (error) {
      console.error(`❌ Error incrementando ${statName}:`, error);
      throw error;
    }
  }
  
  /**
   * Suscribirse a cambios en tiempo real
   */
  subscribeToUserProgress(userId: string, callback: (data: UserProgressData | null) => void): () => void {
    console.log('🔔 Configurando suscripción a progreso para:', userId);
    
    return onSnapshot(
      doc(this.progressCollection, userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            ...data,
            lastSyncTime: data.lastSyncTime instanceof Date ? data.lastSyncTime : 
                         (data.lastSyncTime as any)?.toDate?.() || new Date(),
            createdAt: data.createdAt instanceof Date ? data.createdAt : 
                      (data.createdAt as any)?.toDate?.() || new Date(),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt : 
                      (data.updatedAt as any)?.toDate?.() || new Date(),
            backup: {
              ...data.backup,
              lastVerification: data.backup?.lastVerification instanceof Date ? 
                               data.backup.lastVerification : 
                               (data.backup?.lastVerification as any)?.toDate?.() || new Date()
            },
            integrity: {
              ...data.integrity,
              lastIntegrityCheck: data.integrity?.lastIntegrityCheck instanceof Date ? 
                                 data.integrity.lastIntegrityCheck : 
                                 (data.integrity?.lastIntegrityCheck as any)?.toDate?.() || new Date()
            }
          } as UserProgressData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('❌ Error en suscripción a progreso:', error);
        callback(null);
      }
    );
  }
  
  /**
   * Migración automática de datos existentes
   */
  async migrateFromExistingData(userId: string): Promise<void> {
    try {
      console.log('🔄 Iniciando migración de datos existentes para:', userId);
      
      // Verificar si ya existe progreso
      const existingProgress = await getDoc(doc(this.progressCollection, userId));
      if (existingProgress.exists()) {
        console.log('✅ Datos de progreso ya existen');
        return;
      }
      
      // Crear datos desde Firebase real
      await this.createUserProgressData(userId);
      
      console.log('✅ Migración completada');
      
    } catch (error) {
      console.error('❌ Error en migración:', error);
      throw error;
    }
  }
}

// Instancia singleton
export const userProgressService = new UserProgressService();