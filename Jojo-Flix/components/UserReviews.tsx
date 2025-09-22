import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../components/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { reviewService, UserReview, MovieStats } from '../services/ReviewService';
import { userProfileService } from '../services/UserProfileService';
import { useRouter } from 'expo-router';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import UserInfoPanel from './UserInfoPanel';

// Variable global para controlar si ya se actualizaron las reseñas en esta sesión
let hasUpdatedReviewsInSession = false;

interface UserReviewsProps {
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
}

const UserReviews: React.FC<UserReviewsProps> = ({ movieId, movieTitle, moviePoster }) => {
  const router = useRouter();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [movieStats, setMovieStats] = useState<MovieStats | null>(null);
  const [userReview, setUserReview] = useState<UserReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<UserReview | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [showUserInfoPanel, setShowUserInfoPanel] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    console.log('🎬 PESTAÑA DE PELÍCULA: Props recibidas:', { movieId, movieTitle, moviePoster });
    console.log('🎬 PESTAÑA DE PELÍCULA: Iniciando carga de datos...');
    loadData();
    
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user !== currentUser) {
        // El estado de autenticación cambió, recargar datos
        console.log('🎬 PESTAÑA DE PELÍCULA: Usuario cambió, recargando...');
        loadData();
      }
    });

    return () => unsubscribe();
  }, [movieId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay usuario autenticado
      const currentUserData = auth.currentUser;
      
      // Actualizar datos de usuario en reseñas existentes (solo una vez por sesión)
      if (currentUserData && !hasUpdatedReviewsInSession) {
        try {
          await reviewService.updateExistingReviewsUserData();
          hasUpdatedReviewsInSession = true;
        } catch (updateError) {
          console.error('⚠️ Error actualizando reseñas:', updateError);
        }
      }
      
      // Cargar reseñas y estadísticas en paralelo
      const [reviewsData, statsData, userReviewData] = await Promise.all([
        reviewService.getMovieReviews(movieId, showAllReviews ? 50 : 10),
        reviewService.getMovieStats(movieId),
        currentUserData ? reviewService.getUserReviewForMovie(movieId, currentUserData.uid) : Promise.resolve(null)
      ]);

      setReviews(reviewsData);
      setMovieStats(statsData);
      setUserReview(userReviewData);
    } catch (error: any) {
      console.error('Error cargando reseñas:', error);
      
      // Si es un error de permisos, mostrar mensaje específico
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        Alert.alert(
          'Configuración Pendiente',
          'Las reseñas están temporalmente deshabilitadas. El administrador necesita configurar los permisos de la base de datos.',
          [{ text: 'Entendido' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserAvatarPress = async (userId: string) => {
    try {
      console.log('🔍 Obteniendo información del usuario:', userId);
      
      const currentUser = auth.currentUser;
      
      // Si es tu propio perfil, redirigir al panel de control
      if (currentUser && userId === currentUser.uid) {
        console.log('👤 Es tu propio perfil, redirigiendo al panel de control...');
        router.push('/user-info');
        return;
      }
      
      // Si es otro usuario, mostrar el panel de información
      const userProfile = await userProfileService.getCompleteUserProfile(userId);
      
      if (userProfile) {
        console.log('✅ Perfil obtenido:', userProfile);
        setSelectedUserProfile(userProfile);
        setShowUserInfoPanel(true);
      } else {
        console.log('❌ No se encontraron datos del usuario');
        Alert.alert('Error', 'No se pudo cargar la información del usuario');
      }
    } catch (error) {
      console.error('❌ Error cargando perfil del usuario:', error);
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!currentUser) {
      Alert.alert('Inicia Sesión', 'Debes iniciar sesión para dar like a las reseñas');
      return;
    }

    try {
      await reviewService.likeReview(reviewId);
      await loadData(); // Recargar para mostrar el cambio
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar el like');
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!currentUser) {
      Alert.alert('Inicia Sesión', 'Debes iniciar sesión para marcar reseñas como útiles');
      return;
    }

    try {
      await reviewService.markHelpful(reviewId);
      await loadData(); // Recargar para mostrar el cambio
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo marcar como útil');
    }
  };

  const handleReportReview = (reviewId: string) => {
    Alert.alert(
      'Reportar Reseña',
      '¿Por qué quieres reportar esta reseña?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Spam', onPress: () => reportReview(reviewId, 'spam') },
        { text: 'Contenido ofensivo', onPress: () => reportReview(reviewId, 'offensive') },
        { text: 'Spoilers sin avisar', onPress: () => reportReview(reviewId, 'spoilers') },
        { text: 'Otro', onPress: () => reportReview(reviewId, 'other') }
      ]
    );
  };

  const reportReview = async (reviewId: string, reason: string) => {
    try {
      await reviewService.reportReview(reviewId, reason);
      Alert.alert('Gracias', 'Tu reporte ha sido enviado. Revisaremos esta reseña.');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el reporte');
    }
  };

  const handleEditReview = (review: UserReview) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = async (review: UserReview) => {
    await loadData(); // Recargar datos
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStatsHeader = () => {
    if (!movieStats || movieStats.totalReviews === 0) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <MaterialIcons name="people" size={24} color="#FFD700" />
          <Text style={styles.statsTitle}>Reseñas de JojoFlix</Text>
        </View>

        <View style={styles.statsContent}>
          <View style={styles.averageRating}>
            <Text style={styles.averageScore}>{movieStats.averageRating}</Text>
            <StarRating
              rating={movieStats.averageRating}
              disabled
              size={20}
              showHalfStars
            />
            <Text style={styles.totalReviews}>
              {movieStats.totalReviews} reseña{movieStats.totalReviews !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.ratingsDistribution}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = movieStats.ratingsDistribution[star as keyof typeof movieStats.ratingsDistribution];
              const percentage = movieStats.totalReviews > 0 ? (count / movieStats.totalReviews) * 100 : 0;
              
              return (
                <View key={star} style={styles.distributionRow}>
                  <Text style={styles.starLabel}>{star}★</Text>
                  <View style={styles.distributionBar}>
                    <View
                      style={[
                        styles.distributionFill,
                        { width: `${percentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderUserReviewSection = () => {
    if (!currentUser) {
      return (
        <View style={styles.loginPrompt}>
          <MaterialIcons name="account-circle" size={40} color="#666" />
          <Text style={styles.loginText}>Inicia sesión para escribir una reseña</Text>
        </View>
      );
    }

    if (userReview) {
      return (
        <View style={styles.userReviewContainer}>
          <View style={styles.userReviewHeader}>
            <Text style={styles.userReviewTitle}>Tu Reseña</Text>
            <TouchableOpacity
              onPress={() => handleEditReview(userReview)}
              style={styles.editButton}
            >
              <MaterialIcons name="edit" size={20} color="#4CAF50" />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
          {renderReviewItem(userReview, true)}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.writeReviewButton}
        onPress={() => setShowReviewForm(true)}
      >
        <MaterialIcons name="rate-review" size={24} color="#4CAF50" />
        <Text style={styles.writeReviewText}>Escribir Reseña</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#4CAF50" />
      </TouchableOpacity>
    );
  };

  const renderReviewItem = (review: UserReview, isCurrentUser: boolean = false) => {
    const isLiked = currentUser ? review.likedBy?.includes(currentUser.uid) : false;
    const isHelpful = currentUser ? review.helpfulBy?.includes(currentUser.uid) : false;
    const canInteract = currentUser && !isCurrentUser;

    return (
      <View key={review.id} style={[styles.reviewItem, isCurrentUser && styles.currentUserReview]}>
        {/* Review Header */}
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAuthor}>
            <TouchableOpacity onPress={() => handleUserAvatarPress(review.userId)}>
              {review.userAvatar && typeof review.userAvatar === 'string' ? (
                <Image
                  source={{ uri: review.userAvatar }}
                  style={styles.userAvatar}
                  defaultSource={{ uri: 'https://ui-avatars.com/api/?name=User&background=DF2892&color=fff' }}
                />
              ) : (
                <View style={styles.defaultAvatar}>
                  <MaterialIcons name="account-circle" size={32} color="#666" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{review.userName}</Text>
              <Text style={styles.reviewDate}>{formatDate(review.timestamp)}</Text>
            </View>
          </View>
          <View style={styles.reviewRating}>
            <StarRating rating={review.rating} disabled size={16} />
          </View>
        </View>

        {/* Spoiler Warning */}
        {review.spoilerWarning && (
          <View style={styles.spoilerWarning}>
            <MaterialIcons name="warning" size={16} color="#FF9800" />
            <Text style={styles.spoilerText}>Contiene spoilers</Text>
          </View>
        )}

        {/* Review Text */}
        <Text style={styles.reviewText}>{review.reviewText}</Text>

        {/* Review Actions */}
        {canInteract && (
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={() => handleLikeReview(review.id!)}
            >
              <MaterialIcons
                name={isLiked ? "thumb-up" : "thumb-up-off-alt"}
                size={16}
                color={isLiked ? "#4CAF50" : "#666"}
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {review.likes || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, isHelpful && styles.actionButtonActive]}
              onPress={() => handleMarkHelpful(review.id!)}
            >
              <MaterialIcons
                name={isHelpful ? "check-circle" : "check-circle-outline"}
                size={16}
                color={isHelpful ? "#2196F3" : "#666"}
              />
              <Text style={[styles.actionText, isHelpful && styles.actionTextActive]}>
                Útil {review.helpful || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReportReview(review.id!)}
            >
              <MaterialIcons name="flag" size={16} color="#666" />
              <Text style={styles.actionText}>Reportar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando reseñas...</Text>
      </View>
    );
  }

  // Calcular reseñas de otros usuarios
  const otherReviews = reviews.filter(review => review.userId !== currentUser?.uid);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderStatsHeader()}
      {renderUserReviewSection()}

      {/* Other Reviews */}
      {otherReviews.length > 0 && (
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>
            Otras Reseñas ({otherReviews.length})
          </Text>

          {otherReviews.map(review => renderReviewItem(review))}

          {!showAllReviews && otherReviews.length >= 10 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => {
                setShowAllReviews(true);
                loadData();
              }}
            >
              <Text style={styles.showMoreText}>Ver más reseñas</Text>
              <MaterialIcons name="expand-more" size={20} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Empty State */}
      {reviews.length === 0 && !userReview && (
        <View style={styles.emptyState}>
          <MaterialIcons name="rate-review" size={48} color="#666" />
          <Text style={styles.emptyTitle}>No hay reseñas aún</Text>
          <Text style={styles.emptyText}>
            ¡Sé el primero en escribir una reseña para esta {movieTitle.includes('Season') ? 'serie' : 'película'}!
          </Text>
        </View>
      )}

      {/* Review Form Modal */}
      <ReviewForm
        visible={showReviewForm}
        onClose={() => {
          setShowReviewForm(false);
          setEditingReview(null);
        }}
        movieId={movieId}
        movieTitle={movieTitle}
        moviePoster={moviePoster}
        onReviewSubmitted={handleReviewSubmitted}
        editingReview={editingReview}
      />

      {/* User Info Panel */}
      <UserInfoPanel
        visible={showUserInfoPanel}
        onClose={() => {
          setShowUserInfoPanel(false);
          setSelectedUserProfile(null);
        }}
        userProfile={selectedUserProfile}
        favoriteMovies={[]}
        favoriteSeries={[]}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  averageRating: {
    alignItems: 'center',
    flex: 1,
  },
  averageScore: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalReviews: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  ratingsDistribution: {
    flex: 2,
    marginLeft: 20,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starLabel: {
    color: '#fff',
    fontSize: 12,
    width: 25,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  distributionCount: {
    color: '#ccc',
    fontSize: 12,
    width: 20,
    textAlign: 'right',
  },
  loginPrompt: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 20,
  },
  loginText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
  },
  userReviewContainer: {
    marginBottom: 20,
  },
  userReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userReviewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  writeReviewText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  reviewsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  currentUserReview: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
  },
  reviewRating: {
    marginLeft: 12,
  },
  spoilerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  spoilerText: {
    color: '#FF9800',
    fontSize: 12,
    marginLeft: 4,
  },
  reviewText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  actionTextActive: {
    color: '#fff',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  showMoreText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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

export default UserReviews;
