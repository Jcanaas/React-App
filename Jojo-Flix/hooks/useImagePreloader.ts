import { Image } from 'react-native';

interface PreloadConfig {
  priority: 'high' | 'medium' | 'low';
  preloadCount: number;
}

class ImagePreloader {
  private preloadQueue: Array<{ source: any; priority: string }> = [];
  private preloadedImages = new Set<string>();
  private isPreloading = false;

  // Configuraciones por tipo de imagen
  private configs: Record<string, PreloadConfig> = {
    banner: { priority: 'high', preloadCount: 3 },
    poster: { priority: 'medium', preloadCount: 10 },
    background: { priority: 'high', preloadCount: 2 },
    logo: { priority: 'medium', preloadCount: 5 }
  };

  addToQueue(source: any, type: string = 'poster') {
    const imageKey = this.getImageKey(source);
    
    if (this.preloadedImages.has(imageKey)) {
      return; // Ya está precargada
    }

    const config = this.configs[type] || this.configs.poster;
    
    // Evitar duplicados en la cola
    const exists = this.preloadQueue.some(item => 
      this.getImageKey(item.source) === imageKey
    );
    
    if (!exists) {
      this.preloadQueue.push({
        source,
        priority: config.priority
      });

      // Ordenar cola por prioridad
      this.preloadQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - 
               priorityOrder[a.priority as keyof typeof priorityOrder];
      });
    }

    this.processQueue();
  }

  async preloadBatch(sources: any[], type: string = 'poster') {
    const config = this.configs[type] || this.configs.poster;
    const batch = sources.slice(0, config.preloadCount);
    
    batch.forEach(source => this.addToQueue(source, type));
  }

  private async processQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    // Procesar hasta 3 imágenes en paralelo
    const batch = this.preloadQueue.splice(0, 3);
    
    try {
      await Promise.all(
        batch.map(item => this.preloadSingleImage(item.source))
      );
    } catch (error) {
      console.warn('Error en preload batch:', error);
    }

    this.isPreloading = false;

    // Continuar con la siguiente tanda si hay más en cola
    if (this.preloadQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private preloadSingleImage(source: any): Promise<void> {
    return new Promise((resolve) => {
      const imageKey = this.getImageKey(source);
      
      if (this.preloadedImages.has(imageKey)) {
        resolve();
        return;
      }

      try {
        // Para React Native, usar Image.prefetch para URIs remotas
        if (typeof source === 'string' && (source.startsWith('http') || source.startsWith('https'))) {
          Image.prefetch(source)
            .then(() => {
              this.preloadedImages.add(imageKey);
              resolve();
            })
            .catch(() => {
              resolve(); // No fallar si no se puede precargar
            });
        } else {
          // Para imágenes locales (require), marcar como precargadas inmediatamente
          this.preloadedImages.add(imageKey);
          resolve();
        }
      } catch (error) {
        resolve(); // No fallar si hay errores
      }
    });
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

  // Precargar imágenes adyacentes basado en scroll position
  preloadAdjacent(currentIndex: number, items: any[], visibleRange: number = 2) {
    const start = Math.max(0, currentIndex - visibleRange);
    const end = Math.min(items.length, currentIndex + visibleRange);
    
    for (let i = start; i < end; i++) {
      if (items[i] && items[i].verticalbanner) {
        this.addToQueue(items[i].verticalbanner, 'poster');
      }
      if (items[i] && items[i].fondo) {
        this.addToQueue(items[i].fondo, 'background');
      }
    }
  }

  getStats() {
    return {
      queueLength: this.preloadQueue.length,
      preloadedCount: this.preloadedImages.size,
      isPreloading: this.isPreloading
    };
  }

  clearCache() {
    this.preloadedImages.clear();
    this.preloadQueue = [];
    this.isPreloading = false;
  }
}

export const imagePreloader = new ImagePreloader();

// Hook para usar el preloader
export const useImagePreloader = () => {
  const preloadImages = (sources: any[], type: string = 'poster') => {
    imagePreloader.preloadBatch(sources, type);
  };

  const preloadAdjacent = (currentIndex: number, items: any[], visibleRange?: number) => {
    imagePreloader.preloadAdjacent(currentIndex, items, visibleRange);
  };

  return {
    preloadImages,
    preloadAdjacent,
    getStats: imagePreloader.getStats,
    clearCache: imagePreloader.clearCache
  };
};
