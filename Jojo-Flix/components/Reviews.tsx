import React, { useState, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TMDBReview } from '../services/TMDBService';

interface ReviewsProps {
  reviews: TMDBReview[];
  onViewAllPress?: () => void;
  maxReviews?: number;
}

const Reviews: React.FC<ReviewsProps> = memo(({ 
  reviews, 
  onViewAllPress,
  maxReviews = 3 
}) => {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="rate-review" size={40} color="#666" />
        <Text style={styles.emptyText}>No hay reseñas disponibles</Text>
        <Text style={styles.emptySubtext}>¡Sé el primero en escribir una!</Text>
      </View>
    );
  }

  const displayedReviews = reviews.slice(0, maxReviews);

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const getAvatarUrl = (avatarPath: string | null): string | null => {
    if (!avatarPath) return null;
    
    // TMDB avatar paths can start with /https:// for Gravatar
    if (avatarPath.startsWith('/https://')) {
      return avatarPath.substring(1); // Remove leading slash
    }
    
    // Regular TMDB avatar
    return `https://image.tmdb.org/t/p/w64_and_h64_face${avatarPath}`;
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating / 2); // TMDB uses 0-10, we want 0-5
    const hasHalfStar = (rating / 2) % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <MaterialIcons key={i} name="star" size={16} color="#FFD700" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <MaterialIcons key={i} name="star-half" size={16} color="#FFD700" />
        );
      } else {
        stars.push(
          <MaterialIcons key={i} name="star-border" size={16} color="#666" />
        );
      }
    }
    
    return (
      <View style={styles.starsContainer}>
        {stars}
        <Text style={styles.ratingText}>{(rating / 2).toFixed(1)}</Text>
      </View>
    );
  };

  const renderReview = (review: TMDBReview) => {
    const isExpanded = expandedReviews.has(review.id);
    const shouldTruncate = review.content.length > 300;
    const displayContent = isExpanded || !shouldTruncate 
      ? review.content 
      : review.content.substring(0, 300) + '...';

    const avatarUrl = getAvatarUrl(review.author_details.avatar_path);

    return (
      <View key={review.id} style={styles.reviewCard}>
        {/* Header con autor y rating */}
        <View style={styles.reviewHeader}>
          <View style={styles.authorContainer}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={20} color="#666" />
                </View>
              )}
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {review.author_details.name || review.author}
              </Text>
              <Text style={styles.reviewDate}>
                {formatDate(review.created_at)}
              </Text>
            </View>
          </View>
          
          {review.author_details.rating && renderStars(review.author_details.rating)}
        </View>

        {/* Contenido de la reseña */}
        <Text style={styles.reviewContent}>
          {displayContent}
        </Text>

        {/* Botón para expandir/contraer */}
        {shouldTruncate && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleReviewExpansion(review.id)}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Ver menos' : 'Ver más'}
            </Text>
            <MaterialIcons 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={16} 
              color="#DF2892" 
            />
          </TouchableOpacity>
        )}

        {/* Footer con acciones */}
        <View style={styles.reviewFooter}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="thumb-up" size={16} color="#666" />
            <Text style={styles.actionText}>Útil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="share" size={16} color="#666" />
            <Text style={styles.actionText}>Compartir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="flag" size={16} color="#666" />
            <Text style={styles.actionText}>Reportar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="rate-review" size={24} color="#DF2892" />
        <Text style={styles.title}>Reseñas de Usuarios</Text>
        <View style={styles.reviewCount}>
          <Text style={styles.countText}>{reviews.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
        {displayedReviews.map(renderReview)}
      </ScrollView>

      {reviews.length > maxReviews && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>
            Ver todas las reseñas ({reviews.length})
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color="#DF2892" />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  reviewCount: {
    backgroundColor: '#DF2892',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewsList: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: '#222',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewContent: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  expandButtonText: {
    color: '#DF2892',
    fontSize: 14,
    marginRight: 4,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewAllText: {
    color: '#DF2892',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});

Reviews.displayName = 'Reviews';

export default Reviews;
