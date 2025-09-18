// Componente que busca fotos REALES de actores específicos por nombre
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

interface RealActorCastProps {
  actors: string[];
  director: string;
  writer?: string;
  loading?: boolean;
}

// Función que busca fotos reales del actor específico usando TMDB
const searchRealActorPhoto = async (actorName: string): Promise<string | null> => {
  const cleanName = actorName.trim();
  
  try {
    console.log(`🔍 Buscando foto real de: ${cleanName}`);
    
    // Usar TMDB API con una clave pública para buscar actores
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=3fd2be6f0c70a2a598f084ddfb75487c&query=${encodeURIComponent(cleanName)}&language=es-ES`;
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const actor = data.results.find((person: any) => 
          person.name.toLowerCase().includes(cleanName.toLowerCase()) ||
          cleanName.toLowerCase().includes(person.name.toLowerCase())
        ) || data.results[0];
        
        if (actor && actor.profile_path) {
          const photoUrl = `https://image.tmdb.org/t/p/w200${actor.profile_path}`;
          console.log(`✅ Foto real encontrada para ${cleanName}: ${actor.name}`);
          return photoUrl;
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error buscando foto para ${cleanName}:`, error);
  }

  // Intentar con Wikipedia como backup
  try {
    const wikiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`;
    const response = await fetch(wikiUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.thumbnail && data.thumbnail.source) {
        console.log(`✅ Foto encontrada en Wikipedia para ${cleanName}`);
        return data.thumbnail.source;
      }
    }
  } catch (error) {
    console.log(`❌ Error en Wikipedia para ${cleanName}:`, error);
  }

  console.log(`❌ No se encontró foto real para ${cleanName}`);
  return null;
};

// Crear placeholder estilizado cuando no hay foto
const createStylizedPlaceholder = (actorName: string) => {
  const initials = actorName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FECA57', 'FF9FF3', '54A0FF', 'A29BFE', 'FD79A8'];
  const colorIndex = actorName.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=${backgroundColor}&color=ffffff&format=png&rounded=true&bold=true&length=2&font-size=0.4`;
};

const ActorPhotoComponent: React.FC<{ actorName: string }> = ({ actorName }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRealPhoto, setIsRealPhoto] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadActorPhoto = async () => {
      setLoading(true);
      
      const realPhoto = await searchRealActorPhoto(actorName);
      
      if (realPhoto) {
        setPhotoUrl(realPhoto);
        setIsRealPhoto(true);
      } else {
        // Usar placeholder estilizado
        const placeholder = createStylizedPlaceholder(actorName);
        setPhotoUrl(placeholder);
        setIsRealPhoto(false);
      }
      
      setLoading(false);
    };

    loadActorPhoto();
  }, [actorName, retryCount]);

  const handleImageError = () => {
    console.log(`❌ Error cargando imagen para ${actorName}`);
    
    if (isRealPhoto && retryCount < 2) {
      // Si era una foto real y falló, reintentar
      setRetryCount(prev => prev + 1);
    } else {
      // Usar placeholder definitivo
      const placeholder = createStylizedPlaceholder(actorName);
      setPhotoUrl(placeholder);
      setIsRealPhoto(false);
    }
  };

  const handleImageLoad = () => {
    console.log(`✅ Imagen cargada para ${actorName} (${isRealPhoto ? 'foto real' : 'placeholder'})`);
  };

  return (
    <View style={styles.actorContainer}>
      <View style={styles.photoContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>🔍</Text>
          </View>
        ) : (
          <Image
            source={{ uri: photoUrl || createStylizedPlaceholder(actorName) }}
            style={styles.actorPhoto}
            onError={handleImageError}
            onLoad={handleImageLoad}
            resizeMode="cover"
          />
        )}
      </View>
      
      <Text style={styles.actorName} numberOfLines={2}>
        {actorName.trim()}
      </Text>
    </View>
  );
};

const RealActorCast: React.FC<RealActorCastProps> = ({ 
  actors, 
  director, 
  writer, 
  loading = false 
}) => {
  if (loading) {
    return (
      <View style={styles.mainLoadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.mainLoadingText}>Cargando información del reparto...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Director */}
      {director && director !== 'N/A' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="movie" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Director</Text>
          </View>
          <Text style={styles.directorName}>{director}</Text>
        </View>
      )}

      {/* Reparto */}
      {actors && actors.length > 0 && actors[0] !== 'N/A' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="people" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Reparto Principal</Text>
            <Text style={styles.actorCount}>({actors.length})</Text>
          </View>
          
          <Text style={styles.subtitle}>
            Buscando fotos reales de cada actor...
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.actorsScroll}
            contentContainerStyle={styles.actorsScrollContent}
          >
            {actors.slice(0, 10).map((actor, index) => (
              <ActorPhotoComponent 
                key={`${actor}-${index}`} 
                actorName={actor} 
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Estado vacío */}
      {(!actors || actors.length === 0) && (!director || director === 'N/A') && (
        <View style={styles.emptyState}>
          <MaterialIcons name="info-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No hay información de reparto disponible</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  mainLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  mainLoadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actorCount: {
    color: '#888',
    fontSize: 14,
    marginLeft: 4,
  },
  subtitle: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  directorName: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fff',
  },
  actorsScroll: {
    marginTop: 8,
  },
  actorsScrollContent: {
    paddingRight: 16,
  },
  actorContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 90,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  actorPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#fff',
  },
  loadingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 4,
  },
  actorName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default RealActorCast;
