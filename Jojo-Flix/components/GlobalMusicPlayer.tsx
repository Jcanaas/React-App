import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import Header from './Header';

const { width } = Dimensions.get('window');

// Calcular margen dinámico para botones de control
const calculateButtonMargin = () => {
  const containerPadding = 30 * 2; // paddingHorizontal de controls
  const buttonSize = 60; // Tamaño aproximado del botón (padding + icono)
  const playButtonSize = 90; // Botón de play más grande
  const totalButtonsWidth = (buttonSize * 4) + playButtonSize; // 4 botones normales + 1 play button
  const availableSpace = width - containerPadding - totalButtonsWidth;
  const totalGaps = 8; // 4 botones * 2 márgenes cada uno (izq y der)
  const maxMargin = Math.max(2, Math.floor(availableSpace / totalGaps));
  return Math.min(maxMargin, 15); // Máximo 15px para no exagerar
};

interface GlobalMusicPlayerProps {
  onClose?: () => void;
}

const GlobalMusicPlayer: React.FC<GlobalMusicPlayerProps> = ({ onClose }) => {
  const router = useRouter();
  const {
    currentTrack,
    currentContent,
    isPlaying,
    isLoading,
    position,
    duration,
    isSliding,
    playPause,
    stop,
    seekTo,
    nextTrack,
    previousTrack,
    setSliding,
    setPosition,
    hidePlayer
  } = useAudioPlayer();

  if (!currentTrack || !currentContent) {
    return null;
  }

  // Funciones de navegación que cierran el reproductor y navegan
  const handleNavigation = (route: string) => {
    hidePlayer(); // Cerrar el reproductor primero
    setTimeout(() => {
      router.push(route as any);
    }, 100); // Pequeño delay para que se cierre el modal
  };

  const handleMenuPress = () => handleNavigation('/');
  const handleLogoPress = () => handleNavigation('/');
  const handleSearchPress = () => handleNavigation('/');
  const handleSocialPress = () => handleNavigation('/social');

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderStart = () => {
    setSliding(true);
  };

  const handleSliderComplete = async (value: number) => {
    setSliding(false);
    setPosition(value);
    await seekTo(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Header 
          onMenuPress={handleMenuPress}
          onLogoPress={handleLogoPress}
          onSearchPress={handleSearchPress}
          onSocialPress={handleSocialPress}
          hideStatusBarPadding={true}
        />
      </View>
      
      {/* Track Info */}
      <View style={styles.trackInfo}>
        <View style={styles.albumArt}>
          <Image
            source={currentContent.verticalbanner}
            style={styles.posterImage}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.trackTitle}>{currentTrack.title}</Text>
        <Text style={styles.trackArtist}>{currentContent.nombre}</Text>
        <Text style={styles.trackAlbum}>Banda Sonora</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={duration || 1}
          value={position}
          onSlidingStart={handleSliderStart}
          onSlidingComplete={handleSliderComplete}
          onValueChange={(value) => {
            if (isSliding) {
              setPosition(value);
            }
          }}
          minimumTrackTintColor="#DF2892"
          maximumTrackTintColor="#666"
          disabled={duration === 0}
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Main Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={stop}
          disabled={!currentTrack}
        >
          <MaterialIcons name="stop" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={previousTrack}
          disabled={!currentTrack}
        >
          <MaterialIcons name="skip-previous" size={32} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={playPause}
          style={[styles.controlButton, styles.playButton, { opacity: isLoading ? 0.5 : 1 }]}
          disabled={isLoading}
        >
          <MaterialIcons 
            name={isLoading ? "hourglass-empty" : (isPlaying ? "pause" : "play-arrow")} 
            size={40} 
            color="#fff" 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={nextTrack}
          disabled={!currentTrack}
        >
          <MaterialIcons name="skip-next" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => seekTo(0)}
          disabled={!currentTrack}
        >
          <MaterialIcons name="replay" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'flex-start', // Alinear contenido al inicio
  },
  headerContainer: {
    width: '100%',
    marginBottom: 0,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 15, // Reducido de 30 a 15
    marginTop: 0, // Eliminado margen superior para quitar espacio en blanco
    paddingHorizontal: 20,
  },
  albumArt: {
    width: width * 0.75, // Ligeramente más grande
    height: width * 0.75,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Reducido de 25 para menos espacio
    borderWidth: 3,
    borderColor: '#DF2892',
    overflow: 'hidden',
    shadowColor: '#DF2892',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  trackArtist: {
    fontSize: 17,
    color: '#DF2892',
    fontWeight: '600',
    marginBottom: 3,
  },
  trackAlbum: {
    fontSize: 13,
    color: '#888',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10, // Reducido para que la barra sea más ancha
  },
  timeText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    width: 50,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 5, // Mucho menor para acercar los tiempos
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 30, // Valor anterior
  },
  controlButton: {
    padding: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: calculateButtonMargin(), // Margen dinámico basado en ancho de pantalla
  },
  playButton: {
    backgroundColor: '#DF2892',
    padding: 25,
    borderRadius: 45,
    shadowColor: '#DF2892',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default GlobalMusicPlayer;