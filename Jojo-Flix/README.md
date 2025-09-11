# Jojo-Flix - Tu Plataforma de Streaming Personal

¡Bienvenido a **Jojo-Flix**! Una aplicación móvil que simula Netflix, donde puedes ver series y películas de anime, ciencia ficción, terror y mucho más. Desarrollada con React Native y Expo.

## ¿Qué es Jojo-Flix?

Jojo-Flix es una aplicación de streaming que incluye:
- Series de anime como Monster, Beck, Solo Leveling
- Películas como Dune, Star Wars, Fear Street
- Contenido LGBTIQ+ con diseños especiales
- Sistema de búsqueda y filtros por categorías
- Autenticación de usuarios con Firebase
- Funciona en Android, iOS y Web

## Instalación y Configuración

### Prerrequisitos
Antes de empezar, asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (versión 16 o superior)
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Pasos de instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/Jojo-Flix.git
   cd Jojo-Flix
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Inicia la aplicación**
   ```bash
   npx expo start
   ```

4. **Abre la app en tu dispositivo**
   - **En tu teléfono**: Escanea el código QR con la app Expo Go
   - **En el navegador**: Presiona `w` para abrir en web
   - **Android**: Presiona `a` para abrir en emulador Android
   - **iOS**: Presiona `i` para abrir en simulador iOS

## Estructura del Proyecto

### Carpetas Principales

```
Jojo-Flix/
├── app/                    # Pantallas de la aplicación
│   ├── (tabs)/            # Pantallas con navegación por pestañas
│   │   ├── index.tsx      # Pantalla principal (Home)
│   │   └── layout.tsx     # Layout de las pestañas
│   ├── auth.tsx           # Pantalla de login y registro
│   ├── content-detail-screen.tsx # Detalles de películas/series
│   └── _layout.tsx        # Layout principal de la app
├── components/            # Componentes reutilizables
├── assets/               # Imágenes, fuentes y recursos
├── constants/            # Colores y configuraciones
└── android/              # Configuración específica de Android
```

### Archivos Importantes

#### Componentes (`/components/`)
- **`ContentData.ts`**: Base de datos con todas las series y películas
- **`BannerCarousel.tsx`**: Carrusel principal de la pantalla de inicio
- **`VerticalTripleCarousel.tsx`**: Carruseles por categorías
- **`Header.tsx`**: Barra superior con búsqueda y menú
- **`SearchModal.tsx`**: Modal de búsqueda de contenido
- **`UserContext.tsx`**: Gestión del estado del usuario
- **`firebaseConfig.ts`**: Configuración de Firebase para autenticación

#### Pantallas (`/app/`)
- **`auth.tsx`**: Pantalla de inicio de sesión y registro
- **`(tabs)/index.tsx`**: Pantalla principal con carruseles
- **`content-detail-screen.tsx`**: Detalles de cada serie/película

#### Configuración
- **`package.json`**: Dependencias y scripts del proyecto
- **`app.json`**: Configuración de la aplicación Expo
- **`eas.json`**: Configuración para crear APKs
- **`tsconfig.json`**: Configuración de TypeScript

#### Recursos (`/assets/`)
- **`/images/`**: Todas las imágenes de series, películas y logos
- **`/fonts/`**: Fuentes personalizadas como Bebas Neue

## Características Principales

### Sistema de Usuarios
- **Registro**: Crea tu cuenta con email y contraseña
- **Login**: Inicia sesión de forma segura
- **Persistencia**: Tu sesión se mantiene activa
- **Firebase**: Base de datos segura para usuarios

### Pantalla Principal
- **Banner Destacado**: Las mejores series en rotación automática
- **Categorías**: Contenido organizado por género (Anime, Terror, LGBTIQ+, etc.)
- **Navegación Fluida**: Scroll suave con efectos visuales

### Búsqueda y Filtros
- **Búsqueda Rápida**: Encuentra series por nombre
- **Filtros**: Selecciona múltiples categorías
- **Resultados Instantáneos**: Búsqueda en tiempo real

### Reproductor de Video
- **Enlaces Directos**: Videos alojados en Mega.nz
- **Información Completa**: Sinopsis, episodios, puntuación
- **Diseño Atractivo**: Banners y logos de alta calidad

## Tecnologías Utilizadas

### Frontend
- **React Native**: Framework para apps móviles
- **Expo**: Herramientas de desarrollo y deployment
- **TypeScript**: Tipado estático para mejor código
- **Expo Router**: Navegación moderna basada en archivos

### Backend y Servicios
- **Firebase Auth**: Autenticación de usuarios
- **Firestore**: Base de datos de usuarios
- **Mega.nz**: Alojamiento de videos

### Librerías Principales
- **Linear Gradient**: Gradientes hermosos
- **Blur View**: Efectos de desenfoque
- **Async Storage**: Almacenamiento local
- **Vector Icons**: Iconos vectoriales

## Cómo Usar la App

1. **Registro/Login**: Al abrir la app, regístrate o inicia sesión
2. **Explora**: Navega por los carruseles de contenido
3. **Busca**: Usa el ícono de búsqueda para encontrar contenido específico
4. **Filtra**: Usa el menú para filtrar por categorías
5. **Reproduce**: Toca cualquier serie/película para ver detalles y reproducir

## Características Especiales

- **Texto Rainbow**: El contenido LGBTIQ+ tiene efectos de texto especiales
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Efectos Visuales**: Gradientes, blur y animaciones suaves
- **Auto-scroll**: Los carruseles se mueven automáticamente
- **Easter Eggs**: ¡Prueba tocar el logo 3 veces en la pantalla de login!

## Compilar para Producción

Para crear una APK de Android:

```bash
# Instala EAS CLI si no lo tienes
npm install -g @expo/eas-cli

# Compila la APK
eas build --platform android --profile preview
```

## Contribuir

¿Quieres agregar más series o mejorar la app?

1. Haz fork del repositorio
2. Crea una nueva rama: `git checkout -b nueva-caracteristica`
3. Añade tu contenido en `ContentData.ts`
4. Haz commit: `git commit -m 'Agregar nueva serie'`
5. Push: `git push origin nueva-caracteristica`
6. Crea un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Contacta al desarrollador
- Revisa la documentación de [Expo](https://docs.expo.dev/)

---

¡Disfruta de Jojo-Flix!
