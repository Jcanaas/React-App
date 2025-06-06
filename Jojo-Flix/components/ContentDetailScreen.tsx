import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ContentItem } from './ContentData';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface Props {
  content: ContentItem;
  onBack?: () => void;
}

const ContentDetailScreen: React.FC<Props> = ({ content, onBack }) => {
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(0);

  const isSerie = Array.isArray(content.categoria)
    ? content.categoria.includes('Serie')
    : content.categoria === 'Serie';

  const videoSource =
    isSerie && content.fuente.length > 0
      ? content.fuente[selectedEpisode]
      : content.fuente[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image source={content.fondo} style={styles.backgroundImage} />
        <View style={styles.overlay} />
        <View style={styles.logoContainer}>
          <Image source={content.logo} style={styles.logo} resizeMode="contain" />
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Estreno: {content.fechaEstreno || 'Desconocido'}</Text>
        <Text style={styles.infoText}>
          Categoría: {Array.isArray(content.categoria) ? content.categoria.join(', ') : content.categoria || 'N/A'}
        </Text>
        <Text style={styles.infoText}>Puntuación: {content.puntuacion}</Text>
      </View>

      {/* Descripción */}
      <Text style={styles.descripcion}>{content.descripcion}</Text>

      {/* Episodios para series */}
      {isSerie && content.nombresEpisodios.length > 0 && (
        <View style={styles.episodiosContainer}>
          <TouchableOpacity
            style={styles.episodiosHeader}
            onPress={() => setShowEpisodes(!showEpisodes)}
            activeOpacity={0.7}
          >
            <Text style={styles.episodiosTitle}>
              Episodios ({content.nombresEpisodios.length})
            </Text>
            <MaterialIcons
              name={showEpisodes ? 'expand-less' : 'expand-more'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
          {showEpisodes && (
            <View>
              {content.nombresEpisodios.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.episodioItem,
                    selectedEpisode === index && styles.episodioItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedEpisode(index);
                    setShowEpisodes(false); // Plegar la lista al seleccionar
                  }}
                >
                  <Text style={styles.episodioText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Reproductor SIEMPRE visible si hay fuente */}
      {videoSource && (
        <View style={styles.playerContainer}>
          <WebView
            source={{ uri: videoSource }}
            style={{ height: 220, borderRadius: 12, overflow: 'hidden' }}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      )}

      {/* Botón de volver */}
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ alignSelf: 'center', marginVertical: 16 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Bebas Neue' }}>Volver</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 32,
    zIndex: 2,
    height: '100%',
  },
  logo: {
    width: 200,
    height: 80,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    marginTop: 4,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Bebas Neue',
    letterSpacing: 1,
  },
  descripcion: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 18,
    marginBottom: 18,
    marginTop: 4,
    textAlign: 'justify',
  },
  episodiosContainer: {
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    padding: 8,
  },
  episodiosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  episodiosTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Bebas Neue',
    letterSpacing: 1,
  },
  episodioItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  episodioItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  episodioText: {
    color: '#fff',
    fontSize: 16,
  },
  playerContainer: {
    marginHorizontal: 18,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: 220,
  },
});

export default ContentDetailScreen;