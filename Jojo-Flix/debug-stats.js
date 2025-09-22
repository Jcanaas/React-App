// Debug script para ver estadísticas del usuario
// Ejecutar en la consola del navegador cuando estés en la app

const checkUserStats = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ Usuario no autenticado');
    return;
  }
  
  console.log('👤 Usuario actual:', user.uid);
  
  // Ver estadísticas de gamificación
  const stats = await achievementService.getUserStats(user.uid);
  console.log('📊 Estadísticas de gamificación:', stats);
  
  // Ver logros del usuario
  const achievements = await achievementService.getUserAchievements(user.uid);
  console.log('🏆 Logros del usuario:', achievements);
  
  // Ver logros desbloqueados
  const unlocked = achievements.filter(a => a.isUnlocked);
  console.log('✅ Logros desbloqueados:', unlocked.length, 'de', achievements.length);
};

// Ejecutar
checkUserStats();