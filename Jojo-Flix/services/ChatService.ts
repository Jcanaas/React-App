import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../components/firebaseConfig';
import { userProfileService } from './UserProfileService';
import NotificationManager from './NotificationService';

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  message: string;
  timestamp: Date;
  read: boolean;
  messageType: 'text' | 'image' | 'system';
}

export interface Chat {
  id?: string;
  participants: string[];
  participantNames: string[];
  participantAvatars: (string | null)[];
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSender?: string;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  isGroup: boolean;
  chatName?: string;
}

class ChatService {
  private chatsCollection = collection(db, 'chats');
  private messagesCollection = collection(db, 'messages');

  // Crear o obtener chat entre dos usuarios
  async getOrCreateChat(friendId: string): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Buscar chat existente
      const existingChat = await this.findExistingChat(currentUser.uid, friendId);
      if (existingChat) {
        return existingChat;
      }

      // Crear nuevo chat
      const friendProfile = await userProfileService.getCompleteUserProfile(friendId);
      const currentUserName = await userProfileService.getDisplayName();
      const currentUserAvatar = await userProfileService.getUserAvatar();

      const chatData: Omit<Chat, 'id'> = {
        participants: [currentUser.uid, friendId],
        participantNames: [
          currentUserName,
          friendProfile?.displayName || 'Usuario'
        ],
        participantAvatars: [
          currentUserAvatar,
          friendProfile?.customAvatar || friendProfile?.photoURL || null
        ],
        unreadCount: {
          [currentUser.uid]: 0,
          [friendId]: 0
        },
        createdAt: new Date(),
        isGroup: false
      };

      const docRef = await addDoc(this.chatsCollection, {
        ...chatData,
        createdAt: serverTimestamp()
      });

      console.log('✅ Chat creado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando chat:', error);
      throw error;
    }
  }

  // Buscar chat existente entre dos usuarios
  private async findExistingChat(userId1: string, userId2: string): Promise<string | null> {
    try {
      const q = query(
        this.chatsCollection,
        where('participants', 'array-contains', userId1)
      );

      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const data = doc.data() as Chat;
        if (data.participants.includes(userId2) && data.participants.length === 2) {
          return doc.id;
        }
      }

      return null;
    } catch (error) {
      console.error('Error buscando chat existente:', error);
      return null;
    }
  }

  // Enviar mensaje
  async sendMessage(chatId: string, message: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuario no autenticado');

      // Validar que el mensaje no esté vacío
      if (!message || message.length === 0) {
        throw new Error('El mensaje no puede estar vacío');
      }

      console.log('📤 Enviando mensaje:', { 
        length: message.length, 
        content: message,
        chatId 
      });

      const senderName = await userProfileService.getDisplayName();
      const senderAvatar = await userProfileService.getUserAvatar();

      const messageData: Omit<ChatMessage, 'id'> = {
        chatId,
        senderId: currentUser.uid,
        senderName,
        senderAvatar,
        message: message, // Preservar el mensaje original sin modificaciones
        timestamp: new Date(),
        read: false,
        messageType: 'text'
      };

      console.log('📝 Datos del mensaje a guardar:', messageData);

      // Agregar mensaje
      const docRef = await addDoc(this.messagesCollection, {
        ...messageData,
        timestamp: serverTimestamp()
      });

      console.log('✅ Mensaje guardado en Firestore con ID:', docRef.id);

      // Actualizar chat con último mensaje y incrementar contador de no leídos
      const chatDoc = doc(this.chatsCollection, chatId);
      
      // Obtener datos actuales del chat para incrementar contadores
      const chatSnapshot = await getDocs(query(this.chatsCollection, where('__name__', '==', chatId)));
      let currentUnreadCounts: { [userId: string]: number } = {};
      
      if (!chatSnapshot.empty) {
        const chatData = chatSnapshot.docs[0].data();
        currentUnreadCounts = chatData.unreadCount || {};
      }

      // Incrementar contador para todos los participantes except el sender
      const updatedUnreadCounts: { [userId: string]: number } = { ...currentUnreadCounts };
      const chatParticipants = Object.keys(updatedUnreadCounts);
      
      chatParticipants.forEach(participantId => {
        if (participantId !== currentUser.uid) {
          updatedUnreadCounts[participantId] = (updatedUnreadCounts[participantId] || 0) + 1;
        }
      });

      await updateDoc(chatDoc, {
        lastMessage: message.length > 50 ? message.substring(0, 50) + '...' : message,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUser.uid,
        unreadCount: updatedUnreadCounts
      });

      console.log('✅ Mensaje enviado exitosamente');
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  // Obtener mensajes de un chat
  getChatMessages(chatId: string, messageLimit: number = 50, callback: (messages: ChatMessage[]) => void) {
    try {
      const q = query(
        this.messagesCollection,
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc'),
        limit(messageLimit)
      );

      let isInitialLoad = true;

      return onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = [];
        const currentUser = auth.currentUser;
        let hasNewMessages = false;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const message = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          } as ChatMessage;
          
          console.log('📨 Mensaje recibido:', { 
            id: message.id, 
            length: message.message?.length,
            content: message.message,
            isInitialLoad
          });
          
          // Detectar mensajes nuevos (no en carga inicial y no del usuario actual)
          if (!isInitialLoad && 
              currentUser && 
              message.senderId !== currentUser.uid && 
              !message.read) {
            hasNewMessages = true;
          }
          
          messages.push(message);
        });

        // Ordenar por timestamp ascendente (más antiguos primero)
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        console.log('📋 Total mensajes procesados:', messages.length);
        console.log('🔔 Hay mensajes nuevos:', hasNewMessages);
        
        callback(messages);

        // Marcar que ya no es la carga inicial
        isInitialLoad = false;
      });
    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      return () => {};
    }
  }

  // Obtener lista de chats del usuario
  getUserChats(callback: (chats: Chat[]) => void) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        callback([]);
        return () => {};
      }

      const q = query(
        this.chatsCollection,
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastMessageTime', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const chats: Chat[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          chats.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastMessageTime: data.lastMessageTime?.toDate()
          } as Chat);
        });

        callback(chats);
      });
    } catch (error) {
      console.error('❌ Error obteniendo chats:', error);
      return () => {};
    }
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(chatId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const q = query(
        this.messagesCollection,
        where('chatId', '==', chatId),
        where('senderId', '!=', currentUser.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );

      await Promise.all(updatePromises);

      // Resetear contador de no leídos
      const chatDoc = doc(this.chatsCollection, chatId);
      await updateDoc(chatDoc, {
        [`unreadCount.${currentUser.uid}`]: 0
      });

      console.log('✅ Mensajes marcados como leídos');
    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
    }
  }

  // Obtener nombre del chat (para mostrar en la lista)
  getChatDisplayName(chat: Chat, currentUserId: string): string {
    if (chat.isGroup) {
      return chat.chatName || 'Chat grupal';
    }

    // Para chats privados, mostrar el nombre del otro participante
    const otherParticipantIndex = chat.participants.findIndex(id => id !== currentUserId);
    return chat.participantNames[otherParticipantIndex] || 'Usuario';
  }

  // Obtener avatar del chat
  getChatDisplayAvatar(chat: Chat, currentUserId: string): string | null {
    if (chat.isGroup) {
      return null; // Se podría implementar avatar de grupo
    }

    const otherParticipantIndex = chat.participants.findIndex(id => id !== currentUserId);
    return chat.participantAvatars[otherParticipantIndex] || null;
  }
}

export const chatService = new ChatService();
