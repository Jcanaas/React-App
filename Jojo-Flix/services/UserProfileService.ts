import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../components/firebaseConfig';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  joinDate: Date;
  totalReviews: number;
  averageRating: number;
  bio?: string;
}

class UserProfileService {
  
  // Crear o actualizar perfil de usuario
  async createOrUpdateUserProfile(userData: Partial<UserProfile>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const userDocRef = doc(db, 'userProfiles', user.uid);
      
      // Obtener perfil existente si existe
      const existingProfile = await this.getUserProfile(user.uid);
      
      const profileData = {
        uid: user.uid,
        email: user.email || '',
        displayName: userData.displayName || user.displayName || user.email?.split('@')[0] || 'Usuario',
        photoURL: userData.photoURL || user.photoURL || null,
        joinDate: existingProfile?.joinDate || new Date(),
        totalReviews: existingProfile?.totalReviews || 0,
        averageRating: existingProfile?.averageRating || 0,
        bio: userData.bio || existingProfile?.bio || '',
        ...userData
      };

      await setDoc(userDocRef, profileData, { merge: true });
      
      // También actualizar en la colección legacy 'users' para compatibilidad
      const legacyUserDocRef = doc(db, 'users', user.uid);
      const legacyData = {
        name: profileData.displayName,
        email: profileData.email,
        bio: profileData.bio || '',
        displayName: profileData.displayName
      };
      await setDoc(legacyUserDocRef, legacyData, { merge: true });
      
      // Actualizar también el perfil de Firebase Auth si se cambió el nombre
      if (userData.displayName && userData.displayName !== user.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName
        });
      }

      console.log('✅ Perfil de usuario actualizado');
      
      // Actualizar automáticamente las reseñas del usuario
      try {
        console.log('🔄 Actualizando reseñas del usuario automáticamente...');
        // Import dinámico para evitar dependencias circulares
        const { reviewService } = await import('./ReviewService');
        await reviewService.updateExistingReviewsUserData();
        console.log('✅ Reseñas actualizadas automáticamente');
      } catch (reviewError) {
        console.error('⚠️ Error actualizando reseñas automáticamente:', reviewError);
        // No fallar el proceso principal si falla la actualización de reseñas
      }
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      throw error;
    }
  }

  // Obtener perfil de usuario
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, 'userProfiles', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          joinDate: data.joinDate.toDate()
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return null;
    }
  }

  // Obtener nombre de usuario mejorado - busca en legacy y nuevo sistema
  async getDisplayName(uid?: string): Promise<string> {
    try {
      const targetUid = uid || auth.currentUser?.uid;
      if (!targetUid) return 'Usuario Anónimo';

      // Primero buscar en datos legacy (colección 'users')
      try {
        const legacyUserDoc = doc(db, 'users', targetUid);
        const legacySnap = await getDoc(legacyUserDoc);
        if (legacySnap.exists()) {
          const legacyData = legacySnap.data();
          if (legacyData.name) {
            console.log('🔍 Nombre encontrado en datos legacy:', legacyData.name);
            return legacyData.name;
          }
        }
      } catch (legacyError) {
        console.log('⚠️ No se encontraron datos legacy para el usuario');
      }

      // Luego intentar obtener del perfil personalizado
      const profile = await this.getUserProfile(targetUid);
      if (profile?.displayName) {
        return profile.displayName;
      }

      // Fallback a Firebase Auth
      const user = auth.currentUser;
      if (user && user.uid === targetUid) {
        if (user.displayName) return user.displayName;
        if (user.email) return user.email.split('@')[0];
      }

      return 'Usuario Anónimo';
    } catch (error) {
      console.error('❌ Error obteniendo nombre:', error);
      return 'Usuario Anónimo';
    }
  }

  // Obtener avatar de usuario mejorado - busca en legacy y nuevo sistema
  async getUserAvatar(uid?: string): Promise<string | null> {
    try {
      const targetUid = uid || auth.currentUser?.uid;
      if (!targetUid) return null;

      // Primero buscar en datos legacy (colección 'users')
      try {
        const legacyUserDoc = doc(db, 'users', targetUid);
        const legacySnap = await getDoc(legacyUserDoc);
        if (legacySnap.exists()) {
          const legacyData = legacySnap.data();
          if (legacyData.profileImage) {
            console.log('🔍 Avatar encontrado en datos legacy:', legacyData.profileImage);
            return legacyData.profileImage;
          }
        }
      } catch (legacyError) {
        console.log('⚠️ No se encontró avatar en datos legacy');
      }

      // Luego intentar obtener del perfil personalizado
      const profile = await this.getUserProfile(targetUid);
      if (profile?.photoURL) {
        return profile.photoURL;
      }

      // Fallback a Firebase Auth
      const user = auth.currentUser;
      if (user && user.uid === targetUid && user.photoURL) {
        return user.photoURL;
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo avatar:', error);
      return null;
    }
  }

  // Actualizar estadísticas después de crear/editar reseña
  async updateUserStats(uid: string): Promise<void> {
    try {
      // Aquí podrías calcular estadísticas reales basadas en las reseñas del usuario
      // Por ahora, solo incrementamos el contador
      const userDocRef = doc(db, 'userProfiles', uid);
      const profile = await this.getUserProfile(uid);
      
      if (profile) {
        await updateDoc(userDocRef, {
          totalReviews: (profile.totalReviews || 0) + 1
        });
      }
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }

  // Configurar perfil inicial para usuarios nuevos
  async setupInitialProfile(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const existingProfile = await this.getUserProfile(user.uid);
      if (existingProfile) return; // Ya tiene perfil

      await this.createOrUpdateUserProfile({
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        photoURL: user.photoURL || undefined
      });
    } catch (error) {
      console.error('❌ Error configurando perfil inicial:', error);
    }
  }

  // Obtener perfil completo (nuevo o legacy)
  async getCompleteUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      console.log('🔍 Obteniendo perfil para UID:', uid);
      
      // Buscar directamente en datos legacy (más confiable)
      const legacyUserDoc = doc(db, 'users', uid);
      const legacySnap = await getDoc(legacyUserDoc);
      
      if (legacySnap.exists()) {
        const legacyData = legacySnap.data();
        console.log('✅ Datos legacy encontrados:', legacyData);
        
        // Crear perfil con la estructura esperada
        const legacyProfile: UserProfile = {
          uid: uid,
          displayName: legacyData.name || legacyData.email?.split('@')[0] || 'Usuario',
          email: legacyData.email || '',
          photoURL: legacyData.profileImage || null,
          joinDate: new Date(), // Fecha por defecto
          totalReviews: 0, // Se podría calcular
          averageRating: 0, // Se podría calcular
          bio: legacyData.bio || ''
        };
        
        return legacyProfile;
      }

      // Solo si no se encuentran datos legacy, intentar userProfiles
      try {
        const profile = await this.getUserProfile(uid);
        if (profile) {
          console.log('✅ Perfil nuevo encontrado:', profile);
          return profile;
        }
      } catch (profileError) {
        console.log('⚠️ No se pudo acceder a userProfiles:', profileError);
      }

      console.log('❌ No se encontraron datos para el usuario:', uid);
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo perfil completo:', error);
      return null;
    }
  }

  // Asegurar que el perfil existe en userProfiles (para búsquedas sociales)
  async ensureUserProfileExists(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'userProfiles', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Crear perfil básico si no existe
        const profileData = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          email: user.email || '',
          photoURL: user.photoURL,
          joinDate: new Date(),
          totalReviews: 0,
          averageRating: 0
        };

        await setDoc(userDocRef, profileData);
        console.log('✅ Perfil de usuario creado en userProfiles');
      }
    } catch (error) {
      console.error('❌ Error asegurando perfil:', error);
    }
  }
}

export const userProfileService = new UserProfileService();