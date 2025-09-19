import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ContentItem, SoundtrackItem } from './ContentData';
import GlobalMusicPlayer from './GlobalMusicPlayer';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

const { width } = Dimensions.get('window');

interface SoundtrackListProps {
  content: ContentItem;
  onBack: () => void;
}

const SoundtrackList: React.FC<SoundtrackListProps> = ({
  content,
  onBack
}) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const { playTrack, isPlayerVisible } = useAudioPlayer();

  const handleTrackSelect = async (track: SoundtrackItem, index: number) => {
    if (content.soundtracks) {
      await playTrack(track, content, content.soundtracks, index);
      setShowPlayer(true);
    }
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  const formatDuration = (duration?: string) => {
    return duration || '--:--';
  };

  if (showPlayer) {
    return (
      <GlobalMusicPlayer onClose={handleClosePlayer} />
    );
  }

  return (
    <View style={styles.container}>
      {/* Content Info */}
      <View style={styles.contentHeader}>
        <Image
          source={content.verticalbanner}
          style={styles.banner}
          resizeMode="cover"
        />
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{content.nombre}</Text>
          <Text style={styles.contentSubtitle}>
            Banda Sonora • {content.soundtracks?.length || 0} canciones
          </Text>
          <Text style={styles.contentDescription} numberOfLines={3}>
            {content.descripcion}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.playAllButton}
          onPress={() => {
            if (content.soundtracks && content.soundtracks.length > 0) {
              handleTrackSelect(content.soundtracks[0], 0);
            }
          }}
        >
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
          <Text style={styles.playAllText}>Reproducir todo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.shuffleButton}
          onPress={() => {
            Alert.alert('Próximamente', 'Función de reproducción aleatoria');
          }}
        >
          <MaterialIcons name="shuffle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Track List */}
      <ScrollView 
        style={styles.trackList}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Canciones</Text>

        {content.soundtracks?.map((track, index) => (
          <TouchableOpacity
            key={index}
            style={styles.trackItem}
            onPress={() => handleTrackSelect(track, index)}
            activeOpacity={0.7}
          >
            <View style={styles.trackNumber}>
              <Text style={styles.trackNumberText}>{index + 1}</Text>
            </View>

            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {content.nombre}
              </Text>
            </View>

            <View style={styles.trackActions}>
              <Text style={styles.trackDuration}>
                {formatDuration(track.duration)}
              </Text>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => {
                  Alert.alert(
                    track.title,
                    'Opciones disponibles:',
                    [
                      {
                        text: 'Reproducir',
                        onPress: () => handleTrackSelect(track, index)
                      },
                      {
                        text: 'Añadir a favoritos',
                        onPress: () => Alert.alert('Próximamente', 'Función de favoritos')
                      },
                      { text: 'Cancelar', style: 'cancel' }
                    ]
                  );
                }}
              >
                <MaterialIcons name="more-vert" size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {(!content.soundtracks || content.soundtracks.length === 0) && (
          <View style={styles.emptyState}>
            <MaterialIcons name="music-note" size={60} color="#666" />
            <Text style={styles.emptyText}>
              No hay canciones disponibles
            </Text>
            <Text style={styles.emptySubtext}>
              Las bandas sonoras se añadirán próximamente
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  contentHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#2a2a2a',
    marginBottom: 20,
    marginTop: 10, // Pequeño margen superior
  },
  banner: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#DF2892',
    fontWeight: '600',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DF2892',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  playAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  shuffleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 25,
  },
  trackList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackNumber: {
    width: 30,
    alignItems: 'center',
  },
  trackNumberText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 15,
  },
  trackTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 13,
    color: '#888',
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackDuration: {
    fontSize: 13,
    color: '#888',
    marginRight: 10,
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default SoundtrackList;