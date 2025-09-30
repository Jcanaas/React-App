import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { auth, db } from '../components/firebaseConfig';
import { useContentOMDb } from '../hooks/useOMDb';
import { ContentData } from './ContentData';
import OMDbReviews from './OMDbReviews';
import UserReviews from './UserReviews';
import RealActorCast from './RealActorCast';
import { favoritesService } from '../services/FavoritesService';
import OptimizedImage from './OptimizedImage';

// Constantes de dimensiones
const windowWidth = Dimensions.get('window').width;
const PLAYER_WIDTH = Math.round(windowWidth * 0.9);
const PLAYER_HEIGHT = Math.round(PLAYER_WIDTH / (16 / 9));
const isMobile = windowWidth < 700;
const BANNER_ASPECT_RATIO = isMobile ? 16 / 9 : 21 / 8;
const bannerHeight = Math.round(windowWidth / BANNER_ASPECT_RATIO);

const ContentDetailScreen: React.FC = () => {
  const route = useRoute();
  // Recibe contentId desde la navegación
  const { contentId, onBack } = route.params as { contentId: string; onBack?: () => void };

  // Busca el contenido por id
  const content = ContentData.find(item => item.id === contentId);

  if (!content) {
    console.log('❌ Contenido no encontrado:', { 
      contentId, 
      availableIds: ContentData.slice(0, 5).map(item => ({ id: item.id, nombre: item.nombre }))
    });
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181818', padding: 20 }}>
        <MaterialIcons name="error" size={64} color="#666" />
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 16, fontSize: 18 }}>Contenido no encontrado</Text>
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 8, fontSize: 14 }}>
          ID buscado: {contentId}
        </Text>
      </View>
    );
  }

  const [showEpisodes, setShowEpisodes] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [activeTab, setActiveTab] = useState<'player' | 'cast' | 'reviews'>('player');
  const [activeReviewTab, setActiveReviewTab] = useState<'critics' | 'users'>('users');

  // Estado para favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  
  // Estado para controlar orientación en pantalla completa
  const [isFullscreen, setIsFullscreen] = useState(false);

  // OMDb Integration
  const isSerie = Array.isArray(content.categoria)
    ? content.categoria.includes('Serie')
    : content.categoria === 'Serie';
  
  // Usar OMDb con el título del contenido
  const { omdbData, loading: omdbLoading, error: omdbError } = useContentOMDb(
    content.nombre, 
    !isSerie // true para películas, false para series
  );

  const videoSource =
    isSerie && content.fuente.length > 0
      ? content.fuente[selectedEpisode]
      : content.fuente[0];

  // Comprobar si ya es favorito al cargar
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const isInFavorites = await favoritesService.isInFavorites(content.id);
        setIsFavorite(isInFavorites);
      } catch (error) {
        console.error('Error verificando favoritos:', error);
      }
    };
    checkFavorite();
  }, [content.id]);

  // Manejar orientación de pantalla
  useEffect(() => {
    // Al montar el componente, bloquear en vertical
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    
    // Limpiar al desmontar
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  // Manejar cambios de pantalla completa
  useEffect(() => {
    if (isFullscreen) {
      // Permitir todas las orientaciones en pantalla completa
      ScreenOrientation.unlockAsync();
    } else {
      // Bloquear en vertical cuando no esté en pantalla completa
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    }
  }, [isFullscreen]);

  // Función para añadir/quitar de favoritos
  const toggleFavorite = async () => {
    Vibration.vibrate(5);
    setFavLoading(true);
    
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para agregar favoritos');
      setFavLoading(false);
      return;
    }

    try {
      if (isFavorite) {
        // Remover de favoritos
        await favoritesService.removeFromFavorites(content.id);
        setIsFavorite(false);
        Alert.alert('✓', 'Removido de favoritos');
      } else {
        // Agregar a favoritos
        const contentType = isSerie ? 'tv' : 'movie';
        await favoritesService.addToFavorites({
          contentId: content.id,
          contentType,
          title: content.nombre,
          poster: content.verticalbanner || content.fondo || '',
          overview: content.descripcion,
          releaseDate: content.fechaEstreno,
          rating: content.puntuacion
        });
        setIsFavorite(true);
        Alert.alert('✓', 'Agregado a favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Banner */}
      <View style={[styles.bannerContainer, { width: windowWidth, height: bannerHeight }]}>
        <OptimizedImage source={content.fondo} style={styles.backgroundImage} showLoader={true} />
        <View style={styles.overlay} />
        <View style={styles.logoContainer}>
          <OptimizedImage
            source={content.logo}
            style={{
              ...styles.logo,
              width: isMobile ? 220 : 440,
              height: isMobile ? 90 : 180,
            }}
            resizeMode="contain"
            showLoader={true}
          />
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

      {/* Tabs de navegación */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'player' && styles.activeTab]}
          onPress={() => setActiveTab('player')}
        >
          <MaterialIcons name="play-circle-outline" size={18} color={activeTab === 'player' ? '#000' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'player' && styles.activeTabText]}>
            Play
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cast' && styles.activeTab]}
          onPress={() => setActiveTab('cast')}
        >
          <MaterialIcons name="people" size={18} color={activeTab === 'cast' ? '#000' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'cast' && styles.activeTabText]}>
            Reparto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <MaterialIcons name="rate-review" size={18} color={activeTab === 'reviews' ? '#000' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Críticas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido de los tabs */}
      <View style={styles.tabContent}>
        {activeTab === 'player' && (
          <View>
            {/* Episodios para series (manteniendo la funcionalidad original) */}
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

            {/* Reproductor de video */}
            <View style={styles.playerContainer}>
              <View style={styles.playerWrapper}>
                <WebView
                  style={styles.webView}
                  source={{ uri: videoSource }}
                  allowsInlineMediaPlayback={true}
                  allowsFullscreenVideo={true}
                  allowsProtectedMedia={true}
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  scalesPageToFit={true}
                  mixedContentMode="compatibility"
                  thirdPartyCookiesEnabled={true}
                  sharedCookiesEnabled={true}
                  userAgent="Mozilla/5.0 (Linux; Android 10; Mobile; rv:109.0) Gecko/117.0 Firefox/117.0"
                  injectedJavaScript={`
                    // Función para detectar cambios de pantalla completa
                    function setupFullscreenDetection() {
                      // Detectar cambios en el estado de pantalla completa
                      document.addEventListener('fullscreenchange', function() {
                        const isFullscreen = !!document.fullscreenElement;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'fullscreenChange',
                          isFullscreen: isFullscreen
                        }));
                      });
                      
                      document.addEventListener('webkitfullscreenchange', function() {
                        const isFullscreen = !!document.webkitFullscreenElement;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'fullscreenChange',
                          isFullscreen: isFullscreen
                        }));
                      });
                      
                      // Configurar videos cuando estén disponibles
                      var videos = document.querySelectorAll('video');
                      videos.forEach(function(video) {
                        video.setAttribute('controls', 'true');
                        video.setAttribute('controlsList', '');
                        video.style.width = '100%';
                        video.style.height = '100%';
                        
                        // Detectar cambios de pantalla completa específicos del video
                        video.addEventListener('webkitbeginfullscreen', function() {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'fullscreenChange',
                            isFullscreen: true
                          }));
                        });
                        
                        video.addEventListener('webkitendfullscreen', function() {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'fullscreenChange',
                            isFullscreen: false
                          }));
                        });
                      });
                    }
                    
                    // Ejecutar cuando el DOM esté listo
                    if (document.readyState === 'loading') {
                      document.addEventListener('DOMContentLoaded', setupFullscreenDetection);
                    } else {
                      setupFullscreenDetection();
                    }
                    
                    // También ejecutar después de un breve delay para videos que se cargan dinámicamente
                    setTimeout(setupFullscreenDetection, 1000);
                    
                    true; // Importante para que funcione el script
                  `}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === 'fullscreenChange') {
                        console.log('Fullscreen changed:', data.isFullscreen);
                        setIsFullscreen(data.isFullscreen);
                      }
                    } catch (error) {
                      console.log('WebView message:', event.nativeEvent.data);
                    }
                  }}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.log('WebView error: ', nativeEvent);
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {activeTab === 'cast' && (
          <View style={styles.castContainer}>
            <RealActorCast 
              actors={omdbData?.actors || []}
              director={omdbData?.director || ''}
              writer={omdbData ? omdbData.title : undefined}
              loading={omdbLoading}
            />
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsContainer}>
            {/* Review Tabs */}
            <View style={styles.reviewTabs}>
              <TouchableOpacity
                style={[styles.reviewTab, activeReviewTab === 'users' && styles.activeReviewTab]}
                onPress={() => setActiveReviewTab('users')}
              >
                <MaterialIcons name="people" size={18} color={activeReviewTab === 'users' ? '#000' : '#888'} />
                <Text style={[styles.reviewTabText, activeReviewTab === 'users' && styles.activeReviewTabText]}>
                  Usuarios JojoFlix
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.reviewTab, activeReviewTab === 'critics' && styles.activeReviewTab]}
                onPress={() => setActiveReviewTab('critics')}
              >
                <MaterialIcons name="star" size={18} color={activeReviewTab === 'critics' ? '#000' : '#888'} />
                <Text style={[styles.reviewTabText, activeReviewTab === 'critics' && styles.activeReviewTabText]}>
                  Críticos
                </Text>
              </TouchableOpacity>
            </View>

            {/* Review Content */}
            {activeReviewTab === 'users' && (
              <UserReviews
                movieId={(() => {
                  // SOLUCIÓN: Dar prioridad al content.id para mantener consistencia
                  const movieId = content.id?.toString() || omdbData?.imdbId || 'unknown';
                  console.log('📽️ CONTENT DETAIL: Pasando movieId a UserReviews:', movieId);
                  console.log('📽️ CONTENT DETAIL: Valores disponibles:', {
                    contentId: content.id,
                    contentIdString: content.id?.toString(),
                    omdbId: omdbData?.imdbId,
                    finalMovieId: movieId,
                    prioridadUsada: content.id ? 'content.id' : omdbData?.imdbId ? 'omdb.imdbId' : 'unknown'
                  });
                  return movieId;
                })()}
                movieTitle={content.nombre}
                moviePoster={typeof content.verticalbanner === 'string' ? content.verticalbanner : 
                           omdbData?.poster || 
                           `https://ui-avatars.com/api/?name=${encodeURIComponent(content.nombre)}&background=DF2892&color=fff&size=300`}
              />
            )}

            {activeReviewTab === 'critics' && (
              <OMDbReviews 
                ratings={omdbData?.ratings || []}
                imdbRating={omdbData?.rating || 'N/A'}
                imdbVotes={omdbData ? '0' : 'N/A'}
                awards={omdbData?.awards || 'N/A'}
                loading={omdbLoading}
              />
            )}
          </View>
        )}
      </View>

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
    // width y height ahora se asignan dinámicamente en el componente
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
    alignSelf: 'center', // Centra el banner
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover', // Igual que BannerCarousel
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
    zIndex: 2, // Asegura que el logo esté sobre el overlay
    height: '100%',
    position: 'relative', // Necesario para stacking en web
  },
  logo: {
    marginBottom: 18,
    zIndex: 2,
    position: 'relative',
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
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    // alignSelf ahora se asigna dinámicamente
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isMobile ? 12 : 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: isMobile ? 90 : 110,
    maxWidth: isMobile ? 130 : 160,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
    flexShrink: 1,
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  playerWrapper: {
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webView: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  castContainer: {
    paddingVertical: 10,
  },
  reviewsContainer: {
    paddingVertical: 10,
  },
  reviewTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  reviewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeReviewTab: {
    backgroundColor: '#fff',
  },
  reviewTabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeReviewTabText: {
    color: '#000',
  },
});

export default ContentDetailScreen;