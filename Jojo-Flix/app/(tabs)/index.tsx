import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BannerCarousel from '../../components/BannerCarousel';
import CategoryModal from '../../components/CategoryModal';
import ContinueWatching from '../../components/ContinueWatching';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SearchModal from '../../components/SearchModal';
import SeasonalBanner from '../../components/SeasonalBanner';
import VerticalTripleCarouselsByCategory from '../../components/VerticalTripleCarouselsByCategory';
import { useAuthNavigation } from '../../hooks/useAuthNavigation';
import notificationManager from '../../services/NotificationService';
import { useSeasonalNotifications } from '../../services/SeasonalNotificationService';

export default function Home() {
  const [fontsLoaded] = useFonts({
    'Bebas Neue': require('../../assets/fonts/BN.ttf'),
  });
  const [showFooter, setShowFooter] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { user, loading, isAuthenticated } = useAuthNavigation();
  const router = useRouter();
  const { scheduleSeasonalNotif, getCurrentEvent } = useSeasonalNotifications();

  // Configurar notificaciones cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('Usuario autenticado - configurando notificaciones');
      
      // Configurar notificaciones básicas
      notificationManager.setupNotifications().then(() => {
        notificationManager.updateLastActivity();
        console.log('Notificaciones básicas configuradas');
      });

      // Configurar notificaciones estacionales
      scheduleSeasonalNotif().then(() => {
        console.log('Notificaciones estacionales configuradas');
      });
    }
  }, [isAuthenticated, loading, scheduleSeasonalNotif]);

  // Memoizar los nombres del banner para evitar re-renders
  const bannerNames = useMemo(() => [
    'Beck: Mongolian Chop Squad',
    'Monster',
    'Old Boy'
  ], []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setShowFooter(isBottom);
  }, []);

  const handleSearchPress = useCallback(() => setSearchVisible(true), []);
  const handleMenuPress = useCallback(() => setCategoryVisible(true), []);
  const handleSocialPress = useCallback(() => {
    router.push('/social');
  }, [router]);

  const handleMusicPlayerPress = useCallback(() => {
    router.push('/music-player');
  }, [router]);

  const handleContentPress = useCallback((item: any) => {
    router.push({ pathname: '/content-detail-screen', params: { contentId: item.id } });
  }, [router]);

  const handleSearchSelect = useCallback((item: any) => {
    setSearchVisible(false);
    router.push({ pathname: '/content-detail-screen', params: { contentId: item.id } });
  }, [router]);

  // Mostrar loading mientras cargan las fuentes o se verifica la autenticación
  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181818' }}>
        <ActivityIndicator size="large" color="#DF2892" />
        <Text style={{ color: '#fff', marginTop: 10 }}>
          {!fontsLoaded ? 'Cargando fuentes...' : 'Verificando sesión...'}
        </Text>
      </View>
    );
  }

  // Si no está autenticado, no mostrar nada (el hook se encarga de la navegación)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#181818', position: 'relative' }}>
      {/* <AuthDebugger /> */}
      <Header
        onSearchPress={handleSearchPress}
        onMenuPress={handleMenuPress}
        onSocialPress={handleSocialPress}
      />
      <ScrollView
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ minHeight: 900, paddingBottom: 100 }}
        removeClippedSubviews={true}
      >
        <BannerCarousel nombres={bannerNames} />
        <SeasonalBanner />
        <ContinueWatching onContentPress={handleContentPress} />
        <VerticalTripleCarouselsByCategory
          filterCategories={selectedCategories}
          onPress={handleContentPress}
        />
        
        {/* Botón para el reproductor de música */}
        <View style={styles.musicPlayerSection}>
          <TouchableOpacity 
            style={styles.musicPlayerButton}
            onPress={handleMusicPlayerPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="headphones" size={20} color="#DF2892" />
            <Text style={styles.musicPlayerText}>Bandas Sonoras</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showFooter && <Footer />}
      <CategoryModal
        visible={categoryVisible}
        setVisible={setCategoryVisible}
        selected={selectedCategories}
        setSelected={setSelectedCategories}
      />
      <SearchModal
        visible={searchVisible}
        setVisible={setSearchVisible}
        onSelect={handleSearchSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  musicPlayerSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  musicPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  musicPlayerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
});