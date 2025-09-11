import { Image } from 'expo-image';

interface ImageCache {
  [key: string]: any;
}

class ImageManager {
  private static cache: ImageCache = {};
  private static preloadQueue = new Set<string>();
  private static isInitialized = false;

  // Inicializar caché de imágenes
  static initialize() {
    if (this.isInitialized) return;
    
    // Configurar caché de Expo Image
    Image.clearMemoryCache();
    Image.clearDiskCache();
    
    this.isInitialized = true;
    console.log('ImageManager initialized');
  }

  // Obtener imagen optimizada del caché
  static getImage(imagePath: any): any {
    const key = this.getImageKey(imagePath);
    
    if (!this.cache[key]) {
      this.cache[key] = imagePath;
    }
    
    return this.cache[key];
  }

  // Pre-cargar imágenes críticas
  static async preloadCriticalImages(imagePaths: any[]) {
    const startTime = performance.now();
    
    try {
      // Pre-cargar solo las primeras 5 imágenes para mejorar tiempo inicial
      const criticalPaths = imagePaths.slice(0, 5);
      
      await Promise.all(
        criticalPaths.map(async (path) => {
          const key = this.getImageKey(path);
          if (!this.preloadQueue.has(key)) {
            this.preloadQueue.add(key);
            try {
              // Usar prefetch de Expo Image para cargar en background
              if (typeof path === 'string') {
                await Image.prefetch(path);
              }
            } catch (error) {
              console.warn(`Failed to preload image: ${key}`, error);
            }
          }
        })
      );
      
      const endTime = performance.now();
      console.log(`Preloaded ${criticalPaths.length} critical images in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('Error preloading critical images:', error);
    }
  }

  // Limpiar caché cuando sea necesario
  static clearCache() {
    this.cache = {};
    this.preloadQueue.clear();
    Image.clearMemoryCache();
    console.log('ImageManager cache cleared');
  }

  // Obtener estadísticas del caché
  static getCacheStats() {
    return {
      cachedImages: Object.keys(this.cache).length,
      preloadedImages: this.preloadQueue.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private static getImageKey(imagePath: any): string {
    if (typeof imagePath === 'string') {
      return imagePath;
    }
    if (typeof imagePath === 'number') {
      return `require_${imagePath}`;
    }
    if (imagePath && imagePath.uri) {
      return imagePath.uri;
    }
    return `unknown_${Math.random()}`;
  }

  private static estimateMemoryUsage(): string {
    const cacheSize = Object.keys(this.cache).length;
    const estimatedMB = (cacheSize * 0.5).toFixed(1); // Estimación aproximada
    return `~${estimatedMB} MB`;
  }
}

export default ImageManager;
