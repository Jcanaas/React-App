import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import { UserProvider } from '../components/UserContext';
import { NotificationProvider } from '../contexts/NotificationContext';

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
    <UserProvider>
      <NotificationProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
          <StatusBar style="auto" />
        </ThemeProvider>
      </NotificationProvider>
    </UserProvider>
  );
}

// router.push('/auth')
// navigation.navigate('auth')
