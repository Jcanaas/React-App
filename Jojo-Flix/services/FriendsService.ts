import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../components/firebaseConfig';
import { userProfileService } from './UserProfileService';
import NotificationManager from './NotificationService';

export interface FriendRequest {
  id?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string | null;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: Date;
  message?: string;
}

export interface Friend {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  friendSince: Date;
  lastActive?: Date;
  isOnline?: boolean;
}

class FriendsService {
  private friendRequestsCollection = collection(db, 'friendRequests');
  private friendsCollection = collection(db, 'friends');
  private usersCollection = collection(db, 'users');
  private userProfilesCollection = collection(db, 'userProfiles'); // Nueva colección

  // Enviar solicitud de amistad
  async sendFriendRequest(toUserId: string, message?: string): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Verificar que no se envíe solicitud a sí mismo
      if (currentUser.uid === toUserId) {
        throw new Error('No puedes enviarte una solicitud a ti mismo');
      }

      // Verificar si ya existe una solicitud pendiente
      const existingRequest = await this.checkExistingRequest(currentUser.uid, toUserId);
      if (existingRequest) {
        throw new Error('Ya existe una solicitud pendiente con este usuario');
      }

      // Verificar si ya son amigos
      const areAlreadyFriends = await this.areUsersFriends(currentUser.uid, toUserId);
      if (areAlreadyFriends) {
        throw new Error('Ya sois amigos');
      }

      // Obtener datos del usuario destinatario
      const toUserProfile = await userProfileService.getCompleteUserProfile(toUserId);
      if (!toUserProfile) {
        throw new Error('Usuario no encontrado');
      }

      // Obtener datos del usuario que envía
      const fromUserName = await userProfileService.getDisplayName();
      const fromUserAvatar = await userProfileService.getUserAvatar();

      const requestData: Omit<FriendRequest, 'id'> = {
        fromUserId: currentUser.uid,
        fromUserName,
        fromUserAvatar,
        toUserId,
        toUserName: toUserProfile.displayName,
        toUserAvatar: toUserProfile.customAvatar || toUserProfile.photoURL,
        status: 'pending',
        timestamp: new Date(),
        ...(message && { message }) // Solo incluir message si no es undefined/null/empty
      };

      const docRef = await addDoc(this.friendRequestsCollection, {
        ...requestData,
        timestamp: serverTimestamp()
      });

      // Mostrar notificación al usuario destinatario
      await NotificationManager.showFriendRequestNotification(fromUserName);

      console.log('✅ Solicitud de amistad enviada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error enviando solicitud de amistad:', error);
      throw error;
    }
  }

  // Verificar solicitudes existentes
  private async checkExistingRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const q1 = query(
      this.friendRequestsCollection,
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );

    const q2 = query(
      this.friendRequestsCollection,
      where('fromUserId', '==', toUserId),
      where('toUserId', '==', fromUserId),
      where('status', '==', 'pending')
    );

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    return !snapshot1.empty || !snapshot2.empty;
  }

  // Verificar si son amigos
  async areUsersFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      const userDoc = doc(this.usersCollection, userId1);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const friends = userData.friends || [];
        return friends.includes(userId2);
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando amistad:', error);
      return false;
    }
  }

  // Obtener solicitudes pendientes recibidas
  async getPendingFriendRequests(): Promise<FriendRequest[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        this.friendRequestsCollection,
        where('toUserId', '==', currentUser.uid),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const requests: FriendRequest[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as FriendRequest);
      });

      return requests;
    } catch (error) {
      console.error('❌ Error obteniendo solicitudes:', error);
      return [];
    }
  }

  // Aceptar solicitud de amistad
  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Obtener la solicitud
      const requestDoc = doc(this.friendRequestsCollection, requestId);
      const requestSnap = await getDoc(requestDoc);
      
      if (!requestSnap.exists()) {
        throw new Error('Solicitud no encontrada');
      }

      const requestData = requestSnap.data() as FriendRequest;

      // Actualizar estado de la solicitud
      await updateDoc(requestDoc, {
        status: 'accepted',
        timestamp: serverTimestamp()
      });

      // Agregar a lista de amigos mutuamente
      const user1Doc = doc(this.usersCollection, requestData.fromUserId);
      const user2Doc = doc(this.usersCollection, requestData.toUserId);

      await Promise.all([
        updateDoc(user1Doc, {
          friends: arrayUnion(requestData.toUserId)
        }),
        updateDoc(user2Doc, {
          friends: arrayUnion(requestData.fromUserId)
        })
      ]);

      console.log('✅ Solicitud de amistad aceptada');
    } catch (error) {
      console.error('❌ Error aceptando solicitud:', error);
      throw error;
    }
  }

  // Rechazar solicitud de amistad
  async rejectFriendRequest(requestId: string): Promise<void> {
    try {
      const requestDoc = doc(this.friendRequestsCollection, requestId);
      await updateDoc(requestDoc, {
        status: 'rejected',
        timestamp: serverTimestamp()
      });

      console.log('✅ Solicitud de amistad rechazada');
    } catch (error) {
      console.error('❌ Error rechazando solicitud:', error);
      throw error;
    }
  }

  // Obtener lista de amigos
  async getFriends(): Promise<Friend[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const userDoc = doc(this.usersCollection, currentUser.uid);
      const userSnap = await getDoc(userDoc);
      
      if (!userSnap.exists()) return [];

      const userData = userSnap.data();
      const friendIds = userData.friends || [];

      const friends: Friend[] = [];

      for (const friendId of friendIds) {
        const friendProfile = await userProfileService.getCompleteUserProfile(friendId);
        if (friendProfile) {
          friends.push({
            id: friendId,
            userId: friendId,
            userName: friendProfile.displayName,
            userAvatar: friendProfile.customAvatar || friendProfile.photoURL,
            friendSince: new Date(), // Se podría obtener de la fecha de aceptación
            isOnline: false // Se podría implementar presencia en tiempo real
          });
        }
      }

      return friends;
    } catch (error) {
      console.error('❌ Error obteniendo amigos:', error);
      return [];
    }
  }

  // Buscar usuarios por nombre
  async searchUsers(searchTerm: string): Promise<Array<{id: string, name: string, avatar?: string}>> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      // Buscar en colección users (donde están realmente los usuarios)
      const usersQuery = query(this.usersCollection);
      const snapshot = await getDocs(usersQuery);
      
      const results: Array<{id: string, name: string, avatar?: string}> = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const userName = data.name || data.email?.split('@')[0] || '';
        
        // Filtrar por término de búsqueda y excluir al usuario actual
        if (
          userName.toLowerCase().includes(searchTerm.toLowerCase()) && 
          doc.id !== currentUser.uid
        ) {
          results.push({
            id: doc.id,
            name: userName,
            avatar: data.profileImage || data.photoURL
          });
        }
      });

      return results.slice(0, 10); // Limitar resultados
    } catch (error) {
      console.error('❌ Error buscando usuarios:', error);
      return [];
    }
  }

  // Eliminar amigo
  async removeFriend(friendId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      const user1Doc = doc(this.usersCollection, currentUser.uid);
      const user2Doc = doc(this.usersCollection, friendId);

      await Promise.all([
        updateDoc(user1Doc, {
          friends: arrayRemove(friendId)
        }),
        updateDoc(user2Doc, {
          friends: arrayRemove(currentUser.uid)
        })
      ]);

      console.log('✅ Amigo eliminado');
    } catch (error) {
      console.error('❌ Error eliminando amigo:', error);
      throw error;
    }
  }
}

export const friendsService = new FriendsService();
