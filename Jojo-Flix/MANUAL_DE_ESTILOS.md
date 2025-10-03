# 🎨 Manual de Estilos JOJO-FLIX

## 📋 Índice
1. [Identidad Visual](#identidad-visual)
2. [Paleta de Colores](#paleta-de-colores)
3. [Tipografía](#tipografía)
4. [Estructura del Header](#estructura-del-header)
5. [Estructura de la Página Principal](#estructura-de-la-página-principal)
6. [Componentes UI](#componentes-ui)
7. [Espaciado y Layout](#espaciado-y-layout)
8. [Estados y Animaciones](#estados-y-animaciones)

---

## 🎭 Identidad Visual

### Logo Principal
- **Texto**: `JOJO-FLIX` (SIEMPRE EN MAYÚSCULAS)
- **Separador**: Guión medio (`-`) entre JOJO y FLIX
- **Efecto**: Gradiente rosa-blanco aplicado con MaskedView
- **Responsive**: Tamaño dinámico basado en ancho de pantalla

### Marca
- **Nombre completo**: JOJO-FLIX
- **Nombre corto**: Jojo-Flix (solo en textos descriptivos)
- **Tagline**: "Tu Plataforma de Streaming Personal"

---

## 🎨 Paleta de Colores

### Colores Primarios
```css
/* Rosa Principal (Brand Color) */
#DF2892  /* Botones principales, enlaces, destacados */

/* Rosa Claro (Gradientes) */  
#FF5FA2  /* Inicio de gradientes */
#FF7EB3  /* Gradientes suaves */

/* Rosa Accent */
#E91E63  /* Elementos secundarios */
#FF1744  /* Estados de error o urgencia */
```

### Colores de Fondo
```css
/* Fondo Principal */
#181818  /* Background principal de la app */
#1a1a1a  /* Background de modals y cards */

/* Fondos Secundarios */
#222     /* Elementos elevados, header secundario */
#2a2a2a  /* Cards con más elevación */
#333     /* Elementos interactivos hover */

/* Fondos Neutros */
#2d2d2d  /* Gradientes de fondo */
#666     /* Elementos deshabilitados */
```

### Colores de Texto
```css
/* Texto Principal */
#fff     /* Texto principal sobre fondos oscuros */
#000     /* Texto sobre fondos claros (raro uso) */

/* Texto Secundario */
#888     /* Texto secundario, metadatos */
#ccc     /* Texto de menor importancia */

/* Estados Especiales */
#4CAF50  /* Éxito, completado */
#FF6B35  /* Advertencias */
#9C27B0  /* Elementos especiales */
```

---

## ✍️ Tipografía

### Fuentes Principales
```css
/* Logo y Títulos Principales */
font-family: 'Bebas Neue'
/* Usado en: Logo JOJO-FLIX, títulos principales */

/* Fuente de Sistema */
font-family: 'BN' /* Custom font */
/* Backup: System fonts (SF Pro, Roboto, etc.) */

/* Fuente Monospace */
font-family: 'SpaceMono'
/* Usado en: Código, datos técnicos */
```

### Jerarquía Tipográfica
```css
/* Logo Principal */
font-size: 48px (responsive: 16px-48px)
font-family: 'Bebas Neue'
letter-spacing: 2px
text-transform: uppercase

/* Títulos H1 */
font-size: 28px
font-weight: bold
color: #fff

/* Títulos H2 */
font-size: 24px
font-weight: 600
color: #fff

/* Títulos H3 */
font-size: 20px
font-weight: 600
color: #fff

/* Texto Principal */
font-size: 16px
font-weight: normal
color: #fff

/* Texto Secundario */
font-size: 14px
font-weight: normal
color: #888

/* Texto Pequeño */
font-size: 12px
font-weight: normal
color: #888
```

---

## 🔝 Estructura del Header

### Layout Principal
```tsx
<Header>
  {/* Lado Izquierdo */}
  <View style="side">
    <TouchableOpacity> {/* Menú */}
      <Ionicons name="menu" size={28} />
    </TouchableOpacity>
    <TouchableOpacity> {/* Social */}
      <Ionicons name="people" size={26} />
    </TouchableOpacity>
  </View>

  {/* Centro - Logo */}
  <View style="centerLogo">
    <MaskedView>
      <LinearGradient colors={['#ff5fa2', '#fff']}>
        <Text>JOJO-FLIX</Text>
      </LinearGradient>
    </MaskedView>
  </View>

  {/* Lado Derecho */}
  <View style="side">
    <TouchableOpacity> {/* Búsqueda */}
      <Ionicons name="search" size={26} />
    </TouchableOpacity>
    <TouchableOpacity> {/* Usuario */}
      <Image/Ionicons /> {/* Avatar o icono */}
    </TouchableOpacity>
  </View>
</Header>
```

### Estilos del Header
```css
.header {
  background-color: #181818;
  padding-top: statusBarHeight + 10px;
  padding-bottom: 12px;
  elevation: 4;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding-horizontal: 16px;
}

.centerLogo {
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-horizontal: 8px;
}

.side {
  flex-direction: row;
  align-items: center;
  min-width: 100px;
}

.iconButton {
  padding: 4px;
  margin-left: 8px;
}
```

---

## 🏠 Estructura de la Página Principal

### Layout Principal (Home)
```tsx
<View style="container">
  <Header />
  
  <ScrollView>
    {/* 1. Banner Principal */}
    <BannerCarousel nombres={bannerNames} />
    
    {/* 2. Banner Estacional */}
    <SeasonalBanner />
    
    {/* 3. Continuar Viendo */}
    <ContinueWatching />
    
    {/* 4. Carruseles por Categoría */}
    <VerticalTripleCarouselsByCategory />
    
    {/* 5. Reproductor de Música (si está activo) */}
    {isPlayerVisible && (
      <TouchableOpacity onPress={handleMusicPlayerPress}>
        <MusicPlayerSection />
      </TouchableOpacity>
    )}
  </ScrollView>
  
  {/* Footer (aparece al hacer scroll al final) */}
  {showFooter && <Footer />}
  
  {/* Modals */}
  <SearchModal />
  <CategoryModal />
</View>
```

### Estilos del Container Principal
```css
.container {
  flex: 1;
  background-color: #181818;
  position: relative;
}

.scrollContainer {
  flex: 1;
  min-height: 900px;
  padding-bottom: 100px;
}
```

### Estructura de Carruseles
```tsx
{/* Cada categoría tiene su carrusel */}
<View style="categorySection">
  <Text style="categoryTitle">{categoria}</Text>
  <FlatList
    horizontal
    data={contenidoPorCategoria}
    renderItem={({item}) => (
      <TouchableOpacity style="contentCard">
        <OptimizedImage source={item.verticalbanner} />
        <Text style="contentTitle">{item.nombre}</Text>
      </TouchableOpacity>
    )}
  />
</View>
```

---

## 🧩 Componentes UI

### Botones Principales
```css
/* Botón Primario */
.primaryButton {
  background-color: #DF2892;
  padding: 12px 24px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
}

.primaryButtonText {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

/* Botón Secundario */
.secondaryButton {
  background-color: transparent;
  border: 2px solid #DF2892;
  padding: 12px 24px;
  border-radius: 8px;
}

.secondaryButtonText {
  color: #DF2892;
  font-size: 16px;
  font-weight: 600;
}

/* Botón Deshabilitado */
.disabledButton {
  background-color: #666;
  padding: 12px 24px;
  border-radius: 8px;
}
```

### Cards de Contenido
```css
.contentCard {
  width: itemWidth;
  height: itemHeight;
  margin-right: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.contentImage {
  width: 100%;
  height: 100%;
  resize-mode: cover;
}

.contentOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  padding: 12px;
}
```

### Modals
```css
.modalOverlay {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.8);
  justify-content: center;
  align-items: center;
}

.modalContent {
  background-color: #222;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.modalTitle {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16px;
  text-align: center;
}
```

---

## 📐 Espaciado y Layout

### Sistema de Espaciado
```css
/* Espaciado Base (múltiplos de 8px) */
.spacing-xs: 4px
.spacing-sm: 8px
.spacing-md: 16px
.spacing-lg: 24px
.spacing-xl: 32px
.spacing-xxl: 48px

/* Padding Horizontal Standard */
.container-padding: 16px (left/right)

/* Gaps entre elementos */
.gap-small: 8px
.gap-medium: 16px
.gap-large: 24px
```

### Breakpoints Responsive
```css
/* Móvil */
@media (max-width: 700px) {
  .itemsPerRow: 3;
  .itemWidth: (screenWidth - 64px) / 3;
}

/* Tablet/Desktop */
@media (min-width: 700px) {
  .itemsPerRow: Math.floor(screenWidth / 160);
  .itemWidth: 180px;
}
```

### Elevaciones y Sombras
```css
/* Elevación Baja */
.elevation-1 {
  elevation: 2;
  shadow-color: #000;
  shadow-offset: { width: 0, height: 1 };
  shadow-opacity: 0.2;
  shadow-radius: 2;
}

/* Elevación Media */
.elevation-2 {
  elevation: 4;
  shadow-color: #000;
  shadow-offset: { width: 0, height: 2 };
  shadow-opacity: 0.25;
  shadow-radius: 4;
}

/* Elevación Alta */
.elevation-3 {
  elevation: 8;
  shadow-color: #000;
  shadow-offset: { width: 0, height: 4 };
  shadow-opacity: 0.3;
  shadow-radius: 8;
}
```

---

## ⚡ Estados y Animaciones

### Estados de Botones
```css
/* Estado Normal */
.button-normal {
  opacity: 1;
  transform: scale(1);
}

/* Estado Pressed */
.button-pressed {
  opacity: 0.8;
  transform: scale(0.95);
}

/* Estado Hover (Web) */
.button-hover {
  opacity: 0.9;
  transform: scale(1.02);
}
```

### Transiciones Estándar
```css
/* Transición Rápida */
.transition-fast {
  duration: 150ms;
  timing-function: ease-out;
}

/* Transición Normal */
.transition-normal {
  duration: 250ms;
  timing-function: ease-in-out;
}

/* Transición Lenta */
.transition-slow {
  duration: 400ms;
  timing-function: ease-in-out;
}
```

### Gradientes Corporativos
```css
/* Gradiente Principal */
.gradient-primary {
  colors: ['#FF7EB3', '#DF2892', '#18181b'];
  start: { x: 0.5, y: 0 };
  end: { x: 0.5, y: 1 };
}

/* Gradiente Logo */
.gradient-logo {
  colors: ['#ff5fa2', '#fff'];
  start: { x: 0, y: 0 };
  end: { x: 0, y: 1 };
}

/* Gradiente Sutil */
.gradient-subtle {
  colors: ['#1a1a1a', '#2d2d2d', '#1a1a1a'];
  start: { x: 0, y: 0 };
  end: { x: 1, y: 1 };
}
```

---

## 📱 Consideraciones de Plataforma

### Android Específico
- **StatusBar**: Altura dinámica (24px default)
- **Elevaciones**: Usar `elevation` property
- **Navegación**: Bottom tabs con `#222` background

### iOS Específico  
- **StatusBar**: 44px de altura
- **Sombras**: Usar shadow properties
- **Navegación**: Mantener consistencia visual

### Web Específico
- **Logo**: Usar CSS gradients en lugar de MaskedView
- **Interacciones**: Añadir estados hover
- **Responsive**: Breakpoints en 700px

---

## 🎯 Mejores Prácticas

### Accesibilidad
- Contraste mínimo 4.5:1 para texto normal
- Contraste mínimo 3:1 para texto grande
- Área mínima de toque: 44x44px
- Textos alternativos para imágenes

### Performance
- Usar `OptimizedImage` para imágenes
- Implementar `removeClippedSubviews` en listas largas
- Memoizar componentes pesados con `React.memo`
- Usar `FlatList` para listas grandes

### Consistencia
- Mantener el naming JOJO-FLIX en mayúsculas
- Usar la paleta de colores definida
- Respetar el sistema de espaciado (múltiplos de 8px)
- Aplicar elevaciones consistentes

---

*Manual creado para JOJO-FLIX v1.0 - Actualizado Octubre 2025*