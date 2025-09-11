import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WatchProgress {
  contentId: string;
  contentTitle: string;
  contentType: 'serie' | 'pelicula' | 'anime';
  currentEpisode?: number;
  totalEpisodes?: number;
  currentTime: number; // En segundos
  totalDuration: number; // En segundos
  lastWatched: string; // ISO string
  isCompleted: boolean;
  progressPercentage: number;
  season?: number;
}

const WATCH_PROGRESS_KEY = 'watchProgress';
const CONTINUE_WATCHING_KEY = 'continueWatching';

class WatchProgressManager {
  private static instance: WatchProgressManager;

  static getInstance(): WatchProgressManager {
    if (!WatchProgressManager.instance) {
      WatchProgressManager.instance = new WatchProgressManager();
    }
    return WatchProgressManager.instance;
  }

  // Actualizar progreso de visualización
  async updateProgress(progress: Partial<WatchProgress> & { contentId: string; contentTitle: string }): Promise<void> {
    try {
      const existingProgress = await this.getProgress(progress.contentId);
      const baseProgress: WatchProgress = existingProgress || {
        contentId: progress.contentId,
        contentTitle: progress.contentTitle,
        contentType: 'pelicula',
        currentTime: 0,
        totalDuration: 1,
        lastWatched: new Date().toISOString(),
        isCompleted: false,
        progressPercentage: 0
      };

      const updatedProgress: WatchProgress = {
        ...baseProgress,
        ...progress,
        lastWatched: new Date().toISOString(),
        progressPercentage: this.calculatePercentage(progress.currentTime || baseProgress.currentTime, progress.totalDuration || baseProgress.totalDuration),
        isCompleted: this.isContentCompleted({ ...baseProgress, ...progress })
      };

      await this.saveProgress(updatedProgress);
      await this.updateContinueWatching(updatedProgress);
      
      console.log(`Progreso actualizado para: ${updatedProgress.contentTitle}`);
    } catch (error) {
      console.error('Error actualizando progreso:', error);
    }
  }

  // Obtener progreso de un contenido específico
  async getProgress(contentId: string): Promise<WatchProgress | null> {
    try {
      const allProgress = await this.getAllProgress();
      return allProgress.find(p => p.contentId === contentId) || null;
    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      return null;
    }
  }

  // Obtener todo el progreso
  async getAllProgress(): Promise<WatchProgress[]> {
    try {
      const stored = await AsyncStorage.getItem(WATCH_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error obteniendo todo el progreso:', error);
      return [];
    }
  }

  // Obtener contenido para "Continuar viendo"
  async getContinueWatching(): Promise<WatchProgress[]> {
    try {
      const allProgress = await this.getAllProgress();
      
      // Filtrar contenido que:
      // 1. No esté completado
      // 2. Tenga al menos 5% de progreso
      // 3. No tenga más de 95% de progreso (para evitar casi completados)
      // 4. Se haya visto en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return allProgress
        .filter(progress => {
          const lastWatched = new Date(progress.lastWatched);
          return !progress.isCompleted && 
                 progress.progressPercentage >= 5 && 
                 progress.progressPercentage <= 95 &&
                 lastWatched > thirtyDaysAgo;
        })
        .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
        .slice(0, 10); // Máximo 10 elementos
    } catch (error) {
      console.error('Error obteniendo continuar viendo:', error);
      return [];
    }
  }

  // Marcar como completado
  async markAsCompleted(contentId: string): Promise<void> {
    try {
      const progress = await this.getProgress(contentId);
      if (progress) {
        await this.updateProgress({
          contentId,
          contentTitle: progress.contentTitle,
          isCompleted: true,
          progressPercentage: 100,
          currentTime: progress.totalDuration
        });
      }
    } catch (error) {
      console.error('Error marcando como completado:', error);
    }
  }

  // Obtener estadísticas de visualización
  async getWatchStats(): Promise<{
    totalWatched: number;
    totalHours: number;
    completedContent: number;
    inProgressContent: number;
    favoriteGenres: string[];
  }> {
    try {
      const allProgress = await this.getAllProgress();
      
      const totalWatched = allProgress.length;
      const totalHours = allProgress.reduce((sum, p) => sum + (p.currentTime / 3600), 0);
      const completedContent = allProgress.filter(p => p.isCompleted).length;
      const inProgressContent = allProgress.filter(p => !p.isCompleted && p.progressPercentage > 0).length;

      return {
        totalWatched,
        totalHours: Math.round(totalHours * 10) / 10,
        completedContent,
        inProgressContent,
        favoriteGenres: [] // Se puede implementar más tarde
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalWatched: 0,
        totalHours: 0,
        completedContent: 0,
        inProgressContent: 0,
        favoriteGenres: []
      };
    }
  }

  // Obtener contenido abandonado (no visto en 7+ días)
  async getAbandonedContent(): Promise<WatchProgress[]> {
    try {
      const allProgress = await this.getAllProgress();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      return allProgress.filter(progress => {
        const lastWatched = new Date(progress.lastWatched);
        return !progress.isCompleted && 
               progress.progressPercentage > 10 && 
               lastWatched < sevenDaysAgo;
      }).sort((a, b) => b.progressPercentage - a.progressPercentage);
    } catch (error) {
      console.error('Error obteniendo contenido abandonado:', error);
      return [];
    }
  }

  // Métodos privados
  private async saveProgress(progress: WatchProgress): Promise<void> {
    const allProgress = await this.getAllProgress();
    const index = allProgress.findIndex(p => p.contentId === progress.contentId);
    
    if (index >= 0) {
      allProgress[index] = progress;
    } else {
      allProgress.push(progress);
    }

    await AsyncStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(allProgress));
  }

  private async updateContinueWatching(progress: WatchProgress): Promise<void> {
    if (!progress.isCompleted && progress.progressPercentage > 5 && progress.progressPercentage < 95) {
      const continueWatching = await this.getContinueWatching();
      const filtered = continueWatching.filter(p => p.contentId !== progress.contentId);
      filtered.unshift(progress);
      
      await AsyncStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(filtered.slice(0, 10)));
    }
  }

  private calculatePercentage(currentTime: number, totalDuration: number): number {
    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.round((currentTime / totalDuration) * 100));
  }

  private isContentCompleted(progress: Partial<WatchProgress>): boolean {
    // Para series: si es el último episodio y está casi completo
    if (progress.currentEpisode && progress.totalEpisodes) {
      return progress.currentEpisode >= progress.totalEpisodes && 
             (progress.progressPercentage || 0) >= 95;
    }
    
    // Para películas: si está 95% o más completo
    return (progress.progressPercentage || 0) >= 95;
  }

  // Limpiar datos antiguos (llamar periódicamente)
  async cleanupOldData(): Promise<void> {
    try {
      const allProgress = await this.getAllProgress();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const filteredProgress = allProgress.filter(progress => {
        const lastWatched = new Date(progress.lastWatched);
        return lastWatched > sixMonthsAgo || !progress.isCompleted;
      });

      await AsyncStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(filteredProgress));
      console.log('Datos antiguos limpiados');
    } catch (error) {
      console.error('Error limpiando datos antiguos:', error);
    }
  }
}

export const watchProgressManager = WatchProgressManager.getInstance();

// Hook para usar el progreso de visualización
export const useWatchProgress = () => {
  const updateProgress = (progress: Partial<WatchProgress> & { contentId: string; contentTitle: string }) => 
    watchProgressManager.updateProgress(progress);
  
  const getProgress = (contentId: string) => 
    watchProgressManager.getProgress(contentId);
  
  const getContinueWatching = () => 
    watchProgressManager.getContinueWatching();
  
  const getAbandonedContent = () => 
    watchProgressManager.getAbandonedContent();
  
  const getStats = () => 
    watchProgressManager.getWatchStats();
  
  const markCompleted = (contentId: string) => 
    watchProgressManager.markAsCompleted(contentId);

  return {
    updateProgress,
    getProgress,
    getContinueWatching,
    getAbandonedContent,
    getStats,
    markCompleted,
    cleanup: watchProgressManager.cleanupOldData
  };
};
