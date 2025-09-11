import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import RealActorPhotoService, { RealActorPhoto } from '../services/RealActorPhotoService';

interface RealPhotoCastProps {
  cast?: string;
}

const RealPhotoCast: React.FC<RealPhotoCastProps> = ({ cast }) => {
  const [actors, setActors] = useState<RealActorPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const photoService = RealActorPhotoService.getInstance();

  useEffect(() => {
    if (cast && cast !== 'N/A') {
      loadActorPhotos();
    }
  }, [cast]);

  const loadActorPhotos = async () => {
    if (!cast || cast === 'N/A') return;
    
    setLoading(true);
    try {
      const actorNames = cast.split(',').map(name => name.trim()).slice(0, 12);
      console.log('🎭 Cargando fotos para actores:', actorNames);
      
      const actorPhotos = await photoService.getMultipleActorPhotos(actorNames);
      console.log('📸 Fotos obtenidas:', actorPhotos.map(a => ({ name: a.name, source: a.source, isReal: a.isRealPhoto })));
      
      setActors(actorPhotos);
    } catch (error) {
      console.error('Error loading actor photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (actorName: string) => {
    setLoadedImages(prev => new Set(prev).add(actorName));
  };

  const handleImageError = (actorName: string) => {
    console.log(`❌ Error loading image for ${actorName}`);
    // La imagen se mantiene como está, ya que el servicio maneja los fallbacks
  };

  if (!cast || cast === 'N/A') {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Reparto</Text>
        <Text style={styles.noDataText}>No hay información del reparto disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Reparto Principal</Text>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.loadingText}>Buscando fotos...</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {actors.map((actor, index) => (
          <View key={`${actor.name}-${index}`} style={styles.actorCard}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: actor.photoUrl }}
                style={styles.actorImage}
                onLoad={() => handleImageLoad(actor.name)}
                onError={() => handleImageError(actor.name)}
                resizeMode="cover"
              />
              
              {/* Indicador de fuente */}
              <View style={[
                styles.sourceBadge,
                { backgroundColor: actor.isRealPhoto ? '#4CAF50' : '#FF9800' }
              ]}>
                <Text style={styles.sourceText}>
                  {actor.isRealPhoto ? '📸' : '🎭'}
                </Text>
              </View>

              {/* Loading overlay mientras carga la imagen */}
              {!loadedImages.has(actor.name) && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>
            
            <Text style={styles.actorName} numberOfLines={2}>
              {actor.name}
            </Text>
            
            {/* Mostrar fuente de la foto */}
            <Text style={styles.sourceLabel}>
              {actor.source === 'tmdb' && 'TMDb'}
              {actor.source === 'fanart' && 'Fanart'}
              {actor.source === 'google' && 'Google'}
              {actor.source === 'duckduckgo' && 'DuckDuckGo'}
              {actor.source === 'placeholder' && 'Avatar'}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Estadísticas de fotos reales vs placeholders */}
      {actors.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            📸 {actors.filter(a => a.isRealPhoto).length} fotos reales • 
            🎭 {actors.filter(a => !a.isRealPhoto).length} avatares
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  scrollView: {
    paddingHorizontal: 8,
  },
  scrollContainer: {
    paddingHorizontal: 8,
  },
  actorCard: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 110,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  actorImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 45,
  },
  sourceBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sourceText: {
    fontSize: 10,
  },
  actorName: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 100,
    fontWeight: '600',
  },
  sourceLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  statsContainer: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default RealPhotoCast;
