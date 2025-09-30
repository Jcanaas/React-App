import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../components/firebaseConfig';
import { friendsService, FriendRequest, Friend } from '../services/FriendsService';
import { userProfileService } from '../services/UserProfileService';
import { chatService, Chat } from '../services/ChatService';
import { useNotificationContext } from '../contexts/NotificationContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SocialScreen = () => {
  const router = useRouter();
  const { unreadByChat, markChatAsRead } = useNotificationContext();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [searchResults, setSearchResults] = useState<Array<{id: string, name: string, avatar?: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
    loadChats();
    // Asegurar que el perfil del usuario actual existe para búsquedas
    userProfileService.ensureUserProfileExists();
  }, []);

  const loadChats = () => {
    return chatService.getUserChats((chats) => {
      setUserChats(chats);
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getPendingFriendRequests()
      ]);
      
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Error cargando datos sociales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await friendsService.searchUsers(text.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await friendsService.sendFriendRequest(userId);
      Alert.alert('¡Enviado!', 'Solicitud de amistad enviada correctamente');
      
      // Remover de resultados de búsqueda
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsService.acceptFriendRequest(requestId);
      Alert.alert('¡Genial!', 'Solicitud aceptada. Ahora sois amigos');
      loadData(); // Recargar datos
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo aceptar la solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendsService.rejectFriendRequest(requestId);
      Alert.alert('Rechazada', 'Solicitud rechazada');
      loadData(); // Recargar datos
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo rechazar la solicitud');
    }
  };

  const handleStartChat = async (friendId: string) => {
    try {
      const chatId = await chatService.getOrCreateChat(friendId);
      // Marcar como leído cuando entramos al chat
      await markChatAsRead(chatId);
      router.push(`/chat?chatId=${chatId}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el chat');
    }
  };

  // Obtener el número de mensajes no leídos para un chat específico
  const getUnreadCountForChat = (chatId: string): number => {
    const chatUnread = unreadByChat.find(unread => unread.chatId === chatId);
    return chatUnread ? chatUnread.count : 0;
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <MaterialIcons 
          name="people" 
          size={20} 
          color={activeTab === 'friends' ? '#DF2892' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
          Amigos ({friends.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
        onPress={() => setActiveTab('requests')}
      >
        <MaterialIcons 
          name="person-add" 
          size={20} 
          color={activeTab === 'requests' ? '#DF2892' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
          Solicitudes ({friendRequests.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'search' && styles.activeTab]}
        onPress={() => setActiveTab('search')}
      >
        <MaterialIcons 
          name="search" 
          size={20} 
          color={activeTab === 'search' ? '#DF2892' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
          Buscar
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFriendItem = (friend: Friend) => (
    <View key={friend.id} style={styles.userItem}>
      <View style={styles.userInfo}>
        <TouchableOpacity onPress={() => router.push(`/user-profile?userId=${friend.userId}`)}>
          {friend.userAvatar && typeof friend.userAvatar === 'string' ? (
            <Image source={{ uri: friend.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <MaterialIcons name="account-circle" size={40} color="#666" />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{friend.userName}</Text>
          <Text style={styles.userSubtext}>
            {friend.isOnline ? '🟢 En línea' : '⚪ Desconectado'}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleStartChat(friend.userId)}
        >
          <View style={styles.chatButtonContent}>
            <MaterialIcons name="chat" size={20} color="#DF2892" />
            {/* Mostrar contador si hay mensajes no leídos */}
            {(() => {
              // Buscar el chat correspondiente a este amigo
              const friendChat = userChats.find(chat => 
                chat.participants.includes(friend.userId) && chat.participants.length === 2
              );
              if (friendChat) {
                const unreadCount = getUnreadCountForChat(friendChat.id!);
                if (unreadCount > 0) {
                  return (
                    <View style={styles.chatBadge}>
                      <Text style={styles.chatBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount.toString()}
                      </Text>
                    </View>
                  );
                }
              }
              return null;
            })()}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/user-profile?userId=${friend.userId}`)}
        >
          <MaterialIcons name="person" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestItem = (request: FriendRequest) => (
    <View key={request.id} style={styles.userItem}>
      <View style={styles.userInfo}>
        {request.fromUserAvatar && typeof request.fromUserAvatar === 'string' ? (
          <Image source={{ uri: request.fromUserAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <MaterialIcons name="account-circle" size={40} color="#666" />
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{request.fromUserName}</Text>
          <Text style={styles.userSubtext}>
            {request.message || 'Quiere ser tu amigo'}
          </Text>
          <Text style={styles.requestTime}>
            {request.timestamp.toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(request.id!)}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(request.id!)}
        >
          <MaterialIcons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchItem = (user: {id: string, name: string, avatar?: string}) => (
    <View key={user.id} style={styles.userItem}>
      <View style={styles.userInfo}>
        {user.avatar && typeof user.avatar === 'string' ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <MaterialIcons name="account-circle" size={40} color="#666" />
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userSubtext}>Usuario de JoJo-Flix</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(user.id)}
      >
        <MaterialIcons name="person-add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Agregar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF2892" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'friends':
        return (
          <View>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="people-outline" size={64} color="#666" />
                <Text style={styles.emptyTitle}>No tienes amigos aún</Text>
                <Text style={styles.emptyText}>
                  Busca usuarios y envía solicitudes de amistad para empezar a conectar
                </Text>
              </View>
            ) : (
              friends.map(renderFriendItem)
            )}
          </View>
        );

      case 'requests':
        return (
          <View>
            {friendRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={64} color="#666" />
                <Text style={styles.emptyTitle}>No hay solicitudes pendientes</Text>
                <Text style={styles.emptyText}>
                  Las solicitudes de amistad aparecerán aquí
                </Text>
              </View>
            ) : (
              friendRequests.map(renderRequestItem)
            )}
          </View>
        );

      case 'search':
        return (
          <View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar usuarios..."
                placeholderTextColor="#666"
                value={searchTerm}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
              {searching && (
                <ActivityIndicator size="small" color="#DF2892" style={styles.searchLoader} />
              )}
            </View>

            {searchResults.length === 0 && searchTerm.length >= 2 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={64} color="#666" />
                <Text style={styles.emptyTitle}>No se encontraron usuarios</Text>
                <Text style={styles.emptyText}>
                  Intenta con otro nombre
                </Text>
              </View>
            ) : (
              searchResults.map(renderSearchItem)
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      
      {renderTabBar()}
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(223, 40, 146, 0.1)',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#DF2892',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#666',
    marginTop: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  requestTime: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DF2892',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
  },
  emptyState: {
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
    paddingHorizontal: 20,
  },
  chatButtonContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DF2892',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },

});

export default SocialScreen;
