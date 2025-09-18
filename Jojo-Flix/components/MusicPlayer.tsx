import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    Alert.alert(
      'Reproductor de Música',
      'Para usar el reproductor completo, instala las dependencias necesarias:\n\nnpm install expo-av @react-native-community/slider\n\nPor ahora, este es un reproductor de demostración.',
      [
        { text: 'OK', onPress: () => setIsPlaying(!isPlaying) }
      ]
    );
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

      {/* Fake Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>0:00</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: isPlaying ? '45%' : '0%' }]} />
        </View>
        <Text style={styles.timeText}>3:24</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={() => setIsPlaying(false)}
        >
          <MaterialIcons name="stop" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={[styles.controlButton, styles.playButton]}
        >
          <MaterialIcons 
            name={isPlaying ? "pause" : "play-arrow"} 
            size={32} 
            color="#fff" 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.restartButton]}
          onPress={() => setIsPlaying(false)}
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