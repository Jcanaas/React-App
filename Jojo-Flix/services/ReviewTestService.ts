/**
 * 🧪 SCRIPT DE PRUEBA RÁPIDA PARA RESEÑAS
 * 
 * Este archivo ayuda a debuggear problemas con las reseñas
 */

import { auth } from '../components/firebaseConfig';
import { reviewService } from '../services/ReviewService';

export const testReviewSystem = async () => {
  console.log('🧪 INICIANDO PRUEBA DEL SISTEMA DE RESEÑAS...\n');

  // Test 1: Verificar usuario autenticado
  const user = auth.currentUser;
  console.log('👤 Usuario actual:', user ? `${user.displayName || user.email} (${user.uid})` : 'No autenticado');

  if (!user) {
    console.log('❌ Error: Usuario no autenticado. Inicia sesión primero.');
    return;
  }

  // Test 2: Datos de prueba
  const testMovieId = 'test-movie-123';
  const testData = {
    userId: user.uid,
    movieId: testMovieId,
    movieTitle: 'Película de Prueba',
    userName: user.displayName || user.email?.split('@')[0] || 'Usuario Test',
    rating: 5,
    reviewText: 'Esta es una reseña de prueba para verificar que el sistema funciona correctamente.',
    spoilerWarning: false
  };

  // Agregar campos opcionales solo si existen
  if (user.photoURL) {
    (testData as any).userAvatar = user.photoURL;
  }

  console.log('📝 Datos de prueba preparados:', testData);

  try {
    // Test 3: Crear reseña
    console.log('\n🔄 Intentando crear reseña...');
    const reviewId = await reviewService.createReview(testData);
    console.log('✅ Reseña creada exitosamente con ID:', reviewId);

    // Test 4: Leer reseñas
    console.log('\n🔄 Intentando leer reseñas...');
    const reviews = await reviewService.getMovieReviews(testMovieId);
    console.log('✅ Reseñas obtenidas:', reviews.length);

    // Test 5: Limpiar (eliminar reseña de prueba)
    if (reviews.length > 0) {
      console.log('\n🔄 Limpiando reseña de prueba...');
      await reviewService.deleteReview(reviewId);
      console.log('✅ Reseña de prueba eliminada');
    }

    console.log('\n🎉 TODOS LOS TESTS PASARON - Sistema funcionando correctamente!');

  } catch (error: any) {
    console.error('❌ ERROR EN PRUEBA:', error);
    
    if (error.message?.includes('undefined')) {
      console.log('\n💡 SOLUCIÓN: Problema con valores undefined. Ya corregido en el código.');
    } else if (error.message?.includes('permission')) {
      console.log('\n💡 SOLUCIÓN: Configurar reglas de Firestore según FIRESTORE_RULES_SETUP.md');
    } else {
      console.log('\n💡 Error desconocido. Revisa la conexión a Firebase.');
    }
  }
};

// Función simple para usar desde cualquier componente
export const quickTestReviews = () => {
  testReviewSystem();
};
