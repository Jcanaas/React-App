import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export const useScreenOrientation = () => {
  // Bloquear en vertical por defecto
  useEffect(() => {
    const lockPortrait = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } catch (error) {
        console.warn('Error al bloquear orientación:', error);
      }
    };
    
    lockPortrait();
  }, []);

  // Funciones para controlar la orientación
  const lockPortrait = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } catch (error) {
      console.warn('Error al bloquear en vertical:', error);
    }
  };

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlockAsync();
    } catch (error) {
      console.warn('Error al desbloquear orientación:', error);
    }
  };

  const lockLandscape = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch (error) {
      console.warn('Error al bloquear en horizontal:', error);
    }
  };

  return {
    lockPortrait,
    unlockOrientation,
    lockLandscape
  };
};
