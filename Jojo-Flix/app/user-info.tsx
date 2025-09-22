import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Button, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../components/firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FavoritesCarousel from '../components/FavoritesCarousel';
import { reviewService, UserReview } from '../services/ReviewService';
import { useRouter } from 'expo-router';
import { useRobustGamification } from '../contexts/RobustGamificationContext';

const placeholderImg = 'https://ui-avatars.com/api/?name=User&background=DF2892&color=fff';

const exampleImages = [
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_beck.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_ellietlou.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_green.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_orange.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_pink.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_purple.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_red.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_white.png',
  'https://raw.githubusercontent.com/Jcanaas/JoJo-Flix/main/img/user_yellow.png',
];

const UserInfoScreen = () => {
  const [userData, setUserData] = useState<{ name: string; email: string; profileImage?: string; favoritos?: { [key: string]: any } } | null>(null);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  
  // Hook de gamificación
  const {
    userAchievements,
    userProgress,
    achievementSummary,
    totalPoints,
    completionPercentage,
    refreshAllData: reloadGamification,
    isLoading
  } = useRobustGamification();

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data() as any);
        }
      }
      setLoading(false);
    };
    
    const loadUserReviews = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          console.log('👤 PANEL DE USUARIO: Cargando reseñas para usuario:', user.uid);
          const reviews = await reviewService.getUserReviews(user.uid);
          console.log('👤 PANEL DE USUARIO: Reseñas encontradas:', reviews.length);
          reviews.forEach(review => {
            console.log('👤 PANEL DE USUARIO: Reseña details:', {
              id: review.id,
              movieId: review.movieId,
              movieTitle: review.movieTitle,
              rating: review.rating,
              moviePoster: review.moviePoster
            });
          });
          setUserReviews(reviews);
        } catch (error) {
          console.error('Error loading user reviews:', error);
        }
      }
      setReviewsLoading(false);
    };
    
    fetchUser();
    loadUserReviews();
  }, []);

  const handleChangeProfileImage = async (url: string) => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(ref, { profileImage: url });
      setUserData(prev => prev ? { ...prev, profileImage: url } : prev);
      setModalVisible(false);
      setCustomUrl('');
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar la imagen de perfil.');
    }
    setSaving(false);
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

  const renderReview = ({ item }: { item: UserReview }) => (
    <TouchableOpacity 
      style={styles.reviewCard}
      onPress={() => {
        // Navegar al detalle del contenido
        router.push(`/content-detail-screen?id=${item.movieId}&type=movie`);
      }}
    >
      <View style={styles.reviewHeader}>
        {item.moviePoster && typeof item.moviePoster === 'string' && 
         (item.moviePoster.startsWith('http') || item.moviePoster.startsWith('data:')) ? (
          <Image source={{ uri: item.moviePoster }} style={styles.reviewPoster} />
        ) : (
          <View style={[styles.reviewPoster, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialIcons name="movie" size={24} color="#666" />
          </View>
        )}
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewTitle}>{item.movieTitle}</Text>
          {renderStarRating(item.rating)}
          <Text style={styles.reviewDate}>
            {item.timestamp.toLocaleDateString()}
          </Text>
        </View>
      </View>
      {item.reviewText && (
        <Text style={styles.reviewText} numberOfLines={3}>
          {item.reviewText}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Obtener favoritos del usuario (con id)
  const favoritos = userData?.favoritos ? Object.entries(userData.favoritos) : [];

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#DF2892" size="large" />
          </View>
        ) : !userData ? (
          <Text style={styles.title}>No hay datos de usuario</Text>
        ) : (
          <View>
            {/* Avatar con opción de cambiar */}
            <View style={styles.userInfoSection}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={() => setModalVisible(true)}>
                <View style={styles.avatarBorder}>
                  <Image
                    source={{ uri: userData.profileImage || placeholderImg }}
                    style={styles.avatar}
                    resizeMode="contain"
                    defaultSource={{ uri: placeholderImg }}
                  />
                </View>
                <Text style={styles.changePhotoText}>Cambiar foto</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Información del usuario</Text>
              <Text style={styles.name}>{userData.name}</Text>
              <Text style={styles.email}>{userData.email}</Text>
            </View>
            {/* Sección Favoritos con Carousel */}
            <FavoritesCarousel 
              favoriteIds={favoritos.map(([favId]) => favId)}
            />

            {/* Sección de Reseñas */}
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Mis Reseñas</Text>
              {reviewsLoading ? (
                <ActivityIndicator color="#DF2892" size="large" style={styles.loader} />
              ) : userReviews.length > 0 ? (
                <FlatList
                  data={userReviews}
                  keyExtractor={(item) => item.id || ''}
                  renderItem={renderReview}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyReviewsState}>
                  <MaterialIcons name="rate-review" size={48} color="#666" />
                  <Text style={styles.emptyReviewsTitle}>Sin reseñas</Text>
                  <Text style={styles.emptyReviewsText}>
                    Aún no has escrito ninguna reseña
                  </Text>
                </View>
              )}
            </View>

            {/* Sección de Logros */}
            <View style={styles.achievementsSection}>
              <TouchableOpacity 
                style={styles.achievementsButton}
                onPress={() => router.push('/achievements-main')}
              >
                <View style={styles.achievementsButtonContent}>
                  <View style={styles.achievementsButtonLeft}>
                    <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
                    <View style={styles.achievementsInfo}>
                      <Text style={styles.achievementsTitle}>Mis Logros</Text>
                      <Text style={styles.achievementsSubtitle}>
                        Nivel {Math.floor((totalPoints || 0) / 1000) + 1} • {userAchievements?.filter(a => a.isCompleted).length || 0} logros • {totalPoints || 0} puntos
                      </Text>
                    </View>
                  </View>
                  <View style={styles.achievementsButtonRight}>
                    <View style={styles.progressCircle}>
                      <Text style={styles.progressText}>{Math.round(completionPercentage || 0)}%</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#666" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Botón de cerrar sesión */}
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => signOut(auth)}
              >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      <Footer />

      {/* Modal para cambiar imagen */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Elige una imagen de perfil</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {exampleImages.map((img, idx) => (
                <TouchableOpacity key={img} onPress={() => handleChangeProfileImage(img)}>
                  <View style={styles.exampleImgBorder}>
                    <Image source={{ uri: img }} style={styles.exampleImg} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ marginBottom: 6, color: '#fff' }}>O pega una URL personalizada:</Text>
            <TextInput
              style={styles.input}
              placeholder="URL de imagen"
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#DF2892' }]}
                onPress={() => customUrl ? handleChangeProfileImage(customUrl) : null}
                disabled={saving || !customUrl}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#aaa' }]}
                onPress={() => { setModalVisible(false); setCustomUrl(''); }}
                disabled={saving}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#181818',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#DF2892',
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  title: {
    color: '#DF2892',
    fontSize: 22,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
  },
  email: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 24,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#DF2892',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  logoutSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  changePhotoText: {
    color: '#DF2892',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 20,
    width: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: '#DF2892', // Rosa para destacar
    textAlign: 'center',
  },
  exampleImgBorder: {
    padding: 2, // Menos espacio entre borde e imagen
    borderRadius: 55, // Igual o mayor que la mitad del tamaño total (56+2+2)/2 = 30
    borderWidth: 3,
    borderColor: '#DF2892',
    backgroundColor: '#181818',
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleImg: {
    width: 56,
    height: 56,
    borderRadius: 28, // Redondo
    backgroundColor: '#222',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    width: 220,
    marginBottom: 4,
    fontSize: 15,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  // Nuevos estilos para reseñas
  reviewsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#DF2892',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  reviewCard: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewPoster: {
    width: 50,
    height: 75,
    borderRadius: 4,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
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
  emptyReviewsState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyReviewsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyReviewsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  // Estilos para logros
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  achievementsButton: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  achievementsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achievementsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  achievementsInfo: {
    marginLeft: 12,
    flex: 1,
  },
  achievementsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementsSubtitle: {
    color: '#888',
    fontSize: 12,
  },
  achievementsButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DF2892',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default UserInfoScreen;