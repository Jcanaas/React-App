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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

const { width } = Dimensions.get('window');

const MiniMusicPlayer: React.FC = () => {
  const {
    currentTrack,
    currentContent,
    isPlaying,
    playPause,
    showPlayer,
    nextTrack,
    previousTrack
  } = useAudioPlayer();

  // Función para probar notificaciones manualmente
  const testNotification = async () => {
    try {
      console.log('🧪 Probando notificación...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎵 Test JojoFlix Music',
          body: 'Esta es una notificación de prueba del reproductor',
          data: { test: true },
        },
        trigger: null,
        identifier: 'test-notification',
      });
      console.log('✅ Notificación de prueba enviada');
    } catch (error) {
      console.error('❌ Error en notificación de prueba:', error);
    }
  };

  const insets = useSafeAreaInsets();

  if (!currentTrack || !currentContent) {
    return null;
  }

  // Manejar gestos de deslizamiento
  const onPanGestureEvent = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      const swipeThreshold = 100; // Distancia mínima para considerar swipe
      
      if (translationX > swipeThreshold) {
        // Swipe hacia la derecha - canción anterior
        previousTrack();
      } else if (translationX < -swipeThreshold) {
        // Swipe hacia la izquierda - siguiente canción
        nextTrack();
      }
    }
  };

  if (!currentTrack || !currentContent) {
    return null;
  }

  return (
    <GestureHandlerRootView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <PanGestureHandler onHandlerStateChange={onPanGestureEvent}>
        <TouchableOpacity style={styles.content} onPress={showPlayer} activeOpacity={0.9}>
          <View style={styles.trackInfo}>
            <Image
              source={currentContent.verticalbanner}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {currentContent.nombre}
              </Text>
            </View>
          </View>
          
          <View style={styles.controls}>
            {/* Botón de prueba de notificaciones (solo para debug) */}
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={(e) => {
                e.stopPropagation();
                testNotification();
              }}
            >
              <MaterialIcons name="notifications" size={16} color="#888" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={(e) => {
                e.stopPropagation();
                playPause();
              }}
            >
              <MaterialIcons 
                name={isPlaying ? "pause" : "play-arrow"} 
                size={28} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.98)',
    borderTopWidth: 2,
    borderTopColor: '#DF2892',
    shadowColor: '#DF2892',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 15,
    backdropFilter: 'blur(10px)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    minHeight: 80,
  },
  trackInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  thumbnail: {
    width: 55,
    height: 55,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#DF2892',
    shadowColor: '#DF2892',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
    fontFamily: 'Bebas Neue',
  },
  artist: {
    fontSize: 13,
    color: '#DF2892',
    fontWeight: '600',
    marginBottom: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DF2892',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DF2892',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default MiniMusicPlayer;