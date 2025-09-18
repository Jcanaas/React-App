import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';
import { auth, db } from '../components/firebaseConfig';

export interface UnreadCount {
  chatId: string;
  count: number;
  lastMessage?: string;
  lastSenderName?: string;
  lastMessageTime?: Date;
}

class UnreadMessagesService {
  private messagesCollection = collection(db, 'messages');
  private chatsCollection = collection(db, 'chats');

  // Obtener contador total de mensajes no leídos
  getTotalUnreadCount(callback: (totalCount: number) => void) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback(0);
      return () => {};
    }

    // Escuchar todos los mensajes no leídos del usuario
    const q = query(
      this.messagesCollection,
      where('senderId', '!=', currentUser.uid),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      // Crear un Set para evitar duplicados por chatId
      const uniqueChats = new Set<string>();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        uniqueChats.add(data.chatId);
      });

      callback(uniqueChats.size); // Total de chats con mensajes no leídos
    });
  }

  // Obtener detalles de mensajes no leídos por chat
  getUnreadDetailsByChat(callback: (unreadDetails: UnreadCount[]) => void) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }

    const q = query(
      this.messagesCollection,
      where('senderId', '!=', currentUser.uid),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      const chatCounts: { [chatId: string]: UnreadCount } = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const chatId = data.chatId;

        if (!chatCounts[chatId]) {
          chatCounts[chatId] = {
            chatId,
            count: 0,
            lastMessage: '',
            lastSenderName: '',
            lastMessageTime: new Date(0)
          };
        }

        chatCounts[chatId].count++;
        
        // Actualizar con el mensaje más reciente
        const messageTime = data.timestamp?.toDate() || new Date();
        if (messageTime > (chatCounts[chatId].lastMessageTime || new Date(0))) {
          chatCounts[chatId].lastMessage = data.message;
          chatCounts[chatId].lastSenderName = data.senderName;
          chatCounts[chatId].lastMessageTime = messageTime;
        }
      });

      callback(Object.values(chatCounts));
    });
  }

  // Marcar todos los mensajes de un chat como leídos
  async markChatAsRead(chatId: string): Promise<void> {
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

      // También actualizar el contador en el chat
      const chatDoc = doc(this.chatsCollection, chatId);
      await updateDoc(chatDoc, {
        [`unreadCount.${currentUser.uid}`]: 0
      });

      console.log('✅ Chat marcado como leído:', chatId);
    } catch (error) {
      console.error('❌ Error marcando chat como leído:', error);
    }
  }

  // Verificar si hay mensajes nuevos desde la última vez que se abrió la app
  async checkForNewMessagesOnAppOpen(): Promise<UnreadCount[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        this.messagesCollection,
        where('senderId', '!=', currentUser.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const chatCounts: { [chatId: string]: UnreadCount } = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const chatId = data.chatId;

        if (!chatCounts[chatId]) {
          chatCounts[chatId] = {
            chatId,
            count: 0,
            lastMessage: '',
            lastSenderName: '',
            lastMessageTime: new Date(0)
          };
        }

        chatCounts[chatId].count++;
        
        const messageTime = data.timestamp?.toDate() || new Date();
        if (messageTime > (chatCounts[chatId].lastMessageTime || new Date(0))) {
          chatCounts[chatId].lastMessage = data.message;
          chatCounts[chatId].lastSenderName = data.senderName;
          chatCounts[chatId].lastMessageTime = messageTime;
        }
      });

      return Object.values(chatCounts);
    } catch (error) {
      console.error('❌ Error verificando mensajes nuevos:', error);
      return [];
    }
  }
}

export const unreadMessagesService = new UnreadMessagesService();
