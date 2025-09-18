import { useCallback, useEffect, useState } from 'react';

interface ImageCacheEntry {
  uri: string;
  timestamp: number;
  loading: boolean;
  error: boolean;
}

class ImageCacheManager {
  private cache = new Map<string, ImageCacheEntry>();
  private maxCacheSize = 100;
  private maxAge = 30 * 60 * 1000; // 30 minutos

  getImageState(source: any): ImageCacheEntry {
    const key = this.getImageKey(source);
    const cached = this.cache.get(key);
    
    if (cached) {
      // Verificar si la imagen no ha expirado
      if (Date.now() - cached.timestamp < this.maxAge) {
        return cached;
      } else {
        this.cache.delete(key);
      }
    }

    // Crear nueva entrada en caché
    const newEntry: ImageCacheEntry = {
      uri: key,
      timestamp: Date.now(),
      loading: true,
      error: false
    };

    this.cache.set(key, newEntry);
    this.cleanupCache();
    
    return newEntry;
  }

  updateImageState(source: any, state: Partial<ImageCacheEntry>) {
    const key = this.getImageKey(source);
    const existing = this.cache.get(key);
    
    if (existing) {
      this.cache.set(key, { ...existing, ...state });
    }
  }

  private getImageKey(source: any): string {
    if (typeof source === 'string') {
      return source;
    }
    if (typeof source === 'number') {
      return `require_${source}`;
    }
    if (source && typeof source === 'object' && source.uri) {
      return source.uri;
    }
    return JSON.stringify(source);
  }

  private cleanupCache() {
    if (this.cache.size > this.maxCacheSize) {
      // Eliminar las entradas más antiguas
      const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - this.maxCacheSize);
      
      toDelete.forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        ...value
      }))
    };
  }
}

const imageCache = new ImageCacheManager();

export const useOptimizedImage = (source: any) => {
  const [imageState, setImageState] = useState(() => imageCache.getImageState(source));

  useEffect(() => {
    const state = imageCache.getImageState(source);
    setImageState(state);
  }, [source]);

  const onLoad = useCallback(() => {
    imageCache.updateImageState(source, {
      loading: false,
      error: false,
      timestamp: Date.now()
    });
    setImageState(prev => ({ ...prev, loading: false, error: false }));
  }, [source]);

  const onError = useCallback(() => {
    imageCache.updateImageState(source, {
      loading: false,
      error: true,
      timestamp: Date.now()
    });
    setImageState(prev => ({ ...prev, loading: false, error: true }));
    console.warn('Failed to load image:', source);
  }, [source]);

  const onLoadStart = useCallback(() => {
    imageCache.updateImageState(source, {
      loading: true,
      error: false
    });
    setImageState(prev => ({ ...prev, loading: true, error: false }));
  }, [source]);

  return {
    isLoading: imageState.loading,
    hasError: imageState.error,
    onLoad,
    onError,
    onLoadStart,
    clearCache: imageCache.clearCache,
    getCacheStats: imageCache.getCacheStats
  };
};

export default imageCache;
