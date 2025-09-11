import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Rating {
  Source: string;
  Value: string;
}

interface OMDbReviewsProps {
  ratings: Rating[];
  imdbRating: string;
  imdbVotes: string;
  awards: string;
  loading?: boolean;
}

const OMDbReviews: React.FC<OMDbReviewsProps> = ({ 
  ratings, 
  imdbRating, 
  imdbVotes, 
  awards,
  loading = false 
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={40} color="#fff" />
        <Text style={styles.loadingText}>Cargando puntuaciones...</Text>
      </View>
    );
  }

  // Función para obtener icono según la fuente
  const getSourceIcon = (source: string) => {
    if (source.includes('IMDb')) return 'movie';
    if (source.includes('Rotten Tomatoes')) return 'local-movies';
    if (source.includes('Metacritic')) return 'star';
    return 'rate-review';
  };

  // Función para obtener color según puntuación
  const getScoreColor = (value: string, source: string) => {
    if (source.includes('Rotten Tomatoes')) {
      const score = parseInt(value);
      if (score >= 80) return '#4CAF50'; // Verde
      if (score >= 60) return '#FF9800'; // Naranja
      return '#F44336'; // Rojo
    }
    
    if (source.includes('IMDb') || source.includes('Metacritic')) {
      const score = parseFloat(value);
      if (score >= 8.0 || score >= 80) return '#4CAF50';
      if (score >= 6.0 || score >= 60) return '#FF9800';
      return '#F44336';
    }
    
    return '#fff';
  };

  // Convertir puntuación IMDb a estrellas
  const getStars = (rating: string) => {
    const score = parseFloat(rating);
    const stars = Math.round((score / 10) * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <MaterialIcons
        key={i}
        name={i < stars ? 'star' : 'star-border'}
        size={20}
        color={i < stars ? '#FFD700' : '#666'}
      />
    ));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Puntuación Principal IMDb */}
      {imdbRating && imdbRating !== 'N/A' && (
        <View style={styles.mainRatingCard}>
          <View style={styles.mainRatingHeader}>
            <MaterialIcons name="movie" size={30} color="#FFD700" />
            <Text style={styles.mainRatingTitle}>IMDb Rating</Text>
          </View>
          
          <View style={styles.mainRatingContent}>
            <Text style={styles.mainRatingScore}>{imdbRating}</Text>
            <Text style={styles.mainRatingMax}>/10</Text>
          </View>
          
          <View style={styles.starsContainer}>
            {getStars(imdbRating)}
          </View>
          
          {imdbVotes && imdbVotes !== 'N/A' && (
            <Text style={styles.votesText}>
              Basado en {imdbVotes.toLocaleString()} votos
            </Text>
          )}
        </View>
      )}

      {/* Puntuaciones de otras fuentes */}
      {ratings && ratings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Puntuaciones de Críticos</Text>
          
          {ratings.map((rating, index) => (
            <View key={index} style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <MaterialIcons 
                  name={getSourceIcon(rating.Source)} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.ratingSource}>{rating.Source}</Text>
              </View>
              
              <Text style={[
                styles.ratingValue,
                { color: getScoreColor(rating.Value, rating.Source) }
              ]}>
                {rating.Value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Premios */}
      {awards && awards !== 'N/A' && (
        <View style={styles.awardsCard}>
          <View style={styles.awardsHeader}>
            <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
            <Text style={styles.awardsTitle}>Premios y Reconocimientos</Text>
          </View>
          <Text style={styles.awardsText}>{awards}</Text>
        </View>
      )}

      {/* Mensaje si no hay datos */}
      {(!ratings || ratings.length === 0) && 
       (!imdbRating || imdbRating === 'N/A') && (
        <View style={styles.noDataContainer}>
          <MaterialIcons name="info-outline" size={40} color="#666" />
          <Text style={styles.noDataText}>
            No hay puntuaciones disponibles
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    marginTop: 10,
  },
  mainRatingCard: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  mainRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  mainRatingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mainRatingContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mainRatingScore: {
    color: '#FFD700',
    fontSize: 48,
    fontWeight: 'bold',
  },
  mainRatingMax: {
    color: '#ccc',
    fontSize: 24,
    marginLeft: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  votesText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ratingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingSource: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  awardsCard: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  awardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  awardsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  awardsText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default OMDbReviews;
