import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import { UserProvider } from '../components/UserContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { AudioPlayerProvider, useAudioPlayer } from '../contexts/AudioPlayerContext';
import GlobalMusicPlayer from '../components/GlobalMusicPlayer';
import MiniMusicPlayer from '../components/MiniMusicPlayer';
import { View, StyleSheet, Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Componente interno que tiene acceso al contexto de audio
function AppContent() {
  const { currentTrack, isPlayerVisible } = useAudioPlayer();
  
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          animation: 'none', // Esto elimina la animación de transición entre pantallas
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)/index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="user-profile" />
        <Stack.Screen name="+not-found" />
      </Stack>
      
      {/* Reproductor mini cuando hay música pero el player está cerrado */}
      {currentTrack && !isPlayerVisible && <MiniMusicPlayer />}
      
      {/* Reproductor global completo */}
      <Modal
        visible={currentTrack !== null && isPlayerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <GlobalMusicPlayer />
      </Modal>
      
      <StatusBar style="auto" />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Bloquear orientación en toda la aplicación
  useScreenOrientation();
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <NotificationProvider>
          <AudioPlayerProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AppContent />
            </ThemeProvider>
          </AudioPlayerProvider>
        </NotificationProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
