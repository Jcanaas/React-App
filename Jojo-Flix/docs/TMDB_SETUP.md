# Configuración de TMDB API

## Paso 1: Obtener una API Key de TMDB

1. **Crear cuenta en TMDB**:
   - Ve a [https://www.themoviedb.org/](https://www.themoviedb.org/)
   - Crea una cuenta gratuita o inicia sesión

2. **Solicitar API Key**:
   - Ve a [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
   - Haz clic en "Request an API Key"
   - Selecciona "Developer"
   - Completa el formulario con la información de tu aplicación:
     - **Application Name**: Jojo-Flix
     - **Application URL**: http://localhost (o tu dominio)
     - **Application Summary**: Aplicación móvil para streaming de contenido con información de películas y series

3. **Obtener la API Key**:
   - Una vez aprobada, encontrarás tu API Key en la sección "API Key (v3 auth)"

## Paso 2: Configurar la API Key en tu aplicación

1. **Abrir el archivo de configuración**:
   ```
   config/tmdb.ts
   ```

2. **Reemplazar la API Key**:
   ```typescript
   export const TMDB_CONFIG = {
     // Reemplaza 'TU_API_KEY_AQUI' con tu API key real
     API_KEY: 'tu_api_key_real_aqui',
     // ... resto de la configuración
   };
   ```

## Paso 3: Verificar que funciona

1. **Reiniciar la aplicación** después de configurar la API key
2. **Ir a cualquier película o serie** en tu app
3. **Cambiar a las pestañas**:
   - **Reparto**: Debe mostrar actores y equipo técnico
   - **Críticas**: Debe mostrar reseñas de usuarios
   - **Episodios**: Debe mostrar episodios de series (solo para series)

## Funciones disponibles con TMDB

### 🎬 Información detallada
- Sinopsis extendida
- Fechas de estreno
- Géneros
- Puntuaciones de usuarios
- Estado de producción

### 👥 Reparto y Equipo
- Actores principales y secundarios
- Director, guionistas, productores
- Fotos de perfil
- Biografías
- Filmografías

### ⭐ Críticas y Valoraciones
- Reseñas de usuarios verificados
- Puntuaciones promedio
- Críticas de sitios especializados
- Sistema de "me gusta"

### 📺 Episodios (Series)
- Lista completa de episodios por temporada
- Sinopsis de cada episodio
- Fechas de emisión
- Puntuaciones individuales
- Imágenes de episodios

## Notas importantes

- ✅ **Gratuito**: La API de TMDB es completamente gratuita
- 🔒 **Límites**: 40 peticiones por 10 segundos (muy generoso)
- 🌍 **Idiomas**: Soporta múltiples idiomas
- 📱 **Imágenes**: Todas las imágenes son optimizadas automáticamente

## Solución de problemas

### No se muestran datos de TMDB
1. Verificar que la API key esté correctamente configurada
2. Verificar conexión a internet
3. Reiniciar la aplicación

### Errores 401 (No autorizado)
- La API key no es válida o no está configurada
- Verificar que copiaste la API key completa

### Errores 404 (No encontrado)
- El contenido no existe en la base de datos de TMDB
- Algunos contenidos locales pueden no tener información en TMDB
