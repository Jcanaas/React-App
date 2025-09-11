import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWatchProgress, WatchProgress } from '../services/WatchProgressService';

interface ContinueWatchingProps {
  onContentPress?: (contentId: string) => void;
  maxItems?: number;
}

const ContinueWatching: React.FC<ContinueWatchingProps> = memo(({ 
  onContentPress, 
  maxItems = 10 
}) => {
  const router = useRouter();
  const { getContinueWatching } = useWatchProgress();
  const [continueWatchingList, setContinueWatchingList] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContinueWatching();
  }, []);

  const loadContinueWatching = async () => {
    try {
      const content = await getContinueWatching();
      setContinueWatchingList(content.slice(0, maxItems));
    } catch (error) {
      console.error('Error cargando continuar viendo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = useCallback((contentId: string) => {
    if (onContentPress) {
      onContentPress(contentId);
    } else {
      router.push({ pathname: '/content-detail-screen', params: { contentId } });
    }
  }, [onContentPress, router]);

  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressText = (item: WatchProgress): string => {
    if (item.contentType === 'serie' && item.currentEpisode && item.totalEpisodes) {
      return `Ep. ${item.currentEpisode}/${item.totalEpisodes}`;
    }
    return `${item.progressPercentage}%`;
  };

  const getTimeAgoText = (lastWatched: string): string => {
    const now = new Date();
    const watched = new Date(lastWatched);
    const diffInHours = Math.floor((now.getTime() - watched.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
    }
  };

  const renderItem = useCallback(({ item }: { item: WatchProgress }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleContentPress(item.contentId)}
      activeOpacity={0.8}
    >
      {/* Imagen con placeholder si no hay */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <MaterialIcons name="movie" size={40} color="#666" />
        </View>
        
        {/* Barra de progreso superpuesta */}
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${item.progressPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Información del contenido */}
      <View style={styles.contentInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {item.contentTitle}
        </Text>
        
        <View style={styles.metadata}>
          <Text style={styles.progressText}>
            {getProgressText(item)}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.timeAgo}>
            {getTimeAgoText(item.lastWatched)}
          </Text>
        </View>

        <Text style={styles.continueText}>
          {item.contentType === 'serie' ? 'Continuar episodio' : 'Continuar película'}
        </Text>
      </View>

      {/* Botón de play */}
      <TouchableOpacity style={styles.playButton} activeOpacity={0.7}>
        <MaterialIcons name="play-arrow" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [handleContentPress]);

  const keyExtractor = useCallback((item: WatchProgress) => item.contentId, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (continueWatchingList.length === 0) {
    return null; // No mostrar nada si no hay contenido para continuar
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="play-circle-outline" size={24} color="#DF2892" />
        <Text style={styles.sectionTitle}>Continuar viendo</Text>
        <Text style={styles.count}>({continueWatchingList.length})</Text>
      </View>

      <FlatList
        data={continueWatchingList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  count: {
    color: '#888',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  item: {
    width: 280,
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  imageContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#DF2892',
  },
  contentInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressText: {
    color: '#DF2892',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 6,
  },
  timeAgo: {
    color: '#888',
    fontSize: 12,
  },
  continueText: {
    color: '#ccc',
    fontSize: 11,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DF2892',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

ContinueWatching.displayName = 'ContinueWatching';

export default ContinueWatching;
