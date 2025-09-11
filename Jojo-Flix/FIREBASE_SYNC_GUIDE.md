# Sistema de Sincronización Automática de Contenido con Firebase

## Problema Actual
Actualmente, cada vez que quieres añadir nuevas series o películas a tu app Jojo-Flix, tienes que:
1. Modificar el archivo `ContentData.ts`
2. Crear una nueva build de la aplicación
3. Distribuir la nueva APK

Esto es ineficiente y hace que los usuarios no puedan ver contenido nuevo hasta que actualicen manualmente la app.

## Solución Propuesta
Implementar un sistema de sincronización automática que:
1. Almacene el contenido en Firebase Firestore
2. Compare el contenido local con el de Firebase al iniciar la app
3. Descargue automáticamente nuevo contenido cuando esté disponible
4. Mantenga una caché local para funcionamiento offline


## Beneficios
- **Actualizaciones instantáneas**: Nuevo contenido visible sin actualizar la app
- **Gestión centralizada**: Administra el contenido desde Firebase Console
- **Funcionamiento offline**: Mantiene contenido local como fallback
- **Versionado automático**: Sistema de versiones para detectar cambios
- **Escalabilidad**: Fácil añadir nuevas características como favoritos, historial, etc.

## Implementación Paso a Paso

### Paso 1: Configurar Firestore para Contenido

#### 1.1 Estructura de la Base de Datos en Firestore

```
firestore/
├── content/
│   ├── metadata/
│   │   └── version (documento con timestamp de última actualización)
│   └── items/
│       ├── beck-mongolian-chop-squad (documento)
│       ├── monster (documento)
│       ├── solo-leveling (documento)
│       └── ... (más contenido)
```

#### 1.2 Reglas de Seguridad de Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de contenido a usuarios autenticados
    match /content/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Solo administradores pueden escribir
    }
    
    // Permitir lectura/escritura de datos de usuario
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Paso 2: Crear el Sistema de Gestión de Contenido

#### 2.1 Crear ContentManager.ts

```typescript
// components/ContentManager.ts
import { collection, doc, getDocs, getDoc, orderBy, query } from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentItem } from './ContentData';

const CONTENT_CACHE_KEY = '@jojo_flix_content';
const CONTENT_VERSION_KEY = '@jojo_flix_content_version';
const CONTENT_COLLECTION = 'content';

export class ContentManager {
  private static instance: ContentManager;
  private contentCache: ContentItem[] = [];
  private isInitialized = false;

  static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  async initialize(): Promise<ContentItem[]> {
    if (this.isInitialized && this.contentCache.length > 0) {
      return this.contentCache;
    }

    try {
      // 1. Cargar contenido local como fallback
      await this.loadLocalContent();
      
      // 2. Verificar si hay actualizaciones en Firebase
      const needsUpdate = await this.checkForUpdates();
      
      if (needsUpdate) {
        console.log('Actualizando contenido desde Firebase...');
        await this.syncContentFromFirebase();
      } else {
        console.log('Contenido local está actualizado');
      }
      
      this.isInitialized = true;
      return this.contentCache;
    } catch (error) {
      console.error('Error inicializando ContentManager:', error);
      // En caso de error, usar contenido local o fallback
      if (this.contentCache.length === 0) {
        await this.loadFallbackContent();
      }
      return this.contentCache;
    }
  }

  private async loadLocalContent(): Promise<void> {
    try {
      const cachedContent = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
      if (cachedContent) {
        this.contentCache = JSON.parse(cachedContent);
        console.log(`Contenido local cargado: ${this.contentCache.length} items`);
      }
    } catch (error) {
      console.error('Error cargando contenido local:', error);
    }
  }

  private async checkForUpdates(): Promise<boolean> {
    try {
      // Obtener versión actual de Firebase
      const versionDoc = await getDoc(doc(db, CONTENT_COLLECTION, 'metadata'));
      
      if (!versionDoc.exists()) {
        return false; // No hay datos en Firebase aún
      }
      
      const firebaseVersion = versionDoc.data().lastUpdated?.toMillis() || 0;
      
      // Obtener versión local
      const localVersionStr = await AsyncStorage.getItem(CONTENT_VERSION_KEY);
      const localVersion = localVersionStr ? parseInt(localVersionStr) : 0;
      
      console.log(`Versión Firebase: ${firebaseVersion}, Versión local: ${localVersion}`);
      
      return firebaseVersion > localVersion;
    } catch (error) {
      console.error('Error verificando actualizaciones:', error);
      return false;
    }
  }

  private async syncContentFromFirebase(): Promise<void> {
    try {
      // Obtener todos los documentos de contenido
      const contentQuery = query(collection(db, CONTENT_COLLECTION, 'items'), orderBy('nombre'));
      const querySnapshot = await getDocs(contentQuery);
      
      const firebaseContent: ContentItem[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convertir datos de Firestore a ContentItem
        firebaseContent.push({
          id: doc.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          fondo: data.fondo, // URL de imagen en Firebase Storage
          logo: data.logo,   // URL de imagen en Firebase Storage
          capitulos: data.capitulos,
          fuente: data.fuente,
          nombresEpisodios: data.nombresEpisodios,
          fechaEstreno: data.fechaEstreno,
          puntuacion: data.puntuacion,
          categoria: data.categoria,
          verticalbanner: data.verticalbanner, // URL de imagen en Firebase Storage
        });
      });
      
      if (firebaseContent.length > 0) {
        this.contentCache = firebaseContent;
        
        // Guardar en caché local
        await AsyncStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(firebaseContent));
        
        // Actualizar versión local
        const versionDoc = await getDoc(doc(db, CONTENT_COLLECTION, 'metadata'));
        if (versionDoc.exists()) {
          const version = versionDoc.data().lastUpdated?.toMillis().toString();
          await AsyncStorage.setItem(CONTENT_VERSION_KEY, version);
        }
        
        console.log(`Contenido sincronizado: ${firebaseContent.length} items`);
      }
    } catch (error) {
      console.error('Error sincronizando desde Firebase:', error);
      throw error;
    }
  }

  private async loadFallbackContent(): Promise<void> {
    // Importar el ContentData original como fallback
    const { ContentData } = await import('./ContentData');
    this.contentCache = ContentData;
    console.log('Usando contenido fallback local');
  }

  getContent(): ContentItem[] {
    return this.contentCache;
  }

  async forceSync(): Promise<ContentItem[]> {
    this.isInitialized = false;
    return await this.initialize();
  }
}
```

#### 2.2 Crear Hook personalizado para el contenido

```typescript
// hooks/useContentData.ts
import { useState, useEffect } from 'react';
import { ContentItem } from '../components/ContentData';
import { ContentManager } from '../components/ContentManager';

export const useContentData = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeContent();
  }, []);

  const initializeContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const contentManager = ContentManager.getInstance();
      const data = await contentManager.initialize();
      setContent(data);
    } catch (err) {
      setError('Error cargando contenido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = async () => {
    try {
      setLoading(true);
      const contentManager = ContentManager.getInstance();
      const data = await contentManager.forceSync();
      setContent(data);
    } catch (err) {
      setError('Error actualizando contenido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    content,
    loading,
    error,
    refreshContent
  };
};
```

### Paso 3: Modificar Componentes Existentes

#### 3.1 Actualizar VerticalTripleCarouselsByCategory.tsx

```typescript
// Reemplazar la importación estática
// import { ContentItem, ContentData } from './ContentData';

// Por el hook dinámico
import { useContentData } from '../hooks/useContentData';

// En el componente:
const VerticalTripleCarouselsByCategory: React.FC<Props> = ({ onPress, filterCategories }) => {
  const { content: ContentData, loading } = useContentData();
  
  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Cargando contenido...</Text>
      </View>
    );
  }

  const categories = getCategories(ContentData);
  // ... resto del código igual
};
```

#### 3.2 Actualizar BannerCarousel.tsx

```typescript
// Similar actualización, reemplazar importación estática por hook
const BannerCarousel: React.FC<BannerCarouselProps> = ({ nombres, intervalMs = 5000 }) => {
  const { content: ContentData } = useContentData();
  const banners = ContentData.filter(item => nombres.includes(item.nombre));
  // ... resto del código igual
};
```

#### 3.3 Actualizar SearchModal.tsx

```typescript
// Igual que los anteriores, usar el hook en lugar de importación estática
```

### Paso 4: Script de Migración de Datos

#### 4.1 Crear script para subir contenido inicial

```typescript
// scripts/uploadContentToFirebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ContentData } from '../components/ContentData';

// Tu configuración de Firebase
const firebaseConfig = {
  // ... tu configuración
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadContent() {
  try {
    console.log('Subiendo contenido a Firebase...');
    
    // Subir cada item de contenido
    for (const item of ContentData) {
      await setDoc(doc(db, 'content/items', item.id), {
        nombre: item.nombre,
        descripcion: item.descripcion,
        fondo: item.fondo, // Nota: necesitarás subir imágenes a Firebase Storage
        logo: item.logo,
        capitulos: item.capitulos,
        fuente: item.fuente,
        nombresEpisodios: item.nombresEpisodios,
        fechaEstreno: item.fechaEstreno,
        puntuacion: item.puntuacion,
        categoria: item.categoria,
        verticalbanner: item.verticalbanner,
      });
      console.log(`Subido: ${item.nombre}`);
    }
    
    // Actualizar metadata con timestamp
    await setDoc(doc(db, 'content', 'metadata'), {
      lastUpdated: serverTimestamp(),
      totalItems: ContentData.length,
    });
    
    console.log('¡Contenido subido exitosamente!');
  } catch (error) {
    console.error('Error subiendo contenido:', error);
  }
}

uploadContent();
```

### Paso 5: Panel de Administración Web (Opcional)

#### 5.1 Crear panel simple para gestionar contenido

```html
<!-- admin-panel.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Jojo-Flix Admin Panel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .form-group { margin: 10px 0; }
        label { display: block; margin-bottom: 5px; }
        input, textarea { width: 300px; padding: 5px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Jojo-Flix - Panel de Administración</h1>
    
    <form id="contentForm">
        <div class="form-group">
            <label>ID:</label>
            <input type="text" id="contentId" required>
        </div>
        <div class="form-group">
            <label>Nombre:</label>
            <input type="text" id="nombre" required>
        </div>
        <div class="form-group">
            <label>Descripción:</label>
            <textarea id="descripcion" rows="4" required></textarea>
        </div>
        <!-- Más campos según necesites -->
        
        <button type="submit">Agregar/Actualizar Contenido</button>
    </form>

    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
        import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
        
        // Tu configuración de Firebase
        const firebaseConfig = { /* tu config */ };
        
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        document.getElementById('contentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const contentData = {
                nombre: document.getElementById('nombre').value,
                descripcion: document.getElementById('descripcion').value,
                // ... más campos
            };
            
            try {
                await setDoc(doc(db, 'content/items', document.getElementById('contentId').value), contentData);
                
                // Actualizar timestamp
                await setDoc(doc(db, 'content', 'metadata'), {
                    lastUpdated: serverTimestamp()
                }, { merge: true });
                
                alert('Contenido agregado exitosamente!');
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

### Paso 6: Optimizaciones y Mejoras

#### 6.1 Caché de imágenes
```typescript
// components/ImageCache.ts
import { Image } from 'expo-image';

// Configurar caché de imágenes
Image.prefetch(['url1', 'url2', 'url3']); // Pre-cargar imágenes importantes
```

#### 6.2 Sincronización en background
```typescript
// En App.tsx o _layout.tsx
import { AppState } from 'react-native';

useEffect(() => {
  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'active') {
      // App volvió al foreground, verificar actualizaciones
      ContentManager.getInstance().initialize();
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription?.remove();
}, []);
```

## Flujo de Trabajo Completo

### Para el Desarrollador:
1. **Agregar nuevo contenido**: Usar el panel de admin o Firebase Console
2. **Actualizar timestamp**: Se hace automáticamente
3. **Los usuarios ven el nuevo contenido**: Sin necesidad de actualizar la app

### Para el Usuario:
1. **Abre la app**: Se verifica automáticamente si hay nuevo contenido
2. **Descarga automática**: Nuevo contenido se descarga en background
3. **Uso offline**: Contenido cacheado sigue funcionando sin internet

## Ventajas de esta Implementación

1. **Sin builds**: Nunca más necesitas crear APKs para nuevo contenido
2. **Actualizaciones instantáneas**: Usuarios ven contenido nuevo inmediatamente
3. **Funcionamiento offline**: App funciona sin internet con contenido cacheado
4. **Escalable**: Fácil añadir nuevas características como favoritos, historial
5. **Administración centralizada**: Gestiona todo desde Firebase Console
6. **Fallback robusto**: Si Firebase falla, usa contenido local
7. **Optimizado**: Solo descarga cuando hay cambios reales

Esta solución resuelve completamente tu problema y te permite gestionar el contenido de manera eficiente sin necesidad de crear nuevas builds constantemente.
