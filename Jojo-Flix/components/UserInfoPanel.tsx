import React from 'react';
import { View, Text, Image, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../services/UserProfileService';

interface UserInfoPanelProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  favoriteMovies?: Array<{ id: string; title: string; poster?: string }>;
  favoriteSeries?: Array<{ id: string; title: string; poster?: string }>;
  userStats?: {
    totalReviews: number;
    averageRating: number;
    totalFavorites: number;
  };
}

const UserInfoPanel: React.FC<UserInfoPanelProps> = ({
  visible,
  onClose,
  userProfile,
  favoriteMovies = [],
  favoriteSeries = [],
  userStats
}) => {
  if (!userProfile) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil de Usuario</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Avatar y información básica */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: userProfile.photoURL || 'https://ui-avatars.com/api/?name=User&background=DF2892&color=fff' }}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.displayName}>{userProfile.displayName}</Text>
            <Text style={styles.email}>{userProfile.email}</Text>
            {userProfile.bio && (
              <Text style={styles.bio}>{userProfile.bio}</Text>
            )}
          </View>

          {/* Estadísticas */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userStats?.totalReviews || userProfile?.totalReviews || 0}
              </Text>
              <Text style={styles.statLabel}>Reseñas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userStats?.averageRating 
                  ? userStats.averageRating.toFixed(1)
                  : userProfile?.averageRating.toFixed(1) || '0.0'
                }
              </Text>
              <Text style={styles.statLabel}>Calificación Promedio</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userStats?.totalFavorites || (favoriteMovies.length + favoriteSeries.length)}
              </Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </View>
          </View>

          {/* Fecha de registro */}
          <View style={styles.infoSection}>
            <MaterialIcons name="calendar-today" size={20} color="#DF2892" />
            <Text style={styles.infoText}>Miembro desde {formatDate(userProfile.joinDate)}</Text>
          </View>

          {/* Películas favoritas */}
          {favoriteMovies.length > 0 && (
            <View style={styles.favoritesSection}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="movie" size={20} color="#DF2892" />
                {' '}Películas Favoritas ({favoriteMovies.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {favoriteMovies.slice(0, 10).map((movie, index) => (
                  <View key={`movie-${index}`} style={styles.favoriteItem}>
                    {movie.poster ? (
                      <Image 
                        source={typeof movie.poster === 'string' ? { uri: movie.poster } : movie.poster} 
                        style={styles.favoriteImage} 
                      />
                    ) : (
                      <View style={[styles.favoriteImage, styles.placeholderImage]}>
                        <MaterialIcons name="movie" size={30} color="#666" />
                      </View>
                    )}
                    <Text style={styles.favoriteTitle} numberOfLines={2}>{movie.title}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Series favoritas */}
          {favoriteSeries.length > 0 && (
            <View style={styles.favoritesSection}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="tv" size={20} color="#DF2892" />
                {' '}Series Favoritas ({favoriteSeries.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {favoriteSeries.slice(0, 10).map((series, index) => (
                  <View key={`series-${index}`} style={styles.favoriteItem}>
                    {series.poster ? (
                      <Image 
                        source={typeof series.poster === 'string' ? { uri: series.poster } : series.poster} 
                        style={styles.favoriteImage} 
                      />
                    ) : (
                      <View style={[styles.favoriteImage, styles.placeholderImage]}>
                        <MaterialIcons name="tv" size={30} color="#666" />
                      </View>
                    )}
                    <Text style={styles.favoriteTitle} numberOfLines={2}>{series.title}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Mensaje si no hay favoritos */}
          {favoriteMovies.length === 0 && favoriteSeries.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="favorite-border" size={48} color="#666" />
              <Text style={styles.emptyText}>Aún no tiene contenido favorito</Text>
            </View>
          )}

          {/* Espaciado final */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#DF2892',
    backgroundColor: '#181818',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DF2892',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#ccc',
  },
  favoritesSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalScroll: {
    paddingLeft: 20,
  },
  favoriteItem: {
    marginRight: 12,
    width: 100,
  },
  favoriteImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#333',
    marginBottom: 8,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteTitle: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default UserInfoPanel;
