import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '../components/UserContext';

export const useAuthNavigation = () => {
  const { user, loading, isAuthenticated } = useUser();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    console.log('useAuthNavigation: Estado actual:', {
      loading,
      isAuthenticated,
      segments: segments.join('/'),
      navigationReady: !!navigationState?.key
    });

    // No hacer nada si estamos cargando o la navegación no está lista
    if (loading || !navigationState?.key) {
      console.log('useAuthNavigation: Esperando...');
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthScreen = segments[0] === 'auth';
    
    // Rutas que requieren autenticación pero están fuera de (tabs)
    const authenticatedRoutes = [
      'music-player',
      'content-detail-screen',
      'achievements',
      'achievements-main',
      'user-profile',
      'user-info',
      'social',
      'chat'
    ];
    
    const inAuthenticatedRoute = authenticatedRoutes.includes(segments[0]);

    console.log('useAuthNavigation: inAuthGroup:', inAuthGroup, 'inAuthScreen:', inAuthScreen, 'inAuthenticatedRoute:', inAuthenticatedRoute);

    if (!isAuthenticated && !inAuthScreen) {
      // Usuario no autenticado - solo permitir pantalla de auth
      if (inAuthenticatedRoute || inAuthGroup) {
        console.log('useAuthNavigation: Acceso denegado, redirigiendo a auth');
        router.replace('/auth');
      }
    } else if (isAuthenticated && inAuthScreen) {
      // Usuario autenticado pero está en la pantalla de auth
      console.log('useAuthNavigation: Redirigiendo a home');
      router.replace('/(tabs)');
    }
  }, [loading, isAuthenticated, segments, navigationState?.key]);

  return { user, loading, isAuthenticated };
};
