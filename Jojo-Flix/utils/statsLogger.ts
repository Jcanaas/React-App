// Utilidad para logging centralizado de estadísticas
export class StatsLogger {
  private static logs: Array<{
    timestamp: Date;
    type: 'music' | 'app' | 'message' | 'review';
    action: string;
    minutes?: number;
    userId: string;
  }> = [];

  static logMusicTime(minutes: number, userId: string, totalBlocks: number) {
    const logEntry = {
      timestamp: new Date(),
      type: 'music' as const,
      action: `Enviado a Firebase: +${minutes} minutos (${totalBlocks} bloques de 5min)`,
      minutes,
      userId
    };
    
    this.logs.push(logEntry);
    console.log(`🎵 [${logEntry.timestamp.toLocaleTimeString()}] ${logEntry.action}`);
    
    // Mantener solo los últimos 50 logs
    if (this.logs.length > 50) {
      this.logs.shift();
    }
  }

  static logAppTime(minutes: number, userId: string, totalBlocks: number) {
    const logEntry = {
      timestamp: new Date(),
      type: 'app' as const,
      action: `Enviado a Firebase: +${minutes} minutos (${totalBlocks} bloques de 5min)`,
      minutes,
      userId
    };
    
    this.logs.push(logEntry);
    console.log(`📱 [${logEntry.timestamp.toLocaleTimeString()}] ${logEntry.action}`);
    
    // Mantener solo los últimos 50 logs
    if (this.logs.length > 50) {
      this.logs.shift();
    }
  }

  static logProgress(type: 'music' | 'app', accumulatedSeconds: number, nextSendAt: number) {
    const accumulatedMinutes = Math.floor(accumulatedSeconds / 60);
    const icon = type === 'music' ? '🎵' : '📱';
    console.log(`${icon} Progreso ${type}: ${accumulatedMinutes}min acumulados, próximo envío en ${nextSendAt - accumulatedMinutes}min`);
  }

  static getAllLogs() {
    return [...this.logs].reverse(); // Más recientes primero
  }

  static getTotalSent(type: 'music' | 'app'): number {
    return this.logs
      .filter(log => log.type === type && log.minutes)
      .reduce((total, log) => total + (log.minutes || 0), 0);
  }

  static clearLogs() {
    this.logs.length = 0;
    console.log('🗑️ Logs de estadísticas limpiados');
  }
}

// Función global para debugging - puedes ejecutarla en la consola del navegador
(window as any).showStatsLogs = () => {
  console.group('📊 Logs de Estadísticas');
  console.table(StatsLogger.getAllLogs());
  console.log(`🎵 Total música enviada: ${StatsLogger.getTotalSent('music')} minutos`);
  console.log(`📱 Total app enviada: ${StatsLogger.getTotalSent('app')} minutos`);
  console.groupEnd();
};

export default StatsLogger;