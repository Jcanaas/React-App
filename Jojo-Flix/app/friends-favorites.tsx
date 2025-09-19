import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../components/firebaseConfig';
import { friendsService } from '../services/FriendsService';
import { favoritesService, UserFavorites, FavoriteItem } from '../services/FavoritesService';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FriendsFavoritesScreen = () => {
  const router = useRouter();
  const [friendsFavorites, setFriendsFavorites] = useState<UserFavorites[]>([]);
  const [popularFavorites, setPopularFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'popular'>('friends');

  useEffect(() => {
    loadFriendsFavorites();
  }, []);

  const loadFriendsFavorites = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Debes iniciar sesión');
        return;
      }

      // Obtener lista de amigos
      const friends = await friendsService.getFriends();
      const friendIds = friends.map(friend => friend.userId);

      if (friendIds.length === 0) {
        setLoading(false);
        return;
      }

      // Obtener favoritos de amigos
      const friendsFavs = await favoritesService.getFavoritesFromUsers(friendIds);
      setFriendsFavorites(friendsFavs);

      // Obtener favoritos populares
      const popular = await favoritesService.getPopularFavoritesAmongFriends(friendIds);
      setPopularFavorites(popular);

    } catch (error) {
      console.error('Error loading friends favorites:', error);
      Alert.alert('Error', 'No se pudieron cargar los favoritos');
    } finally {
      setLoading(false);
    }
  };

  const renderFriendFavorites = ({ item }: { item: UserFavorites }) => (
    <View style={styles.friendSection}>
      <View style={styles.friendHeader}>
        {item.userAvatar && typeof item.userAvatar === 'string' ? (
          <Image source={{ uri: item.userAvatar }} style={styles.friendAvatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <MaterialIcons name="account-circle" size={40} color="#666" />
          </View>
        )}
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.userName}</Text>
          <Text style={styles.friendCount}>
            {item.totalCount} favorito{item.totalCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push(`/user-profile?userId=${item.userId}&tab=favorites`)}
        >
          <Text style={styles.viewAllText}>Ver todos</Text>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#DF2892" />
        </TouchableOpacity>
      </View>

      {item.favorites.length > 0 && (
        <FlatList
          data={item.favorites.slice(0, 5)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(fav) => fav.id}
          renderItem={({ item: favorite }) => (
            <TouchableOpacity
              style={styles.favoriteItem}
              onPress={() => {
                router.push(`/content-detail-screen?id=${favorite.contentId}&type=${favorite.contentType}`);
              }}
            >
              {favorite.poster && typeof favorite.poster === 'string' ? (
                <Image source={{ uri: favorite.poster }} style={styles.favoritePoster} />
              ) : (
                <View style={[styles.favoritePoster, styles.placeholderPoster]}>
                  <MaterialIcons 
                    name={favorite.contentType === 'movie' ? 'movie' : 'tv'} 
                    size={24} 
                    color="#666" 
                  />
                </View>
              )}
              <Text style={styles.favoriteTitle} numberOfLines={2}>
                {favorite.title}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.favoritesContainer}
        />
      )}
    </View>
  );

  const renderPopularItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.popularItem}
      onPress={() => {
        router.push(`/content-detail-screen?id=${item.contentId}&type=${item.contentType}`);
      }}
    >
      {item.poster && typeof item.poster === 'string' ? (
        <Image source={{ uri: item.poster }} style={styles.popularPoster} />
      ) : (
        <View style={[styles.popularPoster, styles.placeholderPoster]}>
          <MaterialIcons 
            name={item.contentType === 'movie' ? 'movie' : 'tv'} 
            size={32} 
            color="#666" 
          />
        </View>
      )}
      <View style={styles.popularInfo}>
        <Text style={styles.popularTitle}>{item.title}</Text>
        <Text style={styles.popularCount}>
          {item.count} amigo{item.count !== 1 ? 's' : ''} le gusta
        </Text>
        <Text style={styles.popularUsers}>
          {item.users.slice(0, 3).join(', ')}
          {item.users.length > 3 && ` y ${item.users.length - 3} más`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF2892" />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Favoritos de Amigos</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Por Amigo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
            onPress={() => setActiveTab('popular')}
          >
            <Text style={[styles.tabText, activeTab === 'popular' && styles.activeTabText]}>
              Populares
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'friends' ? (
          friendsFavorites.length > 0 ? (
            <FlatList
              data={friendsFavorites}
              keyExtractor={(item) => item.userId}
              renderItem={renderFriendFavorites}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>Sin favoritos de amigos</Text>
              <Text style={styles.emptyText}>
                Tus amigos aún no han agregado contenido a favoritos
              </Text>
            </View>
          )
        ) : (
          popularFavorites.length > 0 ? (
            <FlatList
              data={popularFavorites}
              keyExtractor={(item) => item.contentId}
              renderItem={renderPopularItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="trending-up" size={64} color="#666" />
              <Text style={styles.emptyTitle}>Sin contenido popular</Text>
              <Text style={styles.emptyText}>
                No hay suficientes favoritos para mostrar tendencias
              </Text>
            </View>
          )
        )}
      </ScrollView>
      
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#DF2892',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  friendSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendCount: {
    color: '#999',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    color: '#DF2892',
    fontSize: 14,
    marginRight: 4,
  },
  favoritesContainer: {
    paddingLeft: 16,
  },
  favoriteItem: {
    width: 100,
    marginRight: 12,
  },
  favoritePoster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderPoster: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteTitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  popularItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  popularPoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  popularInfo: {
    flex: 1,
  },
  popularTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  popularCount: {
    color: '#DF2892',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  popularUsers: {
    color: '#999',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FriendsFavoritesScreen;