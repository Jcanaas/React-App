// Script de debugging para comparar estadísticas reales vs gamificación
// Ejecutar en la consola del navegador cuando estés logueado en la app

const debugStats = async () => {
  console.group('🔍 DEBUGGING DE ESTADÍSTICAS');
  
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Usuario no autenticado');
    return;
  }
  
  console.log('👤 Usuario:', user.uid);
  console.log('📧 Email:', user.email);
  
  try {
    // 1. ESTADÍSTICAS DE GAMIFICACIÓN
    console.group('🎮 Estadísticas de Gamificación (userStats)');
    const gamificationStats = await achievementService.getUserStats(user.uid);
    console.log('📊 Datos completos:', gamificationStats);
    
    if (gamificationStats) {
      console.log(`📝 Total Reseñas (gamificación): ${gamificationStats.totalReviews}`);
      console.log(`💬 Total Mensajes (gamificación): ${gamificationStats.totalMessages}`);
      console.log(`🎵 Tiempo Música (gamificación): ${gamificationStats.totalMusicTime} min`);
      console.log(`📱 Tiempo App (gamificación): ${gamificationStats.totalAppTime} min`);
      console.log(`💰 Puntos Totales: ${gamificationStats.totalPoints}`);
    } else {
      console.warn('⚠️ No hay estadísticas de gamificación - creando...');
      await achievementService.initializeUserStats(user.uid);
    }
    console.groupEnd();
    
    // 2. RESEÑAS REALES EN FIREBASE
    console.group('📝 Reseñas Reales en Firebase');
    const realReviews = await reviewService.getUserReviews(user.uid, 100);
    console.log(`📄 Número real de reseñas: ${realReviews.length}`);
    console.log('📋 Lista de reseñas:', realReviews.map(r => ({
      id: r.id,
      movieTitle: r.movieTitle,
      rating: r.rating,
      timestamp: r.timestamp
    })));
    console.groupEnd();
    
    // 3. MENSAJES REALES EN FIREBASE (si existe el servicio)
    console.group('💬 Mensajes en Firebase');
    try {
      // Verificar directamente en la colección de mensajes
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(messagesRef, where('userId', '==', user.uid));
      const messagesSnapshot = await getDocs(messagesQuery);
      console.log(`💬 Número real de mensajes: ${messagesSnapshot.size}`);
      
      const messages = [];
      messagesSnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      console.log('📋 Primeros 5 mensajes:', messages.slice(0, 5));
    } catch (error) {
      console.warn('⚠️ No se pudo acceder a mensajes:', error.message);
    }
    console.groupEnd();
    
    // 4. PERFIL DE USUARIO (estadísticas alternativas)
    console.group('👤 Perfil de Usuario (userProfiles)');
    try {
      const userProfile = await userProfileService.getUserProfile(user.uid);
      console.log('📊 Perfil completo:', userProfile);
      if (userProfile) {
        console.log(`📝 Total Reseñas (perfil): ${userProfile.totalReviews || 0}`);
        console.log(`⭐ Rating Promedio (perfil): ${userProfile.averageRating || 'N/A'}`);
      }
    } catch (error) {
      console.warn('⚠️ Error accediendo al perfil:', error.message);
    }
    console.groupEnd();
    
    // 5. COMPARACIÓN Y RECOMENDACIONES
    console.group('📊 ANÁLISIS Y RECOMENDACIONES');
    
    const realReviewCount = realReviews.length;
    const gamificationReviewCount = gamificationStats?.totalReviews || 0;
    
    console.log('📝 COMPARACIÓN DE RESEÑAS:');
    console.log(`   Real: ${realReviewCount} | Gamificación: ${gamificationReviewCount}`);
    
    if (realReviewCount !== gamificationReviewCount) {
      console.warn('⚠️ DESINCRONIZACIÓN DETECTADA EN RESEÑAS');
      console.log(`🔧 Diferencia: ${realReviewCount - gamificationReviewCount} reseñas`);
      console.log('💡 Solución: Ejecutar sincronización de datos');
    } else {
      console.log('✅ Reseñas sincronizadas correctamente');
    }
    
    console.groupEnd();
    
  } catch (error) {
    console.error('❌ Error en debugging:', error);
  }
  
  console.groupEnd();
};

// Función para sincronizar estadísticas (versión mejorada)
const syncStats = async () => {
  console.group('🔄 SINCRONIZANDO ESTADÍSTICAS CON MIGRACIÓN');
  
  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Usuario no autenticado');
    return;
  }
  
  try {
    // Importar el servicio de migración
    const { MigrationService } = await import('./services/MigrationService');
    
    console.log(`🔄 Ejecutando migración completa para usuario: ${user.uid}`);
    
    const migrationResult = await MigrationService.migrateUserStats(user.uid);
    
    if (migrationResult.success) {
      console.log('✅ Migración exitosa!');
      console.log('📊 Detalles:', migrationResult.details);
      
      // Mostrar resumen
      const details = migrationResult.details;
      if (details.reviews.migrated > 0) {
        console.log(`📝 Reseñas migradas: ${details.reviews.migrated}`);
      }
      if (details.messages.migrated > 0) {
        console.log(`💬 Mensajes migrados: ${details.messages.migrated}`);
      }
      if (details.statsCreated) {
        console.log('📊 Estadísticas base creadas');
      }
      
      console.log('🎉 Sincronización completada con migración');
      
      // Ejecutar debugging para ver los resultados
      setTimeout(() => {
        console.log('🔍 Verificando resultados...');
        debugStats();
      }, 1000);
      
    } else {
      console.error('❌ Error en migración:', migrationResult.message);
    }
    
  } catch (error) {
    console.error('❌ Error importando servicio de migración:', error);
    console.log('🔄 Intentando método de sincronización básico...');
    
    // Método básico de respaldo
    const realReviews = await reviewService.getUserReviews(user.uid, 1000);
    const realReviewCount = realReviews.length;
    
    console.log(`📝 Reseñas reales encontradas: ${realReviewCount}`);
    
    let currentStats = await achievementService.getUserStats(user.uid);
    if (!currentStats) {
      currentStats = await achievementService.initializeUserStats(user.uid);
    }
    
    const currentGameReviews = currentStats.totalReviews;
    const difference = realReviewCount - currentGameReviews;
    
    if (difference > 0) {
      console.log(`🔄 Sincronizando ${difference} reseñas...`);
      await achievementService.incrementStat(user.uid, 'totalReviews', difference);
      console.log('✅ Reseñas sincronizadas');
    } else {
      console.log('✅ Las reseñas ya están sincronizadas');
    }
    
    await achievementService.checkAndUnlockAchievements(user.uid);
  }
  
  console.groupEnd();
};

// Hacer funciones globales para poder usarlas en la consola
window.debugStats = debugStats;
window.syncStats = syncStats;

console.log('🛠️ Herramientas de debugging cargadas!');
console.log('📝 Ejecuta: debugStats() - para ver el análisis completo');
console.log('🔄 Ejecuta: syncStats() - para sincronizar las estadísticas');

export { debugStats, syncStats };