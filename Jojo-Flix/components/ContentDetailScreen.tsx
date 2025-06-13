import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Vibration } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ContentData, ContentItem } from './ContentData';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { auth, db } from '../components/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';

const ContentDetailScreen: React.FC = () => {
  const route = useRoute();
  // Recibe contentId desde la navegación
  const { contentId, onBack } = route.params as { contentId: string; onBack?: () => void };

  // Busca el contenido por id
  const content = ContentData.find(item => item.id === contentId);

  if (!content) {
    return <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Contenido no encontrado</Text>;
  }

  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(0);

  // Estado para favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const isSerie = Array.isArray(content.categoria)
    ? content.categoria.includes('Serie')
    : content.categoria === 'Serie';

  const videoSource =
    isSerie && content.fuente.length > 0
      ? content.fuente[selectedEpisode]
      : content.fuente[0];

  // Comprobar si ya es favorito al cargar
  useEffect(() => {
    const checkFavorite = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setIsFavorite(!!(data.favoritos && data.favoritos[content.id]));
      }
    };
    checkFavorite();
  }, [content.id]);

  // Función para añadir/quitar de favoritos
  const toggleFavorite = async () => {
    Vibration.vibrate(5);
    setFavLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setFavLoading(false);
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    let favoritos: { [key: string]: any } = {};
    if (snap.exists()) {
      favoritos = { ...(snap.data().favoritos || {}) };
    }
    if (isFavorite) {
      // Borra solo la clave anidada en Firestore
      await updateDoc(userRef, { [`favoritos.${content.id}`]: deleteField() });
    } else {
      favoritos[content.id] = {
        titulo: content.nombre,
        fecha: new Date().toISOString(),
        tipo: Array.isArray(content.categoria) ? content.categoria.join(', ') : content.categoria,
      };
      await setDoc(userRef, { favoritos }, { merge: true });
    }
    setIsFavorite(!isFavorite);
    setFavLoading(false);
  };

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
        <View style={styles.puntuacionEstrenoRow}>
          <Text style={styles.infoText}>
            Estreno: {content.fechaEstreno || 'Desconocido'}
          </Text>
          <Text style={styles.infoText}>
            Puntuación: <Text style={{ color: getScoreColor(content.puntuacion) }}>{content.puntuacion}</Text>
          </Text>
        </View>
        {/* Botón de favoritos debajo de Puntuación */}
        <TouchableOpacity
          onPress={toggleFavorite}
          style={{ alignSelf: 'flex-end', marginRight: 0, marginTop: 8, marginBottom: 8, opacity: favLoading ? 0.5 : 1 }}
          disabled={favLoading}
        >
          <MaterialIcons
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={32}
            color={isFavorite ? '#DF2892' : '#fff'}
          />
        </TouchableOpacity>
        <Text style={styles.categoriaText}>
          Categoría: {Array.isArray(content.categoria) ? content.categoria.join(', ') : content.categoria || 'N/A'}
        </Text>
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
                    setShowEpisodes(false);
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

function getScoreColor(score: number) {
  if (score >= 8) return '#4caf50'; // verde
  if (score >= 6) return '#ffc107'; // amarillo
  if (score >= 4) return '#ff9800'; // naranja
  return '#f44336'; // rojo
}

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
    marginBottom: 10,
    marginTop: 4,
    marginHorizontal: 18,
  },
  puntuacionEstrenoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoriaText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Bebas Neue',
    letterSpacing: 1,
    marginTop: 2,
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