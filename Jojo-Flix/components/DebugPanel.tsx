import React, { useEffect } from 'react';import React, { useEffect } from 'react';// Componente de debugging que se ejecuta automáticamente// Componente de debugging que se ejecuta automáticamente



const DebugPanel: React.FC = () => {import { auth, db } from '../components/firebaseConfig';

  

  useEffect(() => {import { achievementService } from '../services/AchievementService';import React, { useEffect } from 'react';import React, { useEffect } from 'react';

    console.log('🛠️ DebugPanel cargado correctamente');

    import { reviewService } from '../services/ReviewService';

    // Hacer debug tools disponibles globalmente después de 2 segundos

    const timer = setTimeout(() => {import { collection, query, where, getDocs } from 'firebase/firestore';import { auth, db } from '../components/firebaseConfig';import { auth, db } from '../components/firebaseConfig';

      console.log('📊 Herramientas de debug disponibles');

    }, 2000);

    

    return () => clearTimeout(timer);const DebugPanel: React.FC = () => {import { achievementService } from '../services/AchievementService';import { achievementService } from '../services/AchievementService';

  }, []);

    

  return null;

};  useEffect(() => {import { reviewService } from '../services/ReviewService';import { reviewService } from '../services/ReviewService';



export default DebugPanel;    const setupDebugTools = () => {

      import { collection, query, where, getDocs } from 'firebase/firestore';import { collection, query, where, getDocs } from 'firebase/firestore';      console.log('🛠️ Herramientas de debug cargadas!');

      // Función para conteo preciso y corrección

      (window as any).accurateCount = async () => {      console.log('🔍 Ejecuta: quickDebug() - para diagnóstico rápido');

        console.group('📊 CONTEO PRECISO Y CORRECCIÓN');

        const DebugPanel: React.FC = () => {      console.log('🚀 Ejecuta: initStats() - para inicializar estadísticas');

        const user = auth.currentUser;

        if (!user) {        console.log('🔄 Ejecuta: basicSync() - para sincronización básica');

          console.error('❌ Usuario no autenticado');

          console.groupEnd();  useEffect(() => {      console.log('📊 Ejecuta: accurateCount() - para conteo preciso y corrección');

          return;

        }    // Hacer las funciones disponibles globalmente      console.log('🧪 Ejecuta: forceTestData() - para crear datos de prueba');rt { collection, query, where, getDocs } from 'firebase/firestore';

        

        try {    const setupDebugTools = () => {

          console.log('👤 Analizando usuario:', user.uid);

                const DebugPanel: React.FC = () => {

          // === 1. CONTEO REAL DE RESEÑAS ===

          console.log('📝 Contando reseñas reales...');      // Función para conteo preciso y corrección  

          const realReviews = await reviewService.getUserReviews(user.uid, 1000);

          const realReviewCount = realReviews.length;      (window as any).accurateCount = async () => {  useEffect(() => {

          console.log(`📝 Reseñas reales encontradas: ${realReviewCount}`);

                  console.group('📊 CONTEO PRECISO Y CORRECCIÓN');    // Hacer las funciones disponibles globalmente

          if (realReviews.length > 0) {

            console.log('📋 Lista de reseñas:');            const setupDebugTools = () => {

            realReviews.slice(0, 5).forEach((review, index) => {

              console.log(`   ${index + 1}. ${review.movieTitle} - ${review.rating}⭐ (${review.timestamp?.toLocaleDateString() || 'Sin fecha'})`);        const user = auth.currentUser;      // Función de debugging simple

            });

            if (realReviews.length > 5) {        if (!user) {      (window as any).quickDebug = async () => {

              console.log(`   ... y ${realReviews.length - 5} más`);

            }          console.error('❌ Usuario no autenticado');        console.group('🔍 QUICK DEBUG');

          }

                    console.groupEnd();        

          // === 2. CONTEO REAL DE MENSAJES ===

          console.log('💬 Contando mensajes reales...');          return;        const user = auth.currentUser;

          let realMessageCount = 0;

                  }        if (!user) {

          try {

            // Buscar en todas las posibles colecciones de mensajes                  console.error('❌ Usuario no autenticado');

            const collections = ['messages', 'chatMessages', 'chat_messages'];

                    try {          console.groupEnd();

            for (const collectionName of collections) {

              try {          console.log('👤 Analizando usuario:', user.uid);          return;

                const messagesRef = collection(db, collectionName);

                const messagesQuery = query(messagesRef, where('userId', '==', user.uid));                  }

                const messagesSnapshot = await getDocs(messagesQuery);

                          // === 1. CONTEO REAL DE RESEÑAS ===        

                if (messagesSnapshot.size > 0) {

                  console.log(`💬 Encontrados ${messagesSnapshot.size} mensajes en colección: ${collectionName}`);          console.log('📝 Contando reseñas reales...');        console.log('👤 Usuario logueado:', user.uid);

                  realMessageCount += messagesSnapshot.size;

                            const realReviews = await reviewService.getUserReviews(user.uid, 1000);        console.log('📧 Email:', user.email);

                  // Mostrar algunos mensajes de ejemplo

                  let count = 0;          const realReviewCount = realReviews.length;        

                  messagesSnapshot.forEach((doc: any) => {

                    if (count < 3) {          console.log(`📝 Reseñas reales encontradas: ${realReviewCount}`);        try {

                      const data = doc.data();

                      console.log(`   📨 "${data.text?.substring(0, 50) || 'N/A'}..." (${data.timestamp?.toDate?.()?.toLocaleDateString() || 'Sin fecha'})`);                    // 1. Verificar estadísticas de gamificación

                      count++;

                    }          if (realReviews.length > 0) {          console.log('📊 Verificando estadísticas de gamificación...');

                  });

                }            console.log('📋 Lista de reseñas:');          const stats = await achievementService.getUserStats(user.uid);

              } catch (collectionError) {

                console.log(`⚠️ Colección ${collectionName} no accesible`);            realReviews.slice(0, 5).forEach((review, index) => {          console.log('Stats:', stats);

              }

            }              console.log(`   ${index + 1}. ${review.movieTitle} - ${review.rating}⭐ (${review.timestamp.toLocaleDateString()})`);          

            

            console.log(`💬 Total mensajes reales: ${realMessageCount}`);            });          // 2. Verificar logros

            

          } catch (error) {            if (realReviews.length > 5) {          console.log('🏆 Verificando logros...');

            console.warn('⚠️ Error contando mensajes:', error);

            console.log('💬 Mensajes: No se pudo acceder (permisos o estructura)');              console.log(`   ... y ${realReviews.length - 5} más`);          const achievements = await achievementService.getUserAchievements(user.uid);

          }

                      }          console.log('Logros encontrados:', achievements.length);

          // === 3. ESTADÍSTICAS ACTUALES DE GAMIFICACIÓN ===

          console.log('🎮 Obteniendo estadísticas de gamificación...');          }          console.log('Logros:', achievements);

          const currentStats = await achievementService.getUserStats(user.uid);

                              

          console.log('📊 Estadísticas actuales:');

          console.log(`   📝 Reseñas (gamificación): ${currentStats?.totalReviews || 0}`);          // === 2. CONTEO REAL DE MENSAJES ===          // 3. Verificar reseñas reales

          console.log(`   💬 Mensajes (gamificación): ${currentStats?.totalMessages || 0}`);

          console.log(`   🎵 Música: ${currentStats?.totalMusicTime || 0} min`);          console.log('💬 Contando mensajes reales...');          console.log('📝 Verificando reseñas...');

          console.log(`   📱 App: ${currentStats?.totalAppTime || 0} min`);

          console.log(`   💰 Puntos: ${currentStats?.totalPoints || 0}`);          let realMessageCount = 0;          const reviews = await reviewService.getUserReviews(user.uid, 100);

          

          // === 4. COMPARACIÓN Y CORRECCIÓN ===                    console.log('Reseñas encontradas:', reviews.length);

          console.log('🔄 Comparación y corrección necesaria:');

                    try {          

          const reviewDiff = realReviewCount - (currentStats?.totalReviews || 0);

          const messageDiff = realMessageCount - (currentStats?.totalMessages || 0);            // Buscar en todas las posibles colecciones de mensajes          // 4. Verificar mensajes

          

          console.log(`📝 Diferencia reseñas: ${reviewDiff} ${reviewDiff > 0 ? '(faltan)' : reviewDiff < 0 ? '(sobran)' : '(correcto)'}`);            const collections = ['messages', 'chatMessages', 'chat_messages'];          console.log('💬 Verificando mensajes...');

          console.log(`💬 Diferencia mensajes: ${messageDiff} ${messageDiff > 0 ? '(faltan)' : messageDiff < 0 ? '(sobran)' : '(correcto)'}`);

                                const messagesRef = collection(db, 'messages');

          // === 5. APLICAR CORRECCIONES ===

          if (reviewDiff > 0) {            for (const collectionName of collections) {          const messagesQuery = query(messagesRef, where('userId', '==', user.uid));

            console.log(`🔧 Corrigiendo reseñas: agregando ${reviewDiff}...`);

            await achievementService.incrementStat(user.uid, 'totalReviews', reviewDiff);              try {          const messagesSnapshot = await getDocs(messagesQuery);

            console.log('✅ Reseñas corregidas');

          }                const messagesRef = collection(db, collectionName);          console.log('Mensajes encontrados:', messagesSnapshot.size);

          

          if (messageDiff > 0) {                const messagesQuery = query(messagesRef, where('userId', '==', user.uid));          

            console.log(`🔧 Corrigiendo mensajes: agregando ${messageDiff}...`);

            await achievementService.incrementStat(user.uid, 'totalMessages', messageDiff);                const messagesSnapshot = await getDocs(messagesQuery);          console.log('✅ Debug completado');

            console.log('✅ Mensajes corregidos');

          }                          

          

          if (reviewDiff > 0 || messageDiff > 0) {                if (messagesSnapshot.size > 0) {        } catch (error) {

            console.log('🏆 Verificando logros después de la corrección...');

            const newAchievements = await achievementService.checkAndUnlockAchievements(user.uid);                  console.log(`💬 Encontrados ${messagesSnapshot.size} mensajes en colección: ${collectionName}`);          console.error('❌ Error en debug:', error);

            console.log(`🎉 Nuevos logros desbloqueados: ${newAchievements.length}`);

          }                  realMessageCount += messagesSnapshot.size;        }

          

          console.log('✅ Conteo preciso y corrección completados');                          

          

        } catch (error) {                  // Mostrar algunos mensajes de ejemplo        console.groupEnd();

          console.error('❌ Error en conteo preciso:', error);

        }                  let count = 0;      };

        

        console.groupEnd();                  messagesSnapshot.forEach((doc: any) => {      

      };

                          if (count < 3) {      // Función para inicializar estadísticas

      // Función de debug rápido

      (window as any).quickDebug = async () => {                      const data = doc.data();      (window as any).initStats = async () => {

        console.group('🐛 DEBUG RÁPIDO');

                              console.log(`   📨 "${data.text?.substring(0, 50) || 'N/A'}..." (${data.timestamp?.toDate?.()?.toLocaleDateString() || 'Sin fecha'})`);        console.group('🚀 INICIALIZANDO ESTADÍSTICAS');

        const user = auth.currentUser;

        if (!user) {                      count++;        

          console.error('❌ Usuario no autenticado');

          console.groupEnd();                    }        const user = auth.currentUser;

          return;

        }                  });        if (!user) {

        

        try {                }          console.error('❌ Usuario no autenticado');

          console.log('👤 Usuario:', user.uid);

                        } catch (collectionError) {          console.groupEnd();

          // Estadísticas básicas

          const stats = await achievementService.getUserStats(user.uid);                console.log(`⚠️ Colección ${collectionName} no accesible`);          return;

          console.log('📊 Estadísticas:');

          console.log('   📝 Reseñas:', stats?.totalReviews || 0);              }        }

          console.log('   💬 Mensajes:', stats?.totalMessages || 0);

          console.log('   🎵 Música:', stats?.totalMusicTime || 0, 'min');            }        

          console.log('   📱 App:', stats?.totalAppTime || 0, 'min');

          console.log('   💰 Puntos:', stats?.totalPoints || 0);                    try {

          

          // Logros desbloqueados            console.log(`💬 Total mensajes reales: ${realMessageCount}`);          console.log('📊 Inicializando estadísticas para:', user.uid);

          const achievements = await achievementService.getUserAchievements(user.uid);

          console.log('🏆 Logros desbloqueados:', achievements.length);                      const stats = await achievementService.initializeUserStats(user.uid);

          

        } catch (error) {          } catch (error) {          console.log('✅ Estadísticas inicializadas:', stats);

          console.error('❌ Error:', error);

        }            console.warn('⚠️ Error contando mensajes:', error);          

        

        console.groupEnd();            console.log('💬 Mensajes: No se pudo acceder (permisos o estructura)');          console.log('🏆 Verificando logros...');

      };

                }          await achievementService.checkAndUnlockAchievements(user.uid);

      console.log('🛠️ Herramientas de debug cargadas!');

      console.log('📊 Ejecuta: accurateCount() - para conteo preciso y corrección');                    

      console.log('🐛 Ejecuta: quickDebug() - para debug rápido');

    };          // === 3. ESTADÍSTICAS ACTUALES DE GAMIFICACIÓN ===          console.log('🎉 Inicialización completada');

    

    // Configurar herramientas después de un pequeño delay          console.log('🎮 Obteniendo estadísticas de gamificación...');          

    const timer = setTimeout(setupDebugTools, 2000);

              const currentStats = await achievementService.getUserStats(user.uid);        } catch (error) {

    return () => clearTimeout(timer);

  }, []);                    console.error('❌ Error en inicialización:', error);

  

  return null; // Componente invisible          console.log('📊 Estadísticas actuales:');        }

};

          console.log(`   📝 Reseñas (gamificación): ${currentStats?.totalReviews || 0}`);        

export default DebugPanel;
          console.log(`   💬 Mensajes (gamificación): ${currentStats?.totalMessages || 0}`);        console.groupEnd();

          console.log(`   🎵 Música: ${currentStats?.totalMusicTime || 0} min`);      };

          console.log(`   📱 App: ${currentStats?.totalAppTime || 0} min`);      

          console.log(`   💰 Puntos: ${currentStats?.totalPoints || 0}`);      // Función para sincronizar básica

                (window as any).basicSync = async () => {

          // === 4. COMPARACIÓN Y CORRECCIÓN ===        console.group('🔄 SINCRONIZACIÓN BÁSICA');

          console.log('🔄 Comparación y corrección necesaria:');        

                  const user = auth.currentUser;

          const reviewDiff = realReviewCount - (currentStats?.totalReviews || 0);        if (!user) {

          const messageDiff = realMessageCount - (currentStats?.totalMessages || 0);          console.error('❌ Usuario no autenticado');

                    console.groupEnd();

          console.log(`📝 Diferencia reseñas: ${reviewDiff} ${reviewDiff > 0 ? '(faltan)' : reviewDiff < 0 ? '(sobran)' : '(correcto)'}`);          return;

          console.log(`💬 Diferencia mensajes: ${messageDiff} ${messageDiff > 0 ? '(faltan)' : messageDiff < 0 ? '(sobran)' : '(correcto)'}`);        }

                  

          // === 5. APLICAR CORRECCIONES ===        try {

          if (reviewDiff > 0) {          // Inicializar si no existe

            console.log(`🔧 Corrigiendo reseñas: agregando ${reviewDiff}...`);          let stats = await achievementService.getUserStats(user.uid);

            await achievementService.incrementStat(user.uid, 'totalReviews', reviewDiff);          if (!stats) {

            console.log('✅ Reseñas corregidas');            console.log('📊 Creando estadísticas...');

          }            stats = await achievementService.initializeUserStats(user.uid);

                    }

          if (messageDiff > 0) {          

            console.log(`🔧 Corrigiendo mensajes: agregando ${messageDiff}...`);          // Contar reseñas

            await achievementService.incrementStat(user.uid, 'totalMessages', messageDiff);          const reviews = await reviewService.getUserReviews(user.uid, 1000);

            console.log('✅ Mensajes corregidos');          const reviewCount = reviews.length;

          }          console.log(`📝 Reseñas encontradas: ${reviewCount}`);

                    

          if (reviewDiff > 0 || messageDiff > 0) {          if (reviewCount > stats.totalReviews) {

            console.log('🏆 Verificando logros después de la corrección...');            const diff = reviewCount - stats.totalReviews;

            const newAchievements = await achievementService.checkAndUnlockAchievements(user.uid);            console.log(`🔄 Sincronizando ${diff} reseñas...`);

            console.log(`🎉 Nuevos logros desbloqueados: ${newAchievements.length}`);            await achievementService.incrementStat(user.uid, 'totalReviews', diff);

          }          }

                    

          console.log('✅ Conteo preciso y corrección completados');          // Verificar logros

                    console.log('🏆 Verificando logros...');

        } catch (error) {          const unlockedAchievements = await achievementService.checkAndUnlockAchievements(user.uid);

          console.error('❌ Error en conteo preciso:', error);          console.log('🎉 Logros desbloqueados:', unlockedAchievements.length);

        }          

                  console.log('✅ Sincronización completada');

        console.groupEnd();          

      };        } catch (error) {

                console.error('❌ Error en sincronización:', error);

      console.log('🛠️ Herramientas de debug cargadas!');        }

      console.log('📊 Ejecuta: accurateCount() - para conteo preciso y corrección');        

    };        console.groupEnd();

          };

    // Configurar herramientas después de un pequeño delay      

    const timer = setTimeout(setupDebugTools, 2000);      // Función para conteo preciso y corrección

          (window as any).accurateCount = async () => {

    return () => clearTimeout(timer);        console.group('📊 CONTEO PRECISO Y CORRECCIÓN');

  }, []);        

          const user = auth.currentUser;

  return null; // Componente invisible        if (!user) {

};          console.error('❌ Usuario no autenticado');

          console.groupEnd();

export default DebugPanel;          return;
        }
        
        try {
          console.log('👤 Analizando usuario:', user.uid);
          
          // === 1. CONTEO REAL DE RESEÑAS ===
          console.log('📝 Contando reseñas reales...');
          const realReviews = await reviewService.getUserReviews(user.uid, 1000);
          const realReviewCount = realReviews.length;
          console.log(`📝 Reseñas reales encontradas: ${realReviewCount}`);
          
          if (realReviews.length > 0) {
            console.log('📋 Lista de reseñas:');
            realReviews.slice(0, 5).forEach((review, index) => {
              console.log(`   ${index + 1}. ${review.movieTitle} - ${review.rating}⭐ (${review.timestamp.toLocaleDateString()})`);
            });
            if (realReviews.length > 5) {
              console.log(`   ... y ${realReviews.length - 5} más`);
            }
          }
          
          // === 2. CONTEO REAL DE MENSAJES ===
          console.log('💬 Contando mensajes reales...');
          let realMessageCount = 0;
          
          try {
            // Buscar en todas las posibles colecciones de mensajes
            const collections = ['messages', 'chatMessages', 'chat_messages'];
            
            for (const collectionName of collections) {
              try {
                const messagesRef = collection(db, collectionName);
                const messagesQuery = query(messagesRef, where('userId', '==', user.uid));
                const messagesSnapshot = await getDocs(messagesQuery);
                
                if (messagesSnapshot.size > 0) {
                  console.log(`💬 Encontrados ${messagesSnapshot.size} mensajes en colección: ${collectionName}`);
                  realMessageCount += messagesSnapshot.size;
                  
                  // Mostrar algunos mensajes de ejemplo
                  let count = 0;
                  messagesSnapshot.forEach((doc) => {
                    if (count < 3) {
                      const data = doc.data();
                      console.log(`   📨 "${data.text?.substring(0, 50) || 'N/A'}..." (${data.timestamp?.toDate?.()?.toLocaleDateString() || 'Sin fecha'})`);
                      count++;
                    }
                  });
                }
              } catch (collectionError) {
                console.log(`⚠️ Colección ${collectionName} no accesible`);
              }
            }
            
            console.log(`💬 Total mensajes reales: ${realMessageCount}`);
            
          } catch (error) {
            console.warn('⚠️ Error contando mensajes:', error);
            console.log('💬 Mensajes: No se pudo acceder (permisos o estructura)');
          }
          
          // === 3. ESTADÍSTICAS ACTUALES DE GAMIFICACIÓN ===
          console.log('🎮 Obteniendo estadísticas de gamificación...');
          const currentStats = await achievementService.getUserStats(user.uid);
          
          console.log('📊 Estadísticas actuales:');
          console.log(`   📝 Reseñas (gamificación): ${currentStats?.totalReviews || 0}`);
          console.log(`   💬 Mensajes (gamificación): ${currentStats?.totalMessages || 0}`);
          console.log(`   🎵 Música: ${currentStats?.totalMusicTime || 0} min`);
          console.log(`   📱 App: ${currentStats?.totalAppTime || 0} min`);
          console.log(`   💰 Puntos: ${currentStats?.totalPoints || 0}`);
          
          // === 4. COMPARACIÓN Y CORRECCIÓN ===
          console.log('🔄 Comparación y corrección necesaria:');
          
          const reviewDiff = realReviewCount - (currentStats?.totalReviews || 0);
          const messageDiff = realMessageCount - (currentStats?.totalMessages || 0);
          
          console.log(`📝 Diferencia reseñas: ${reviewDiff} ${reviewDiff > 0 ? '(faltan)' : reviewDiff < 0 ? '(sobran)' : '(correcto)'}`);
          console.log(`💬 Diferencia mensajes: ${messageDiff} ${messageDiff > 0 ? '(faltan)' : messageDiff < 0 ? '(sobran)' : '(correcto)'}`);
          
          // === 5. APLICAR CORRECCIONES ===
          if (reviewDiff > 0) {
            console.log(`🔧 Corrigiendo reseñas: agregando ${reviewDiff}...`);
            await achievementService.incrementStat(user.uid, 'totalReviews', reviewDiff);
            console.log('✅ Reseñas corregidas');
          }
          
          if (messageDiff > 0) {
            console.log(`🔧 Corrigiendo mensajes: agregando ${messageDiff}...`);
            await achievementService.incrementStat(user.uid, 'totalMessages', messageDiff);
            console.log('✅ Mensajes corregidos');
          }
          
          if (reviewDiff > 0 || messageDiff > 0) {
            console.log('🏆 Verificando logros después de la corrección...');
            const newAchievements = await achievementService.checkAndUnlockAchievements(user.uid);
            console.log(`🎉 Nuevos logros desbloqueados: ${newAchievements.length}`);
          }
          
          console.log('✅ Conteo preciso y corrección completados');
          
        } catch (error) {
          console.error('❌ Error en conteo preciso:', error);
        }
        
        console.groupEnd();
      };
      
      // Función para forzar datos de prueba
      (window as any).forceTestData = async () => {
        console.group('🧪 FORZANDO DATOS DE PRUEBA');
        
        const user = auth.currentUser;
        if (!user) {
          console.error('❌ Usuario no autenticado');
          console.groupEnd();
          return;
        }
        
        try {
          console.log('� Creando estadísticas de prueba...');
          
          // Forzar estadísticas de prueba
          await achievementService.incrementStat(user.uid, 'totalReviews', 3);
          await achievementService.incrementStat(user.uid, 'totalMessages', 15);
          await achievementService.incrementStat(user.uid, 'totalMusicTime', 25);
          await achievementService.incrementStat(user.uid, 'totalAppTime', 60);
          
          console.log('✅ Datos de prueba creados:');
          console.log('📝 3 reseñas');
          console.log('💬 15 mensajes');
          console.log('🎵 25 minutos de música');
          console.log('📱 60 minutos en app');
          
          // Verificar logros
          console.log('🏆 Verificando logros...');
          const unlockedAchievements = await achievementService.checkAndUnlockAchievements(user.uid);
          console.log('🎉 Logros desbloqueados:', unlockedAchievements.length);
          
          console.log('✅ Datos de prueba completados');
          
        } catch (error) {
          console.error('❌ Error creando datos de prueba:', error);
        }
        
        console.groupEnd();
      };
      
      console.log('�🛠️ Herramientas de debug cargadas!');
      console.log('🔍 Ejecuta: quickDebug() - para diagnóstico rápido');
      console.log('🚀 Ejecuta: initStats() - para inicializar estadísticas');
      console.log('🔄 Ejecuta: basicSync() - para sincronización básica');
      console.log('🧪 Ejecuta: forceTestData() - para crear datos de prueba');
    };
    
    // Configurar herramientas después de un pequeño delay
    const timer = setTimeout(setupDebugTools, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return null; // Componente invisible
};

export default DebugPanel;