import { auth, db } from '../components/firebaseConfig';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export class FirebaseTestService {
  
  // Verificar conectividad básica con Firebase
  static async testConnection(): Promise<{success: boolean, message: string}> {
    try {
      // Test 1: Verificar Auth
      const authTest = auth.currentUser !== undefined;
      console.log('🔐 Firebase Auth:', authTest ? 'Conectado' : 'No conectado');
      
      // Test 2: Verificar Firestore
      const testCollection = collection(db, 'test');
      const testQuery = query(testCollection, limit(1));
      
      try {
        await getDocs(testQuery);
        console.log('🔥 Firestore:', 'Conectado y con permisos');
        return {
          success: true,
          message: 'Firebase conectado correctamente'
        };
      } catch (firestoreError: any) {
        if (firestoreError.code === 'permission-denied') {
          console.log('🔥 Firestore:', 'Conectado pero sin permisos');
          return {
            success: false,
            message: 'Firebase conectado pero faltan permisos. Configura las reglas de Firestore.'
          };
        }
        throw firestoreError;
      }
      
    } catch (error: any) {
      console.error('❌ Error de conexión Firebase:', error);
      return {
        success: false,
        message: `Error de conexión: ${error.message}`
      };
    }
  }
  
  // Verificar permisos específicos para reseñas
  static async testReviewPermissions(): Promise<{success: boolean, message: string}> {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        return {
          success: false,
          message: 'Usuario no autenticado. Inicia sesión primero.'
        };
      }
      
      // Intentar leer la colección de reseñas
      const reviewsCollection = collection(db, 'reviews');
      const testQuery = query(reviewsCollection, limit(1));
      
      await getDocs(testQuery);
      
      console.log('✅ Permisos de reseñas:', 'OK');
      return {
        success: true,
        message: 'Permisos de reseñas configurados correctamente'
      };
      
    } catch (error: any) {
      console.error('❌ Error de permisos de reseñas:', error);
      
      if (error.code === 'permission-denied') {
        return {
          success: false,
          message: 'Sin permisos para acceder a reseñas. Verifica las reglas de Firestore.'
        };
      }
      
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }
  
  // Test completo del sistema
  static async runFullTest(): Promise<void> {
    console.log('🧪 INICIANDO TESTS DE FIREBASE...\n');
    
    // Test 1: Conexión general
    const connectionTest = await this.testConnection();
    console.log(`🔗 Conexión: ${connectionTest.success ? '✅' : '❌'} ${connectionTest.message}\n`);
    
    // Test 2: Permisos de reseñas
    const permissionsTest = await this.testReviewPermissions();
    console.log(`🔐 Permisos: ${permissionsTest.success ? '✅' : '❌'} ${permissionsTest.message}\n`);
    
    // Resumen
    if (connectionTest.success && permissionsTest.success) {
      console.log('🎉 TODOS LOS TESTS PASARON - Sistema listo para usar!');
    } else {
      console.log('⚠️ ALGUNOS TESTS FALLARON - Revisa la configuración');
      console.log('📖 Consulta FIRESTORE_RULES_SETUP.md para solucionar');
    }
  }
}

// Función de utilidad para usar en debugging
export const testFirebaseSetup = () => {
  FirebaseTestService.runFullTest();
};
