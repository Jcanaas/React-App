import React, { useState, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TMDBSeason, TMDBEpisode } from '../services/TMDBService';
import tmdbService from '../services/TMDBService';

interface EpisodeListProps {
  season: TMDBSeason | null;
  onEpisodePress?: (episode: TMDBEpisode) => void;
  onSeasonChange?: (seasonNumber: number) => void;
  currentSeason?: number;
  totalSeasons?: number;
}

const EpisodeList: React.FC<EpisodeListProps> = memo(({ 
  season, 
  onEpisodePress,
  onSeasonChange,
  currentSeason = 1,
  totalSeasons = 1
}) => {
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);

  if (!season) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="tv" size={40} color="#666" />
        <Text style={styles.emptyText}>Episodios no disponibles</Text>
      </View>
    );
  }

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return 'Duración desconocida';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Fecha desconocida';
    }
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return '#4CAF50'; // Verde
    if (rating >= 7) return '#8BC34A'; // Verde claro
    if (rating >= 6) return '#FFC107'; // Amarillo
    if (rating >= 5) return '#FF9800'; // Naranja
    return '#F44336'; // Rojo
  };

  const renderSeasonSelector = () => {
    if (totalSeasons <= 1) return null;

    return (
      <View style={styles.seasonSelector}>
        <Text style={styles.seasonSelectorLabel}>Temporada:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonButtons}
        >
          {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(seasonNum => (
            <TouchableOpacity
              key={seasonNum}
              style={[
                styles.seasonButton,
                currentSeason === seasonNum && styles.seasonButtonActive
              ]}
              onPress={() => onSeasonChange?.(seasonNum)}
            >
              <Text style={[
                styles.seasonButtonText,
                currentSeason === seasonNum && styles.seasonButtonTextActive
              ]}>
                {seasonNum}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEpisode = (episode: TMDBEpisode) => {
    const isSelected = selectedEpisode === episode.id;
    const ratingColor = getRatingColor(episode.vote_average);

    return (
      <TouchableOpacity
        key={episode.id}
        style={[styles.episodeCard, isSelected && styles.episodeCardSelected]}
        onPress={() => {
          setSelectedEpisode(isSelected ? null : episode.id);
          onEpisodePress?.(episode);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.episodeHeader}>
          <View style={styles.episodeImageContainer}>
            {episode.still_path ? (
              <Image
                source={{ uri: tmdbService.getImageUrl(episode.still_path, 'w300') || '' }}
                style={styles.episodeImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.episodeImagePlaceholder}>
                <MaterialIcons name="tv" size={30} color="#666" />
              </View>
            )}
            
            {/* Número de episodio superpuesto */}
            <View style={styles.episodeNumberBadge}>
              <Text style={styles.episodeNumberText}>
                {episode.episode_number}
              </Text>
            </View>
          </View>

          <View style={styles.episodeInfo}>
            <Text style={styles.episodeTitle} numberOfLines={2}>
              {episode.name}
            </Text>
            
            <View style={styles.episodeMetadata}>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={14} color={ratingColor} />
                <Text style={[styles.ratingText, { color: ratingColor }]}>
                  {episode.vote_average.toFixed(1)}
                </Text>
                <Text style={styles.voteCount}>
                  ({episode.vote_count})
                </Text>
              </View>
              
              <Text style={styles.episodeDuration}>
                {formatDuration(episode.runtime)}
              </Text>
            </View>

            <Text style={styles.episodeDate}>
              {formatDate(episode.air_date)}
            </Text>
          </View>
        </View>

        {/* Descripción expandible */}
        {isSelected && episode.overview && (
          <View style={styles.episodeDescription}>
            <Text style={styles.descriptionText}>
              {episode.overview}
            </Text>
          </View>
        )}

        {/* Indicador de expansión */}
        <View style={styles.expandIndicator}>
          <MaterialIcons 
            name={isSelected ? 'expand-less' : 'expand-more'} 
            size={20} 
            color="#666" 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const averageRating = season.episodes 
    ? season.episodes.reduce((sum, ep) => sum + ep.vote_average, 0) / season.episodes.length
    : 0;

  const totalDuration = season.episodes
    ? season.episodes.reduce((sum, ep) => sum + (ep.runtime || 0), 0)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header de la temporada */}
      <View style={styles.seasonHeader}>
        <View style={styles.seasonInfo}>
          <Text style={styles.seasonTitle}>{season.name}</Text>
          <Text style={styles.seasonOverview} numberOfLines={2}>
            {season.overview || 'Sin descripción disponible'}
          </Text>
        </View>
        
        {season.poster_path && (
          <Image
            source={{ uri: tmdbService.getImageUrl(season.poster_path, 'w154') || '' }}
            style={styles.seasonPoster}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Estadísticas de la temporada */}
      <View style={styles.seasonStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{season.episode_count || 0}</Text>
          <Text style={styles.statLabel}>Episodios</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: getRatingColor(averageRating) }]}>
            {averageRating.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Rating promedio</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
          </Text>
          <Text style={styles.statLabel}>Duración total</Text>
        </View>
      </View>

      {/* Selector de temporada */}
      {renderSeasonSelector()}

      {/* Lista de episodios */}
      <ScrollView style={styles.episodesList} showsVerticalScrollIndicator={false}>
        {season.episodes?.map(renderEpisode)}
      </ScrollView>
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
  seasonHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#222',
    marginBottom: 16,
  },
  seasonInfo: {
    flex: 1,
    marginRight: 16,
  },
  seasonTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  seasonOverview: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  seasonPoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  seasonStats: {
    flexDirection: 'row',
    backgroundColor: '#222',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#DF2892',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#444',
    marginHorizontal: 8,
  },
  seasonSelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seasonSelectorLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  seasonButtons: {
    paddingRight: 16,
  },
  seasonButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  seasonButtonActive: {
    backgroundColor: '#DF2892',
  },
  seasonButtonText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  seasonButtonTextActive: {
    color: '#fff',
  },
  episodesList: {
    flex: 1,
  },
  episodeCard: {
    backgroundColor: '#222',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  episodeCardSelected: {
    borderWidth: 2,
    borderColor: '#DF2892',
  },
  episodeHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  episodeImageContainer: {
    width: 120,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  episodeImage: {
    width: '100%',
    height: '100%',
  },
  episodeImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeNumberBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  episodeNumberText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  episodeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  episodeMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  voteCount: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  episodeDuration: {
    color: '#888',
    fontSize: 12,
  },
  episodeDate: {
    color: '#666',
    fontSize: 12,
  },
  episodeDescription: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  expandIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});

EpisodeList.displayName = 'EpisodeList';

export default EpisodeList;
