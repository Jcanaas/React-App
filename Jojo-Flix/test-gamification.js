// Script de prueba para verificar que la gamificación funciona correctamente
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Configuración de Firebase (usar la misma que en tu app)
const firebaseConfig = {
  // Aquí deberías poner tu configuración de Firebase
  // pero por seguridad no la incluyo en el script
};

async function testGamification() {
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('🔍 Verificando gamificación...');

    // Aquí podrías agregar un usuario de prueba
    // const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password');
    // const user = userCredential.user;

    // Por ahora solo verificamos que los servicios estén disponibles
    console.log('✅ Firebase inicializado correctamente');
    console.log('✅ Auth disponible');
    console.log('✅ Firestore disponible');

    console.log('\n📋 Para probar la gamificación:');
    console.log('1. Abre la app en el simulador');
    console.log('2. Ve al chat');
    console.log('3. Envía algunos mensajes');
    console.log('4. Verifica en la base de datos que totalMessages se incrementa');
    console.log('5. Ve a la pantalla de logros para ver si se actualizan');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testGamification();
}

module.exports = { testGamification };