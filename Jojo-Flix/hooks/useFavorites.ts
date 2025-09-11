import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentItem } from '../components/ContentData';

const FAVORITES_KEY = 'favoriteContent';

export interface FavoriteItem {
  id: string;
  title: string;
  addedAt: string;
  lastWatched?: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos al inicializar
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToFavorites = useCallback(async (content: ContentItem) => {
    try {
      const newFavorite: FavoriteItem = {
        id: content.id,
        title: content.nombre,
        addedAt: new Date().toISOString(),
      };

      const updatedFavorites = [...favorites, newFavorite];
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      
      console.log(`"${content.nombre}" añadido a favoritos`);
      return true;
    } catch (error) {
      console.error('Error añadiendo a favoritos:', error);
      return false;
    }
  }, [favorites]);

  const removeFromFavorites = useCallback(async (contentId: string) => {
    try {
      const updatedFavorites = favorites.filter(fav => fav.id !== contentId);
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      
      console.log('Contenido eliminado de favoritos');
      return true;
    } catch (error) {
      console.error('Error eliminando de favoritos:', error);
      return false;
    }
  }, [favorites]);

  const isFavorite = useCallback((contentId: string) => {
    return favorites.some(fav => fav.id === contentId);
  }, [favorites]);

  const updateLastWatched = useCallback(async (contentId: string) => {
    try {
      const updatedFavorites = favorites.map(fav => 
        fav.id === contentId 
          ? { ...fav, lastWatched: new Date().toISOString() }
          : fav
      );
      
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error actualizando última visualización:', error);
    }
  }, [favorites]);

  const getFavoritesSortedByLastWatched = useCallback(() => {
    return [...favorites].sort((a, b) => {
      const aTime = a.lastWatched || a.addedAt;
      const bTime = b.lastWatched || b.addedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [favorites]);

  const clearAllFavorites = useCallback(async () => {
    try {
      setFavorites([]);
      await AsyncStorage.removeItem(FAVORITES_KEY);
      console.log('Todos los favoritos eliminados');
    } catch (error) {
      console.error('Error limpiando favoritos:', error);
    }
  }, []);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    updateLastWatched,
    getFavoritesSortedByLastWatched,
    clearAllFavorites,
    refreshFavorites: loadFavorites,
  };
};
