import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  deleteDoc, 
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
  writeBatch 
} from 'firebase/firestore';
import { auth, db } from '../components/firebaseConfig';
import { userProfileService } from './UserProfileService';
import { userProgressService } from './UserProgressService';

export interface UserReview {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  movieId: string;
  movieTitle: string;
  moviePoster?: string | null;
  rating: number; // 1-5 estrellas
  reviewText: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
  reported: boolean;
  spoilerWarning: boolean;
  helpful: number;
  helpfulBy: string[];
}

export interface MovieStats {
  movieId: string;
  totalReviews: number;
  averageRating: number;
  ratingsDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

class ReviewService {
  private reviewsCollection = collection(db, 'reviews');
  private statsCollection = collection(db, 'movieStats');

  // Función privada para limpiar undefined values
  private cleanFirestoreData(data: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // Crear una nueva reseña
  async createReview(reviewData: Omit<UserReview, 'id' | 'timestamp' | 'likes' | 'likedBy' | 'reported' | 'helpful' | 'helpfulBy'>): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      console.log('📝 REVIEW SERVICE: Creando reseña con movieId:', reviewData.movieId);
      console.log('📝 REVIEW SERVICE: Datos de entrada:', {
        userId: reviewData.userId,
        movieId: reviewData.movieId,
        movieTitle: reviewData.movieTitle,
        rating: reviewData.rating
      });

      // Verificar si el usuario ya ha reseñado esta película
      const existingReview = await this.getUserReviewForMovie(reviewData.movieId, user.uid);
      if (existingReview) {
        throw new Error('Ya has escrito una reseña para esta película');
      }

      // Preparar datos para Firestore con datos mejorados del perfil
      const displayName = await userProfileService.getDisplayName();
      const userAvatar = await userProfileService.getUserAvatar();

      const reviewDataForFirestore = {
        userId: user.uid,
        userName: displayName,
        userAvatar: userAvatar,
        movieId: reviewData.movieId,
        movieTitle: reviewData.movieTitle,
        moviePoster: reviewData.moviePoster,
        rating: reviewData.rating,
        reviewText: reviewData.reviewText,
        spoilerWarning: reviewData.spoilerWarning || false,
        timestamp: new Date(),
        likes: 0,
        likedBy: [],
        reported: false,
        helpful: 0,
        helpfulBy: []
      };

      // Limpiar undefined values antes de enviar a Firestore
      const cleanData = this.cleanFirestoreData(reviewDataForFirestore);
      
      console.log('📝 Datos a enviar a Firestore:', cleanData);

      const docRef = await addDoc(this.reviewsCollection, cleanData);
      
      // Actualizar estadísticas de la película
      await this.updateMovieStats(reviewData.movieId);
      
      // Actualizar estadísticas del usuario
      await userProfileService.updateUserStats(user.uid);
      
      // 🎮 GAMIFICACIÓN: Incrementar contador de reseñas
      try {
        await userProgressService.incrementStat(user.uid, 'totalReviews', 1);
        console.log('🏆 Estadísticas de gamificación actualizadas: +1 reseña');
      } catch (gamificationError) {
        console.error('⚠️ Error actualizando gamificación:', gamificationError);
        // No afecta la funcionalidad principal, solo registrar el error
      }
      
      console.log('✅ Reseña creada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando reseña:', error);
      throw error;
    }
  }

  // Obtener reseñas de una película específica
  async getMovieReviews(movieId: string, limitCount: number = 20): Promise<UserReview[]> {
    try {
      console.log('🔍 Buscando reseñas para movieId:', movieId);
      console.log('📊 Límite de resultados:', limitCount);
      
      // Intentar primero con la consulta completa (requiere índice)
      try {
        const q = query(
          this.reviewsCollection,
          where('movieId', '==', movieId),
          where('reported', '==', false),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );

        console.log('📝 Query con índice preparada, ejecutando...');
        const querySnapshot = await getDocs(q);
        const reviews: UserReview[] = [];

        console.log('📄 Documentos encontrados:', querySnapshot.size);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📋 Documento de reseña:', doc.id, data);
          reviews.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate()
          } as UserReview);
        });

        console.log(`✅ Obtenidas ${reviews.length} reseñas para película ${movieId}`);
        return reviews;
        
      } catch (indexError: any) {
        // Si falla por falta de índice, intentar sin orderBy
        console.log('⚠️ Error con índice, intentando consulta simple:', indexError.code);
        
        if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
          console.log('💡 Usando consulta sin orderBy...');
          
          const simpleQuery = query(
            this.reviewsCollection,
            where('movieId', '==', movieId),
            where('reported', '==', false)
          );

          const querySnapshot = await getDocs(simpleQuery);
          const reviews: UserReview[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            reviews.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp.toDate()
            } as UserReview);
          });

          // Ordenar manualmente por timestamp
          reviews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          
          // Aplicar límite manualmente
          const limitedReviews = reviews.slice(0, limitCount);
          
          console.log(`✅ Obtenidas ${limitedReviews.length} reseñas (consulta simple) para película ${movieId}`);
          return limitedReviews;
        }
        
        throw indexError;
      }
      
    } catch (error: any) {
      console.error('❌ Error obteniendo reseñas:', error);
      console.error('❌ Código de error:', error.code);
      console.error('❌ Mensaje de error:', error.message);
      
      // Si es un error de permisos, devolver array vacío
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.log('⚠️ Permisos insuficientes para leer reseñas');
        return [];
      }
      
      return [];
    }
  }

  // Obtener reseñas de un usuario específico
  async getUserReviews(userId: string, limitCount: number = 10): Promise<UserReview[]> {
    try {
      console.log('👤 Buscando reseñas del usuario:', userId);
      console.log('📊 Límite de resultados:', limitCount);
      
      // Intentar primero con orderBy
      try {
        const q = query(
          this.reviewsCollection,
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );

        console.log('📝 Query con índice preparada para usuario, ejecutando...');
        const querySnapshot = await getDocs(q);
        const reviews: UserReview[] = [];

        console.log('📄 Documentos de usuario encontrados:', querySnapshot.size);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📋 Reseña de usuario:', doc.id, {
            movieId: data.movieId,
            movieTitle: data.movieTitle,
            rating: data.rating,
            timestamp: data.timestamp
          });
          reviews.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate()
          } as UserReview);
        });

        console.log(`✅ Obtenidas ${reviews.length} reseñas del usuario ${userId}`);
        return reviews;
        
      } catch (indexError: any) {
        // Si falla por falta de índice, intentar sin orderBy
        console.log('⚠️ Error con índice de usuario, intentando consulta simple:', indexError.code);
        
        if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
          console.log('💡 Usando consulta simple para usuario...');
          
          const simpleQuery = query(
            this.reviewsCollection,
            where('userId', '==', userId)
          );

          const querySnapshot = await getDocs(simpleQuery);
          const reviews: UserReview[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            reviews.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp.toDate()
            } as UserReview);
          });

          // Ordenar manualmente por timestamp
          reviews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          
          // Aplicar límite manualmente
          const limitedReviews = reviews.slice(0, limitCount);
          
          console.log(`✅ Obtenidas ${limitedReviews.length} reseñas (consulta simple) del usuario ${userId}`);
          return limitedReviews;
        }
        
        throw indexError;
      }
      
    } catch (error: any) {
      console.error('❌ Error obteniendo reseñas del usuario:', error);
      console.error('❌ Código de error:', error.code);
      console.error('❌ Mensaje de error:', error.message);
      
      return [];
    }
  }

  // Verificar si el usuario ya ha reseñado una película
  async getUserReviewForMovie(movieId: string, userId: string): Promise<UserReview | null> {
    try {
      console.log('🔍 Verificando reseña existente para:', { movieId, userId });
      
      // Verificar si el usuario está autenticado
      const user = auth.currentUser;
      if (!user) {
        console.log('❌ Usuario no autenticado');
        return null;
      }

      const q = query(
        this.reviewsCollection,
        where('movieId', '==', movieId),
        where('userId', '==', userId)
      );

      console.log('📝 Query para reseña específica preparada, ejecutando...');
      const querySnapshot = await getDocs(q);
      
      console.log('📄 Documentos encontrados para reseña específica:', querySnapshot.size);
      
      if (querySnapshot.empty) {
        console.log('❌ No se encontró reseña del usuario para esta película');
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      console.log('✅ Reseña encontrada:', {
        id: doc.id,
        movieTitle: data.movieTitle,
        rating: data.rating,
        moviePoster: data.moviePoster
      });
      
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp.toDate()
      } as UserReview;
    } catch (error: any) {
      console.error('❌ Error verificando reseña existente:', error);
      
      // Si es un error de permisos, devolver null en lugar de lanzar error
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.log('⚠️ Permisos insuficientes - asumiendo que no hay reseña existente');
        return null;
      }
      
      // Para otros errores, devolver null también para evitar bloquear la app
      return null;
    }
  }

  // Dar like a una reseña
  async likeReview(reviewId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const reviewRef = doc(this.reviewsCollection, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) throw new Error('Reseña no encontrada');

      const reviewData = reviewDoc.data() as UserReview;
      const hasLiked = reviewData.likedBy?.includes(user.uid);

      if (hasLiked) {
        // Quitar like
        await updateDoc(reviewRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
      } else {
        // Dar like
        await updateDoc(reviewRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
      }

      console.log(`✅ ${hasLiked ? 'Removido' : 'Agregado'} like a reseña ${reviewId}`);
    } catch (error) {
      console.error('❌ Error con like de reseña:', error);
      throw error;
    }
  }

  // Marcar reseña como útil
  async markHelpful(reviewId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const reviewRef = doc(this.reviewsCollection, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) throw new Error('Reseña no encontrada');

      const reviewData = reviewDoc.data() as UserReview;
      const hasMarked = reviewData.helpfulBy?.includes(user.uid);

      if (hasMarked) {
        await updateDoc(reviewRef, {
          helpful: increment(-1),
          helpfulBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(reviewRef, {
          helpful: increment(1),
          helpfulBy: arrayUnion(user.uid)
        });
      }

      console.log(`✅ ${hasMarked ? 'Removido' : 'Marcado'} como útil reseña ${reviewId}`);
    } catch (error) {
      console.error('❌ Error marcando reseña como útil:', error);
      throw error;
    }
  }

  // Función específica para actualizar solo el movieId de una reseña
  async updateReviewMovieId(reviewId: string, newMovieId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const reviewRef = doc(this.reviewsCollection, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) throw new Error('Reseña no encontrada');

      const reviewData = reviewDoc.data() as UserReview;
      
      // Verificar que el usuario es el autor
      if (reviewData.userId !== user.uid) {
        throw new Error('No tienes permisos para editar esta reseña');
      }

      console.log(`🔧 Actualizando movieId: ${reviewData.movieId} → ${newMovieId}`);

      await updateDoc(reviewRef, {
        movieId: newMovieId,
        timestamp: new Date() // Actualizar timestamp para reflejar el cambio
      });

      console.log('✅ MovieId actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando movieId:', error);
      throw error;
    }
  }

  // Actualizar reseña existente
  async updateReview(reviewId: string, updates: Partial<Pick<UserReview, 'rating' | 'reviewText' | 'spoilerWarning'>>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const reviewRef = doc(this.reviewsCollection, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) throw new Error('Reseña no encontrada');

      const reviewData = reviewDoc.data() as UserReview;
      
      // Verificar que el usuario es el autor
      if (reviewData.userId !== user.uid) {
        throw new Error('No tienes permisos para editar esta reseña');
      }

      // Limpiar undefined values de las actualizaciones
      const cleanUpdates = this.cleanFirestoreData({
        ...updates,
        timestamp: new Date()
      });

      await updateDoc(reviewRef, cleanUpdates);

      // Si se cambió el rating, actualizar estadísticas
      if (updates.rating) {
        await this.updateMovieStats(reviewData.movieId);
      }

      console.log('✅ Reseña actualizada:', reviewId);
    } catch (error) {
      console.error('❌ Error actualizando reseña:', error);
      throw error;
    }
  }

  // Eliminar reseña
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const reviewRef = doc(this.reviewsCollection, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) throw new Error('Reseña no encontrada');

      const reviewData = reviewDoc.data() as UserReview;
      
      // Verificar que el usuario es el autor
      if (reviewData.userId !== user.uid) {
        throw new Error('No tienes permisos para eliminar esta reseña');
      }

      await deleteDoc(reviewRef);
      
      // Actualizar estadísticas
      await this.updateMovieStats(reviewData.movieId);
      
      console.log('✅ Reseña eliminada:', reviewId);
    } catch (error) {
      console.error('❌ Error eliminando reseña:', error);
      throw error;
    }
  }

  // Obtener estadísticas de una película
  async getMovieStats(movieId: string): Promise<MovieStats | null> {
    try {
      const statsRef = doc(this.statsCollection, movieId);
      const statsDoc = await getDoc(statsRef);
      
      if (!statsDoc.exists()) return null;
      
      return statsDoc.data() as MovieStats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }

  // Actualizar estadísticas de película (función privada)
  private async updateMovieStats(movieId: string): Promise<void> {
    try {
      // Obtener todas las reseñas de la película
      const q = query(
        this.reviewsCollection,
        where('movieId', '==', movieId),
        where('reported', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const reviews: UserReview[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push(data as UserReview);
      });

      if (reviews.length === 0) {
        // Si no hay reseñas, eliminar estadísticas
        const statsRef = doc(this.statsCollection, movieId);
        try {
          await deleteDoc(statsRef);
        } catch (error) {
          // Documento no existe, no pasa nada
        }
        return;
      }

      // Calcular estadísticas
      const totalReviews = reviews.length;
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / totalReviews;

      const ratingsDistribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length,
      };

      // Guardar/actualizar estadísticas
      const statsRef = doc(this.statsCollection, movieId);
      const statsData = {
        movieId,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingsDistribution
      };
      
      await updateDoc(statsRef, statsData).catch(async () => {
        // Si el documento no existe, crearlo
        await addDoc(this.statsCollection, statsData);
      });

      console.log('✅ Estadísticas actualizadas para película:', movieId);
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }

  // Reportar reseña
  async reportReview(reviewId: string, reason: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const reviewRef = doc(this.reviewsCollection, reviewId);
      await updateDoc(reviewRef, {
        reported: true
      });

      // Aquí podrías agregar lógica para notificar a moderadores
      console.log('✅ Reseña reportada:', reviewId, 'Razón:', reason);
    } catch (error) {
      console.error('❌ Error reportando reseña:', error);
      throw error;
    }
  }

  // Obtener mejores reseñas (más útiles)
  async getTopReviews(movieId: string, limitCount: number = 5): Promise<UserReview[]> {
    try {
      const q = query(
        this.reviewsCollection,
        where('movieId', '==', movieId),
        where('reported', '==', false),
        orderBy('helpful', 'desc'),
        orderBy('likes', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const reviews: UserReview[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as UserReview);
      });

      return reviews;
    } catch (error) {
      console.error('❌ Error obteniendo mejores reseñas:', error);
      return [];
    }
  }

  // Función para actualizar reseñas existentes con datos correctos del usuario
  async updateExistingReviewsUserData(): Promise<void> {
    try {
      console.log('🔄 Actualizando datos de usuario en reseñas existentes...');
      
      const reviewsQuery = query(this.reviewsCollection, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(reviewsQuery);
      
      const batch = writeBatch(db);
      let updateCount = 0;

      for (const docSnap of snapshot.docs) {
        const reviewData = docSnap.data() as UserReview;
        
        // Obtener datos actualizados del usuario
        const correctUserName = await userProfileService.getDisplayName(reviewData.userId);
        const correctUserAvatar = await userProfileService.getUserAvatar(reviewData.userId);
        
        // Solo actualizar si los datos son diferentes
        if (reviewData.userName !== correctUserName || reviewData.userAvatar !== correctUserAvatar) {
          batch.update(doc(this.reviewsCollection, docSnap.id), {
            userName: correctUserName,
            userAvatar: correctUserAvatar
          });
          updateCount++;
          console.log(`📝 Actualizando reseña: ${reviewData.userName} → ${correctUserName}`);
        }
      }

      if (updateCount > 0) {
        await batch.commit();
        console.log(`✅ Actualizadas ${updateCount} reseñas con datos correctos del usuario`);
      } else {
        console.log('✅ Todas las reseñas ya tienen datos correctos');
      }
    } catch (error) {
      console.error('❌ Error actualizando datos de usuario en reseñas:', error);
    }
  }
}

export const reviewService = new ReviewService();
