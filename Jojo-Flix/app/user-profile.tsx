import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '../components/firebaseConfig';
import { userProfileService, UserProfile } from '../services/UserProfileService';
import { friendsService } from '../services/FriendsService';
import { reviewService } from '../services/ReviewService';
import { chatService } from '../services/ChatService';
import { favoritesService, FavoriteItem } from '../services/FavoritesService';
import { validateImageUri } from '../utils/imageUtils';
import { robustAchievementService, UserAchievementProgress, Achievement } from '../services/RobustAchievementService';

interface Review {
  id: string;
  contentId: string;
  contentTitle: string;
  contentPoster: string;
  rating: number;
  review: string;
  timestamp: Date;
  type: string;
  title: string;
  poster: string;
  likes: number;
  userId: string;
  userName: string;
  userAvatar?: string;
}

const UserProfileScreen = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [userFavorites, setUserFavorites] = useState<FavoriteItem[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievementProgress[]>([]);
  const [allAchievements] = useState<Achievement[]>(robustAchievementService.getAchievementDefinitions());
  const [areFriends, setAreFriends] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'favorites' | 'achievements'>('reviews');

  const currentUser = auth.currentUser;
  
  // Normalizar userId que puede venir como array
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  const isOwnProfile = normalizedUserId === currentUser?.uid;

  useEffect(() => {
    console.log('🔍 UserProfile useEffect - userId:', normalizedUserId);
    
    if (!normalizedUserId || typeof normalizedUserId !== 'string') {
      console.error('❌ ID de usuario inválido:', normalizedUserId);
      Alert.alert('Error', 'ID de usuario inválido');
      router.back();
      return;
    }

    // Reiniciar estados cuando cambia el usuario
    setUserProfile(null);
    setUserReviews([]);
    setUserFavorites([]);
    setUserAchievements([]);
    setAreFriends(false);
    setRequestSent(false);
    setLoading(true);
    setReviewsLoading(true);
    setFavoritesLoading(true);
    setAchievementsLoading(true);

    console.log('✅ Cargando perfil para userId:', normalizedUserId);
    
    // Cargar datos en paralelo
    Promise.all([
      loadUserProfile(),
      loadUserReviews(),
      loadUserFavorites(),
      loadUserAchievements(),
      checkFriendshipStatus()
    ]).then(() => {
      console.log('🎉 Todos los datos del perfil cargados');
    }).catch((error) => {
      console.error('❌ Error cargando datos del perfil:', error);
    });
  }, [normalizedUserId]);

  const loadUserProfile = async () => {
    try {
      if (typeof normalizedUserId === 'string') {
        const profile = await userProfileService.getCompleteUserProfile(normalizedUserId);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReviews = async () => {
    try {
      if (typeof normalizedUserId === 'string') {
        console.log('🔍 Cargando reseñas para usuario:', normalizedUserId);
        const reviews = await reviewService.getUserReviews(normalizedUserId);
        console.log('📝 Reseñas cargadas:', reviews.length);
        // Mapear UserReview a Review interface
        const mappedReviews = reviews.map(review => ({
          id: review.id || '',
          contentId: review.movieId,
          contentTitle: review.movieTitle,
          contentPoster: typeof review.moviePoster === 'string' ? review.moviePoster : '',
          rating: review.rating,
          review: review.reviewText,
          timestamp: review.timestamp,
          type: 'movie',
          title: review.movieTitle,
          poster: typeof review.moviePoster === 'string' ? review.moviePoster : '',
          likes: review.likes,
          userId: review.userId,
          userName: review.userName,
          userAvatar: typeof review.userAvatar === 'string' ? review.userAvatar : undefined
        }));
        setUserReviews(mappedReviews);
      }
    } catch (error) {
      console.error('Error loading user reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadUserFavorites = async () => {
    try {
      if (typeof normalizedUserId === 'string') {
        console.log('🔍 Cargando favoritos para usuario:', normalizedUserId);
        const favorites = await favoritesService.getUserFavorites(normalizedUserId);
        console.log('❤️ Favoritos cargados:', favorites.length);
        setUserFavorites(favorites);
      }
    } catch (error) {
      console.error('Error loading user favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const loadUserAchievements = async () => {
    try {
      if (typeof normalizedUserId === 'string') {
        console.log('🔍 Cargando logros para usuario:', normalizedUserId);
        const achievements = await robustAchievementService.getUserAchievements(normalizedUserId);
        console.log('🏆 Logros cargados:', achievements.length);
        console.log('✅ Logros completados:', achievements.filter(a => a.isCompleted).length);
        setUserAchievements(achievements);
      }
    } catch (error) {
      console.error('Error loading user achievements:', error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    if (!currentUser || isOwnProfile || typeof normalizedUserId !== 'string') return;

    try {
      const friends = await friendsService.areUsersFriends(currentUser.uid, normalizedUserId);
      setAreFriends(friends);

      if (!friends) {
        // Verificar si ya se envió una solicitud
        const requests = await friendsService.getPendingFriendRequests();
        const requestExists = requests.some(req => req.fromUserId === currentUser.uid && req.toUserId === normalizedUserId);
        setRequestSent(requestExists);
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUser || typeof normalizedUserId !== 'string') return;

    setSendingRequest(true);
    try {
      await friendsService.sendFriendRequest(normalizedUserId);
      setRequestSent(true);
      Alert.alert('Éxito', 'Solicitud de amistad enviada');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud de amistad');
    } finally {
      setSendingRequest(false);
    }
  };

  const startChat = async () => {
    if (!currentUser || typeof normalizedUserId !== 'string') return;

    try {
      const chatId = await chatService.getOrCreateChat(normalizedUserId);
      router.push(`/chat?chatId=${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'No se pudo iniciar el chat');
    }
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Mapeo de contenido a imágenes locales
  const LOCAL_POSTERS: { [key: string]: any } = {
    // Star Wars
    'A New Hope': require('../assets/images/starwars4v.jpg'),
    'Star Wars: Episode IV - A New Hope': require('../assets/images/starwars4v.jpg'),
    'The Empire Strikes Back': require('../assets/images/starwars1v.jpg'),
    'Star Wars: Episode V - The Empire Strikes Back': require('../assets/images/starwars1v.jpg'),
    'Return of the Jedi': require('../assets/images/ReturnOfTheJediPoster1983.webp'),
    'Star Wars: Episode VI - Return of the Jedi': require('../assets/images/ReturnOfTheJediPoster1983.webp'),
    'Attack of the Clones': require('../assets/images/star_wars_episode_ii_attack_of_the_clones-495166632-large.jpg'),
    'Star Wars: Episode II - Attack of the Clones': require('../assets/images/star_wars_episode_ii_attack_of_the_clones-495166632-large.jpg'),
    'Revenge of the Sith': require('../assets/images/starwars3verticalbanner.jpg'),
    'Star Wars: Episode III - Revenge of the Sith': require('../assets/images/starwars3verticalbanner.jpg'),
    
    // Movies
    'Secreto en la montaña': require('../assets/images/secreto-en-la-montana-cover.jpg'),
    'Velocipastor': require('../assets/images/starwars4v.jpg'), // Placeholder por ahora
    'Brokeback Mountain': require('../assets/images/call_me_by_your_name-vertical.jpg'),
    'Call Me by Your Name': require('../assets/images/call_me_by_your_name-vertical.jpg'),
    'Carol': require('../assets/images/carolverticalbanner.jpg'),
    'La La Land': require('../assets/images/La_ciudad_de_las_estrellas_La_La_Land-262021831-large.jpg'),
    'Oldboy': require('../assets/images/oldboybannervertical.jpg'),
    'Dune': require('../assets/images/duneverticalbanner.jpg'),
    '28 Weeks Later': require('../assets/images/28_weeks_later.jpg'),
    'Fear Street Part One: 1994': require('../assets/images/fear_street_part_one_1994-vertical-banner.jpg'),
    'Fear Street Part Two: 1978': require('../assets/images/fear_street_part_two_1978-vertical-banner.jpg'),
    
    // Series/Anime
    'Beck': require('../assets/images/beck-verticalbanner.png'),
    'Beck: Mongolian Chop Squad': require('../assets/images/beck-verticalbanner.png'),
    'Berserk': require('../assets/images/berserk1vericalbanner.jpg'),
    'Bocchi the Rock!': require('../assets/images/bocchi_the_rock_re-639827727-large.jpg'),
    'Solo Leveling': require('../assets/images/solo-levling-vbanner.png'),
    'Monster': require('../assets/images/Monster-verticalbanner.webp'),
    'The Last of Us': require('../assets/images/tlouverticalbanner.jpg'),
    'JoJos Bizarre Adventure': require('../assets/images/jojovbanner.jpeg'),
    'JoJo\'s Bizarre Adventure': require('../assets/images/jojovbanner.jpeg'),
    'Dexter': require('../assets/images/dexterbanner.webp'),
    '28 Años Después': require('../assets/images/28semanasdespuesbanner.webp'),
    'Aquí no hay quien viva': require('../assets/images/aqui_no_hay_quien_viva-150319925-mmed.jpg'),
    
    // Games/Movies (películas y series también)
    // 'Red Dead Redemption 2': require('../assets/images/rdr2.webp'), // Solo juego - comentado
    'Metal Gear Solid': require('../assets/images/Metal Gear Solid poster.webp'),
    'Devil May Cry 5': require('../assets/images/devil_may_cry_v.webp'),
  };

  // Función para obtener imagen local del contenido
  const getMoviePosterUrl = (posterPath: string, movieTitle: string): any => {
    if (!movieTitle) return null;
    
    console.log('🖼️ Buscando imagen para:', movieTitle);
    
    // 1. Búsqueda exacta
    if (LOCAL_POSTERS[movieTitle]) {
      console.log('✅ Imagen encontrada (exacta):', movieTitle);
      return LOCAL_POSTERS[movieTitle];
    }
    
    // 2. Búsqueda sin considerar mayúsculas/minúsculas
    const titleLower = movieTitle.toLowerCase().trim();
    for (const [key, value] of Object.entries(LOCAL_POSTERS)) {
      if (key.toLowerCase().trim() === titleLower) {
        console.log('✅ Imagen encontrada (case-insensitive):', key);
        return value;
      }
    }
    
    // 3. Búsqueda por palabras clave (más flexible)
    for (const [key, value] of Object.entries(LOCAL_POSTERS)) {
      const keyLower = key.toLowerCase();
      // Verificar si el título contiene palabras clave del mapeo
      if (titleLower.includes(keyLower) || keyLower.includes(titleLower)) {
        console.log('✅ Imagen encontrada (keyword match):', key, 'para', movieTitle);
        return value;
      }
    }
    
    // 4. Búsqueda más agresiva por palabras individuales
    const titleWords = titleLower.split(/\s+/);
    for (const [key, value] of Object.entries(LOCAL_POSTERS)) {
      const keyWords = key.toLowerCase().split(/\s+/);
      const commonWords = titleWords.filter(word => 
        keyWords.some(keyWord => keyWord.includes(word) || word.includes(keyWord))
      );
      if (commonWords.length >= Math.min(2, titleWords.length)) {
        console.log('✅ Imagen encontrada (word match):', key, 'para', movieTitle);
        return value;
      }
    }
    
    console.log('❌ No se encontró imagen para:', movieTitle);
    return null;
  };

  const renderReview = ({ item }: { item: Review }) => {
    const posterImage = getMoviePosterUrl(item.contentPoster, item.contentTitle);
    
    return (
      <TouchableOpacity 
        style={styles.reviewCard}
        onPress={() => {
          // Navegar al detalle del contenido
          console.log('🔍 Navegando a reseña de contenido:', { contentId: item.contentId, title: item.contentTitle });
          router.push({ pathname: '/content-detail-screen', params: { contentId: item.contentId } });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.reviewImageContainer}>
            {posterImage ? (
              <Image 
                source={posterImage} 
                style={styles.reviewPoster}
                onError={() => {
                  console.log('❌ Error cargando imagen local para:', item.contentTitle);
                }}
              />
            ) : (
              <View style={[styles.reviewPoster, styles.placeholderPoster]}>
                <MaterialIcons name="movie" size={28} color="#666" />
                <Text style={styles.placeholderText} numberOfLines={2}>
                  {item.contentTitle.length > 10 ? item.contentTitle.substring(0, 10) + '...' : item.contentTitle}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewTitle}>{item.contentTitle}</Text>
            <View style={styles.reviewRating}>
              {renderStarRating(item.rating)}
              <Text style={styles.ratingText}>{item.rating}/5</Text>
            </View>
            <Text style={styles.reviewDate}>
              {item.timestamp.toLocaleDateString()}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#888" />
        </View>
        {item.review && (
          <Text style={styles.reviewText} numberOfLines={2}>
            {item.review}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => {
    const posterImage = getMoviePosterUrl(item.poster || '', item.title);
    
    return (
      <TouchableOpacity 
        style={styles.favoriteCard}
        onPress={() => {
          // Navegar al detalle del contenido usando el parámetro correcto
          console.log('🔍 Navegando a contenido desde favoritos:', { 
            contentId: item.contentId, 
            title: item.title,
            contentType: item.contentType 
          });
          router.push({ pathname: '/content-detail-screen', params: { contentId: item.contentId } });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.favoriteImageContainer}>
          {posterImage ? (
            <Image source={posterImage} style={styles.favoritePoster} />
          ) : (
            <View style={[styles.favoritePoster, styles.placeholderPoster]}>
              <MaterialIcons name={item.contentType === 'movie' ? 'movie' : 'tv'} size={24} color="#666" />
              <Text style={styles.placeholderText} numberOfLines={2}>
                {item.title.length > 8 ? item.title.substring(0, 8) + '...' : item.title}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.favoriteType}>
            {item.contentType === 'movie' ? 'Película' : 'Serie'}
          </Text>
          <Text style={styles.favoriteDate}>
            Agregado: {item.addedAt.toLocaleDateString()}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#888" />
      </TouchableOpacity>
    );
  };

  const renderAchievementItem = ({ item }: { item: UserAchievementProgress }) => {
    const achievementDef = allAchievements.find(a => a.id === item.achievementId);
    if (!achievementDef) return null;

    const isCompleted = item.isCompleted;
    const progressPercentage = Math.min((item.currentProgress / item.targetProgress) * 100, 100);

    return (
      <View style={[styles.achievementCard, isCompleted && styles.achievementCardCompleted]}>
        <View style={styles.achievementHeader}>
          <View style={[styles.achievementIcon, isCompleted && styles.achievementIconCompleted]}>
            <MaterialIcons 
              name={achievementDef.icon as any} 
              size={28} 
              color={isCompleted ? '#FFD700' : '#888'} 
            />
          </View>
          <View style={styles.achievementInfo}>
            <View style={styles.achievementTitleRow}>
              <Text style={styles.achievementTitle}>{achievementDef.title}</Text>
              {isCompleted && (
                <MaterialIcons name="verified" size={20} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.achievementDescription}>{achievementDef.description}</Text>
            <View style={styles.achievementProgress}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: isCompleted ? '#4CAF50' : '#DF2892'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {item.currentProgress}/{item.targetProgress}
              </Text>
            </View>
            {isCompleted && item.completedAt && (
              <Text style={styles.completedText}>
                Completado el {item.completedAt.toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF2892" />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color="#666" />
        <Text style={styles.errorText}>Usuario no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Perfil</Text>

        {!isOwnProfile && (
          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {(userProfile.photoURL && typeof userProfile.photoURL === 'string') || 
           (userProfile.customAvatar && typeof userProfile.customAvatar === 'string') ? (
            <Image 
              source={{ 
                uri: (typeof userProfile.photoURL === 'string' ? userProfile.photoURL : '') || 
                     (typeof userProfile.customAvatar === 'string' ? userProfile.customAvatar : '') 
              }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <MaterialIcons name="account-circle" size={80} color="#666" />
            </View>
          )}
        </View>

        <Text style={styles.userName}>{userProfile.displayName}</Text>
        <Text style={styles.userEmail}>{userProfile.email}</Text>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            {areFriends ? (
              <>
                <TouchableOpacity style={styles.chatButton} onPress={startChat}>
                  <MaterialIcons name="chat" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Chatear</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.friendButton}>
                  <MaterialIcons name="people" size={20} color="#DF2892" />
                  <Text style={styles.friendButtonText}>Amigos</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.addFriendButton, requestSent && styles.requestSentButton]}
                onPress={sendFriendRequest}
                disabled={requestSent || sendingRequest}
              >
                <MaterialIcons 
                  name={requestSent ? "check" : "person-add"} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.buttonText}>
                  {sendingRequest ? "Enviando..." : requestSent ? "Solicitud enviada" : "Agregar amigo"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {reviewsLoading ? '...' : userReviews.length}
            </Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {favoritesLoading ? '...' : userFavorites.length}
            </Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {isOwnProfile ? (
                reviewsLoading ? '...' : (
                  userReviews.length > 0 
                    ? (userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length).toFixed(1)
                    : '0.0'
                )
              ) : (
                achievementsLoading ? '...' : userAchievements.filter(a => a.isCompleted).length
              )}
            </Text>
            <Text style={styles.statLabel}>
              {isOwnProfile ? 'Puntuación media' : 'Logros'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reseñas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
            Favoritos
          </Text>
        </TouchableOpacity>
        
        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
              Logros
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'reviews' ? (
          reviewsLoading ? (
            <ActivityIndicator size="large" color="#DF2892" style={styles.loader} />
          ) : userReviews.length > 0 ? (
            <FlatList
              data={userReviews}
              keyExtractor={(item) => item.id}
              renderItem={renderReview}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="rate-review" size={64} color="#666" />
              <Text style={styles.emptyTitle}>Sin reseñas</Text>
              <Text style={styles.emptyText}>
                {isOwnProfile 
                  ? 'Aún no has escrito ninguna reseña'
                  : 'Este usuario no ha escrito reseñas'
                }
              </Text>
            </View>
          )
        ) : activeTab === 'favorites' ? (
          // Mostrar favoritos reales
          favoritesLoading ? (
            <ActivityIndicator size="large" color="#DF2892" style={styles.loader} />
          ) : userFavorites.length > 0 ? (
            <FlatList
              data={userFavorites}
              keyExtractor={(item) => item.id}
              renderItem={renderFavoriteItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="favorite-border" size={64} color="#666" />
              <Text style={styles.emptyTitle}>Sin favoritos</Text>
              <Text style={styles.emptyText}>
                {isOwnProfile 
                  ? 'Aún no has agregado contenido a favoritos'
                  : 'Este usuario no tiene favoritos'
                }
              </Text>
            </View>
          )
        ) : (
          // Mostrar logros de amigos
          achievementsLoading ? (
            <ActivityIndicator size="large" color="#DF2892" style={styles.loader} />
          ) : userAchievements.length > 0 ? (
            <FlatList
              data={userAchievements}
              keyExtractor={(item) => item.id}
              renderItem={renderAchievementItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="emoji-events" size={64} color="#666" />
              <Text style={styles.emptyTitle}>Sin logros</Text>
              <Text style={styles.emptyText}>
                Este usuario aún no ha desbloqueado ningún logro
              </Text>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#222',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888',
    fontSize: 16,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DF2892',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DF2892',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DF2892',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  requestSentButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  friendButtonText: {
    color: '#DF2892',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
  },
  activeTab: {
    backgroundColor: '#DF2892',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  reviewCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewImageContainer: {
    width: 60,
    height: 90,
    marginRight: 12,
  },
  reviewPoster: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  reviewInfo: {
    flex: 1,
    paddingRight: 8,
  },
  reviewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
  },
  reviewText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  favoriteImageContainer: {
    width: 60,
    height: 90,
    marginRight: 12,
  },
  favoritePoster: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderPoster: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  favoriteInfo: {
    flex: 1,
    paddingRight: 8,
  },
  favoriteTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteType: {
    color: '#DF2892',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  favoriteDate: {
    color: '#888',
    fontSize: 12,
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
  },
  // Estilos para logros
  achievementCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  achievementCardCompleted: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a2b1a',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconCompleted: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  achievementDescription: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#DF2892',
    borderRadius: 3,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    minWidth: 50,
    textAlign: 'right',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default UserProfileScreen;
