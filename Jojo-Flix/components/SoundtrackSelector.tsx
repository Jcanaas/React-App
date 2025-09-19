import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { ContentData, ContentItem } from './ContentData';

const { width } = Dimensions.get('window');

interface SoundtrackSelectorProps {
  onSelectContent: (content: ContentItem) => void;
  onClose: () => void;
}

const SoundtrackSelector: React.FC<SoundtrackSelectorProps> = ({
  onSelectContent,
  onClose
}) => {
  // Filtrar solo el contenido que tiene soundtracks
  const contentWithSoundtracks = ContentData.filter(item => 
    item.soundtracks && item.soundtracks.length > 0
  );

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
      style={styles.container}
    >
      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bandas Sonoras</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Selecciona una serie o película para escuchar su banda sonora
        </Text>

        <View style={styles.grid}>
          {contentWithSoundtracks.map((content) => (
            <TouchableOpacity
              key={content.id}
              style={styles.contentCard}
              onPress={() => onSelectContent(content)}
              activeOpacity={0.8}
            >
              <View style={styles.posterContainer}>
                <Image
                  source={content.verticalbanner}
                  style={styles.poster}
                  resizeMode="cover"
                />
                <View style={styles.overlay}>
                  <MaterialIcons name="play-circle-filled" size={40} color="#fff" />
                </View>
              </View>
              
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle} numberOfLines={2}>
                  {content.nombre}
                </Text>
                <Text style={styles.soundtrackCount}>
                  {content.soundtracks?.length || 0} canciones
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {contentWithSoundtracks.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="music-off" size={60} color="#666" />
            <Text style={styles.emptyText}>
              No hay bandas sonoras disponibles aún
            </Text>
            <Text style={styles.emptySubtext}>
              Próximamente añadiremos más contenido musical
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flex: 1,
    paddingTop: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contentCard: {
    width: (width - 60) / 2,
    marginBottom: 25,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(223, 40, 146, 0.1)',
  },
  posterContainer: {
    position: 'relative',
    aspectRatio: 0.67, // Proporción típica de posters
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  contentInfo: {
    padding: 15,
    backgroundColor: '#2a2a2a',
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 20,
  },
  soundtrackCount: {
    fontSize: 13,
    color: '#DF2892',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SoundtrackSelector;