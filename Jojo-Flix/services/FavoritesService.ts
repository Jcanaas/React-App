import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { auth, db } from '../components/firebaseConfig';

export interface FavoriteItem {
  id: string;
  contentId: string;
  contentType: 'movie' | 'tv';
  title: string;
  poster: string;
  overview?: string;
  releaseDate?: string;
  rating?: number;
  addedAt: Date;
  userId: string;
}

export interface UserFavorites {
  userId: string;
  userName: string;
  userAvatar?: string;
  favorites: FavoriteItem[];
  totalCount: number;
}

class FavoritesService {
  private favoritesCollection = collection(db, 'favorites');
  private usersCollection = collection(db, 'users');

  // Agregar contenido a favoritos
  async addToFavorites(contentData: {
    contentId: string;
    contentType: 'movie' | 'tv';
    title: string;
    poster: string;
    overview?: string;
    releaseDate?: string;
    rating?: number;
  }): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const favoriteId = `${currentUser.uid}_${contentData.contentId}`;
      const favoriteDoc = doc(this.favoritesCollection, favoriteId);

      const favoriteItem: FavoriteItem = {
        id: favoriteId,
        ...contentData,
        addedAt: new Date(),
        userId: currentUser.uid
      };

      await setDoc(favoriteDoc, {
        ...favoriteItem,
        addedAt: serverTimestamp()
      });

      // También actualizar el contador en el perfil del usuario
      await this.updateUserFavoritesCount(currentUser.uid);

      console.log('✅ Contenido agregado a favoritos:', contentData.title);
    } catch (error) {
      console.error('❌ Error agregando a favoritos:', error);
      throw error;
    }
  }

  // Quitar contenido de favoritos
  async removeFromFavorites(contentId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const favoriteId = `${currentUser.uid}_${contentId}`;
      const favoriteDoc = doc(this.favoritesCollection, favoriteId);

      await deleteDoc(favoriteDoc);

      // Actualizar el contador en el perfil del usuario
      await this.updateUserFavoritesCount(currentUser.uid);

      console.log('✅ Contenido removido de favoritos');
    } catch (error) {
      console.error('❌ Error removiendo de favoritos:', error);
      throw error;
    }
  }

  // Verificar si un contenido está en favoritos
  async isInFavorites(contentId: string): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const favoriteId = `${currentUser.uid}_${contentId}`;
      const favoriteDoc = doc(this.favoritesCollection, favoriteId);
      const docSnap = await getDoc(favoriteDoc);

      return docSnap.exists();
    } catch (error) {
      console.error('❌ Error verificando favoritos:', error);
      return false;
    }
  }

  // Obtener favoritos del usuario actual
  async getUserFavorites(userId?: string): Promise<FavoriteItem[]> {
    try {
      const targetUserId = userId || auth.currentUser?.uid;
      if (!targetUserId) return [];

      const q = query(
        this.favoritesCollection,
        where('userId', '==', targetUserId),
        orderBy('addedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const favorites: FavoriteItem[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favorites.push({
          ...data,
          addedAt: data.addedAt?.toDate() || new Date()
        } as FavoriteItem);
      });

      return favorites;
    } catch (error) {
      console.error('❌ Error obteniendo favoritos:', error);
      return [];
    }
  }

  // Obtener favoritos de múltiples usuarios (para amigos)
  async getFavoritesFromUsers(userIds: string[]): Promise<UserFavorites[]> {
    try {
      const userFavorites: UserFavorites[] = [];

      for (const userId of userIds) {
        // Obtener información del usuario
        const userDoc = doc(db, 'userProfiles', userId);
        const userSnap = await getDoc(userDoc);
        
        let userName = 'Usuario';
        let userAvatar: string | undefined;

        if (userSnap.exists()) {
          const userData = userSnap.data();
          userName = userData.displayName || 'Usuario';
          userAvatar = userData.customAvatar || userData.photoURL;
        }

        // Obtener favoritos del usuario
        const favorites = await this.getUserFavorites(userId);

        userFavorites.push({
          userId,
          userName,
          userAvatar,
          favorites: favorites.slice(0, 10), // Limitar a 10 favoritos más recientes
          totalCount: favorites.length
        });
      }

      return userFavorites;
    } catch (error) {
      console.error('❌ Error obteniendo favoritos de usuarios:', error);
      return [];
    }
  }

  // Actualizar contador de favoritos en el perfil
  private async updateUserFavoritesCount(userId: string): Promise<void> {
    try {
      const favorites = await this.getUserFavorites(userId);
      const count = favorites.length;

      const userProfileDoc = doc(db, 'userProfiles', userId);
      await updateDoc(userProfileDoc, {
        totalFavorites: count
      });
    } catch (error) {
      console.error('❌ Error actualizando contador de favoritos:', error);
    }
  }

  // Obtener favoritos populares entre amigos
  async getPopularFavoritesAmongFriends(friendIds: string[]): Promise<{
    contentId: string;
    contentType: 'movie' | 'tv';
    title: string;
    poster: string;
    count: number;
    users: string[];
  }[]> {
    try {
      const allFavorites = await this.getFavoritesFromUsers(friendIds);
      const contentMap = new Map<string, {
        contentId: string;
        contentType: 'movie' | 'tv';
        title: string;
        poster: string;
        count: number;
        users: string[];
      }>();

      // Contar popularidad de cada contenido
      allFavorites.forEach(userFav => {
        userFav.favorites.forEach(favorite => {
          const key = favorite.contentId;
          if (contentMap.has(key)) {
            const existing = contentMap.get(key)!;
            existing.count++;
            existing.users.push(userFav.userName);
          } else {
            contentMap.set(key, {
              contentId: favorite.contentId,
              contentType: favorite.contentType,
              title: favorite.title,
              poster: favorite.poster,
              count: 1,
              users: [userFav.userName]
            });
          }
        });
      });

      // Convertir a array y ordenar por popularidad
      return Array.from(contentMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20
    } catch (error) {
      console.error('❌ Error obteniendo favoritos populares:', error);
      return [];
    }
  }
}

export const favoritesService = new FavoritesService();