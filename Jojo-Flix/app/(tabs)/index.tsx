import React, { useState } from 'react';
import { View, ActivityIndicator, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useFonts } from 'expo-font';
import { useUser } from '../../components/UserContext';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BannerCarousel from '../../components/BannerCarousel';
import ContentDetailScreen from '../../components/ContentDetailScreen';
import { ContentItem } from '../../components/ContentData';
import VerticalTripleCarouselsByCategory from '../../components/VerticalTripleCarouselsByCategory';
import SearchModal from '../../components/SearchModal';
import CategoryModal from '../../components/CategoryModal';

export default function Home() {
  const [fontsLoaded] = useFonts({
    'Bebas Neue': require('../../assets/fonts/BN.ttf'),
  });
  const [showFooter, setShowFooter] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Estado para mostrar el modal de búsqueda
  const [searchVisible, setSearchVisible] = useState(false);
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { user } = useUser();
  const [userChecked, setUserChecked] = useState(false);

  React.useEffect(() => {
    // Marca cuando el contexto de usuario ya se resolvió (sea null o un objeto)
    if (user !== undefined) setUserChecked(true);
  }, [user]);

  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  React.useEffect(() => {
    // Solo navega si el layout ya está montado y el usuario fue chequeado
    if (userChecked && navigationState?.key && segments.length > 0 && !user) {
      router.replace('/auth');
    }
  }, [user, userChecked, segments, navigationState?.key]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setShowFooter(isBottom);
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#181818', position: 'relative' }}>
      <Header
        onLogoPress={() => setSelectedContent(null)}
        onSearchPress={() => setSearchVisible(true)}
        onMenuPress={() => setCategoryVisible(true)}
      />
      {selectedContent ? (
        <ContentDetailScreen
          content={selectedContent}
          onBack={() => setSelectedContent(null)}
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ minHeight: 900, paddingBottom: 100 }}
        >
          <BannerCarousel
            nombres={[
              'Beck: Mongolian Chop Squad',
              'Monster',
              'Old Boy'
            ]}
            onVerPress={item => setSelectedContent(item)}
          />
          <VerticalTripleCarouselsByCategory
            onPress={setSelectedContent}
            filterCategories={selectedCategories}
          />
        </ScrollView>
      )}
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
        onSelect={item => {
          setSelectedContent(item);
          setSearchVisible(false);
        }}
      />
    </View>
  );
}