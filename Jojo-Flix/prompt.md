# Jojo-Flix - Aplicación de Streaming Multiplataforma

## Descripción General
**Jojo-Flix** es una aplicación móvil de streaming desarrollada en React Native con Expo que simula una plataforma estilo Netflix. Es un clon completo de servicio de video bajo demanda que permite a los usuarios autenticarse, explorar contenido multimedia organizado por categorías y visualizar series y películas.

## Tecnologías y Stack Técnico
- **Framework**: React Native + Expo (v53.0.11)
- **Lenguaje**: TypeScript
- **Navegación**: Expo Router con file-based routing
- **Autenticación**: Firebase Auth con persistencia
- **Base de datos**: Firestore (Firebase)
- **Interfaz**: 
  - Componentes nativos de React Native
  - Expo Linear Gradient para efectos visuales
  - Expo Blur para efectos de desenfoque
  - Iconos de @expo/vector-icons
- **Almacenamiento local**: AsyncStorage
- **Sensores**: Giroscopio (para efectos interactivos)
- **Fuentes personalizadas**: Bebas Neue y varias fuentes temáticas

## Funcionalidades Principales

### Sistema de Autenticación
- Registro e inicio de sesión con email/contraseña
- Autenticación persistente con Firebase
- Perfiles de usuario con imagen por defecto
- Pantalla de auth con efectos visuales (gradientes, blur)
- Easter egg: activación del giroscopio con 3 toques en el logo

### Pantalla Principal (Home)
- **Banner Carousel**: Carrusel automático de contenido destacado con imágenes de fondo, logos y botón "Ver"
- **Categorización inteligente**: Contenido organizado automáticamente por categorías
- **Carruseles verticales**: Múltiples carruseles horizontales por categoría
- **Header dinámico**: Con opciones de búsqueda y filtros
- **Footer**: Aparece al hacer scroll hasta abajo

### Gestión de Contenido
El sistema maneja una amplia biblioteca que incluye:
- **Series de anime**: Monster, Beck, Solo Leveling, Bocchi the Rock, etc.
- **Películas**: Dune, Fear Street (trilogía), Berserk, etc.
- **Contenido LGBTIQ+**: Con tratamiento especial (texto rainbow animado)
- **Series live-action**: The Last of Us, Dexter, etc.
- **Contenido por franquicias**: Star Wars (episodios I-VI), etc.

### Sistema de Búsqueda y Filtros
- **SearchModal**: Búsqueda en tiempo real por título
- **CategoryModal**: Filtrado por múltiples categorías
- Categorías incluyen: Anime, Serie, Película, Terror, Ciencia ficción, Acción, LGBTIQ+, Comedia, Star Wars

### Diseño Responsivo
- Adaptación automática para móvil y web
- Diferentes aspect ratios para banners según dispositivo
- Componentes optimizados para diferentes tamaños de pantalla

## Arquitectura de Datos
- **ContentData.ts**: Base de datos local con toda la información del contenido
- Cada item incluye: ID, nombre, descripción, imágenes (fondo, logo, banner vertical), capítulos, fuentes de video, episodios, fecha de estreno, puntuación, categorías
- Fuentes de video almacenadas como enlaces de Mega.nz

## Experiencia de Usuario
- **Navegación fluida**: File-based routing con transiciones suaves
- **Efectos visuales**: Gradientes, animaciones, text effects
- **Interactividad**: Controles táctiles, scroll detection, modal overlays
- **Feedback visual**: Estados de carga, animaciones de botones
- **Accesibilidad**: Iconografía clara, contraste adecuado

## Características Técnicas Avanzadas
- **Auto-scroll**: Carruseles con rotación automática
- **Loop infinito**: Simulación de contenido continuo en carruseles
- **Gestión de estado**: Context API para autenticación
- **Persistencia de sesión**: Mantiene usuarios logueados
- **Detección de scroll**: Para mostrar/ocultar elementos dinámicamente
- **Animaciones nativas**: Usando Animated API de React Native

## Plataformas Soportadas
- **iOS** (con soporte para tablets)
- **Android** (con adaptive icons y edge-to-edge)
- **Web** (con configuración específica de Metro bundler)

## Configuración de Desarrollo
- **Build profiles**: Development, Preview y Production
- **EAS Build**: Configurado para generar APKs
- **TypeScript**: Configuración estricta con rutas tipadas
- **Linting**: ESLint con configuración de Expo

Este proyecto representa una implementación completa de una aplicación de streaming moderna, demostrando competencias en desarrollo móvil multiplataforma, integración con servicios backend, diseño de UX/UI y gestión de contenido multimedia.
