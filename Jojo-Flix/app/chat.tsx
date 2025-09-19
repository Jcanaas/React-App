import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '../components/firebaseConfig';
import { chatService, ChatMessage } from '../services/ChatService';
import { useNotificationContext } from '../contexts/NotificationContext';

const ChatScreen = () => {
  const router = useRouter();
  const { chatId } = useLocalSearchParams();
  const { markChatAsRead } = useNotificationContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!chatId || typeof chatId !== 'string') {
      Alert.alert('Error', 'ID de chat inválido');
      router.back();
      return;
    }

    // Cargar mensajes y escuchar cambios en tiempo real
    const unsubscribe = chatService.getChatMessages(chatId, 50, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
      
      // Scroll al final cuando lleguen nuevos mensajes
      setTimeout(() => {
        if (flatListRef.current && newMessages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    // Marcar el chat como leído al entrar
    markChatAsRead(chatId);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);

  const sendMessage = async () => {
    // Debug: Mostrar el mensaje antes de procesar
    console.log('🚀 Iniciando envío - Mensaje original:', {
      length: newMessage.length,
      content: newMessage,
      lastChars: newMessage.slice(-10) // Últimos 10 caracteres
    });

    if (!newMessage || newMessage.length === 0 || sending || !chatId || typeof chatId !== 'string') {
      console.log('❌ Envío cancelado - validación falló');
      return;
    }

    // Capturar mensaje ANTES de cualquier cambio de estado
    const messageToSend = String(newMessage); // Asegurar que es string
    console.log('📝 Mensaje capturado para envío:', {
      length: messageToSend.length,
      content: messageToSend,
      lastChars: messageToSend.slice(-10)
    });
    
    setSending(true);
    setNewMessage(''); // Limpiar INMEDIATAMENTE para mejor UX
    
    try {
      await chatService.sendMessage(chatId, messageToSend);
      console.log('✅ Mensaje enviado correctamente');
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      // Si hay error, restaurar el mensaje
      setNewMessage(messageToSend);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // Si es hoy, mostrar solo la hora
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es ayer, mostrar "Ayer"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es más antiguo, mostrar fecha completa
    return messageDate.toLocaleDateString() + ' ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const currentUser = auth.currentUser;
    const isMyMessage = item.senderId === currentUser?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <View style={styles.senderInfo}>
            {item.senderAvatar && typeof item.senderAvatar === 'string' ? (
              <Image source={{ uri: item.senderAvatar }} style={styles.senderAvatar} />
            ) : (
              <View style={styles.defaultSenderAvatar}>
                <MaterialIcons name="account-circle" size={24} color="#666" />
              </View>
            )}
            <Text style={styles.senderName}>{item.senderName}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Chat</Text>
          <Text style={styles.headerSubtitle}>
            {messages.length > 0 ? `${messages.length} mensajes` : 'Nuevo chat'}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="chat-bubble-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>Inicia la conversación</Text>
              <Text style={styles.emptyText}>
                Envía el primer mensaje para comenzar a chatear
              </Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#666"
          value={newMessage}
          onChangeText={(text) => {
            console.log('📝 TextInput onChange:', { 
              length: text.length, 
              content: text,
              lastChars: text.slice(-10)
            });
            setNewMessage(text);
          }}
          multiline
          maxLength={500}
          blurOnSubmit={false}
          onSubmitEditing={(event) => {
            console.log('⌨️ onSubmitEditing triggered');
            event.preventDefault();
            sendMessage();
          }}
          textAlignVertical="top"
          autoCorrect={false}
          autoCapitalize="sentences"
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            { opacity: newMessage.length > 0 && !sending ? 1 : 0.5 }
          ]}
          onPress={() => {
            console.log('🔄 Botón enviar presionado');
            sendMessage();
          }}
          disabled={newMessage.length === 0 || sending}
        >
          <MaterialIcons 
            name={sending ? "hourglass-empty" : "send"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 50, // Para el notch
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 40, // MÁS espacio al final para separar del input
  },
  messageContainer: {
    marginBottom: 16,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  senderAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  defaultSenderAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderName: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  myMessageBubble: {
    backgroundColor: '#DF2892',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#333',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40, // MÁS ESPACIO en la parte inferior
    backgroundColor: '#222',
    borderTopWidth: 1,
    borderTopColor: '#333',
    minHeight: 88, // Altura mínima aumentada
    marginBottom: 20, // Margen extra para separar de la parte inferior
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12, // Más padding vertical
    maxHeight: 120, // Altura máxima aumentada
    minHeight: 40, // Altura mínima
    fontSize: 16,
    marginRight: 12, // Más espacio con el botón
    textAlignVertical: 'top', // Alineación del texto
  },
  sendButton: {
    width: 44, // Botón más grande
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DF2892',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4, // Alineación con el input
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatScreen;
