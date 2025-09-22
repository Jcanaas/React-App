import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { auth } from '../components/firebaseConfig';
import { achievementService } from '../services/AchievementService';
import StatsLogger from '../utils/statsLogger';

// Componente para trackear tiempo de uso de la app
export const AppTimeTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appTimeTracker = useRef<{
    startTime: number;
    accumulatedTime: number; // tiempo acumulado en segundos
    lastSentTime: number; // último tiempo enviado en minutos
    isActive: boolean;
  }>({
    startTime: Date.now(),
    accumulatedTime: 0,
    lastSentTime: 0,
    isActive: true
  });

  useEffect(() => {
    // Inicializar el tiempo de inicio
    appTimeTracker.current.startTime = Date.now();
    appTimeTracker.current.isActive = true;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const now = Date.now();
      
      if (nextAppState === 'active') {
        // App se activó
        console.log('📱 App activada');
        appTimeTracker.current.startTime = now;
        appTimeTracker.current.isActive = true;
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App se fue a background o se desactivó
        if (appTimeTracker.current.isActive) {
          const sessionTime = (now - appTimeTracker.current.startTime) / 1000; // en segundos
          
          // Solo contar sesiones válidas (mínimo 5 segundos)
          if (sessionTime >= 5) {
            appTimeTracker.current.accumulatedTime += sessionTime;
            console.log(`📱 Sesión de app completada: ${Math.round(sessionTime)} segundos`);
            
            // Enviar estadísticas inmediatamente cuando la app se cierra
            sendAppTimeStats();
          }
          
          appTimeTracker.current.isActive = false;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Enviar estadísticas periódicamente (cada 5 minutos) mientras la app está activa
    const statsInterval = setInterval(() => {
      if (appTimeTracker.current.isActive && auth.currentUser) {
        const now = Date.now();
        const sessionTime = (now - appTimeTracker.current.startTime) / 1000;
        
        // Si la sesión actual es mayor a 5 minutos, enviar estadísticas parciales
        if (sessionTime >= 300) { // 5 minutos
          appTimeTracker.current.accumulatedTime += sessionTime;
          sendAppTimeStats();
          
          // Reiniciar el contador para la siguiente porción
          appTimeTracker.current.startTime = now;
        }
      }
    }, 5 * 60 * 1000); // cada 5 minutos

    // Cleanup al desmontar o cuando la app se cierra
    return () => {
      subscription?.remove();
      clearInterval(statsInterval);
      
      // Enviar estadísticas finales si hay tiempo acumulado
      if (appTimeTracker.current.isActive) {
        const finalTime = (Date.now() - appTimeTracker.current.startTime) / 1000;
        if (finalTime >= 5) {
          appTimeTracker.current.accumulatedTime += finalTime;
          sendAppTimeStats();
        }
      }
    };
  }, []);

  const sendAppTimeStats = async () => {
    if (!auth.currentUser || appTimeTracker.current.accumulatedTime < 300) {
      return; // No enviar si es menos de 5 minutos (300 segundos)
    }

    try {
      const totalMinutesAccumulated = Math.floor(appTimeTracker.current.accumulatedTime / 60);
      const blocksOf5Minutes = Math.floor(totalMinutesAccumulated / 5);
      const blocksSent = Math.floor(appTimeTracker.current.lastSentTime / 5);
      
      // Log del progreso actual
      StatsLogger.logProgress('app', appTimeTracker.current.accumulatedTime, (blocksSent + 1) * 5);
      
      if (blocksOf5Minutes > blocksSent) {
        const minutesToSend = (blocksOf5Minutes - blocksSent) * 5;
        
        // Solo enviar bloques completos de 5 minutos
        if (minutesToSend >= 5) {
          await achievementService.incrementStat(auth.currentUser.uid, 'totalAppTime', minutesToSend);
          StatsLogger.logAppTime(minutesToSend, auth.currentUser.uid, blocksOf5Minutes);
          appTimeTracker.current.lastSentTime = blocksOf5Minutes * 5;
          
          // Resetear tiempo acumulado después de enviar
          appTimeTracker.current.accumulatedTime = totalMinutesAccumulated % 5 * 60; // Mantener los minutos restantes
        }
      }
    } catch (error) {
      console.error('⚠️ Error actualizando tiempo de app:', error);
    }
  };

  return <>{children}</>;
};

export default AppTimeTracker;