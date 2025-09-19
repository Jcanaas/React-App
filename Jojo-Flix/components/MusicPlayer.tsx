import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface MusicPlayerProps {
  musicSource?: any;
  title?: string;
  artist?: string;
  onClose?: () => void;
}

const { width } = Dimensions.get('window');

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  musicSource = require('../assets/Music/Beck/Follow Me [Live].mp3'),
  title = "Follow Me [Live]",
  artist = "Beck",
  onClose
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Configurar audio al montar el componente
  useEffect(() => {
    configureAudio();
    return () => {
      cleanupAudio();
    };
  }, []);

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error configurando audio:', error);
    }
  };

  const cleanupAudio = async () => {
    if (positionUpdateInterval.current) {
      clearInterval(positionUpdateInterval.current);
    }
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error limpiando audio:', error);
      }
    }
  };

  const loadSound = async () => {
    if (sound) return;

    setIsLoading(true);
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        musicSource,
        {
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
          positionMillis: 0, // Asegurar que empiece desde el principio
        },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      
      // Resetear posición al cargar
      setPosition(0);
      
      // Obtener duración
      const status = await newSound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis);
      }
    } catch (error) {
      console.error('Error cargando audio:', error);
      Alert.alert('Error', 'No se pudo cargar el archivo de audio');
    }
    setIsLoading(false);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (!isSliding) {
        setPosition(status.positionMillis || 0);
      }
      
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }
      
      setIsPlaying(status.isPlaying);
      
      // Si la canción terminó
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const playPauseSound = async () => {
    if (!sound) {
      await loadSound();
      return;
    }

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      }
    } catch (error) {
      console.error('Error reproduciendo/pausando:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setPosition(0);
      } catch (error) {
        console.error('Error deteniendo audio:', error);
      }
    }
  };

  const seekToPosition = async (value: number) => {
    if (sound && !isSliding) {
      try {
        await sound.setPositionAsync(value);
      } catch (error) {
        console.error('Error buscando posición:', error);
      }
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderStart = () => {
    setIsSliding(true);
  };

  const handleSliderComplete = async (value: number) => {
    setIsSliding(false);
    setPosition(value);
    await seekToPosition(value);
  };

  const handlePlayPause = () => {
    playPauseSound();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reproductor de Música</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <View style={styles.albumArt}>
          <MaterialIcons name="music-note" size={60} color="#DF2892" />
        </View>
        <Text style={styles.trackTitle}>{title}</Text>
        <Text style={styles.trackArtist}>{artist}</Text>
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
          minimumTrackTintColor="#FF6B6B"
          maximumTrackTintColor="#666"
          disabled={!sound || duration === 0}
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={stopSound}
          disabled={!sound}
        >
          <MaterialIcons name="stop" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={[styles.controlButton, styles.playButton, { opacity: isLoading ? 0.5 : 1 }]}
          disabled={isLoading}
        >
          <MaterialIcons 
            name={isLoading ? "hourglass-empty" : (isPlaying ? "pause" : "play-arrow")} 
            size={32} 
            color="#fff" 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.restartButton]}
          onPress={() => seekToPosition(0)}
          disabled={!sound}
        >
          <MaterialIcons name="replay" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isPlaying ? 'Simulando reproducción...' : 'Demo - Presiona play'}
        </Text>
        <Text style={styles.infoText}>
          Instala expo-av para reproducción real
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#DF2892',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  albumArt: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#DF2892',
  },
  trackTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  trackArtist: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DF2892',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  playButton: {
    backgroundColor: '#DF2892',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  stopButton: {
    backgroundColor: '#666',
  },
  restartButton: {
    backgroundColor: '#666',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MusicPlayer;