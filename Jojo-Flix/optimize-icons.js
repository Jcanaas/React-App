const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const inputIcon = path.join(__dirname, 'assets', 'images', 'icon.png');
  const assetsDir = path.join(__dirname, 'assets', 'images');
  const tempDir = path.join(__dirname, 'temp_icons');
  
  // Crear directorio temporal
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  try {
    console.log('🔄 Generando iconos optimizados...');
    
    // Generar icono principal (1024x1024 para mejor calidad)
    await sharp(inputIcon)
      .resize(1024, 1024)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(tempDir, 'icon.png'));
    
    // Generar adaptive icon (1024x1024)
    await sharp(inputIcon)
      .resize(1024, 1024)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(tempDir, 'adaptive-icon.png'));
    
    // Generar favicon (512x512)
    await sharp(inputIcon)
      .resize(512, 512)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(tempDir, 'favicon.png'));
    
    // Generar splash icon (400x400)
    await sharp(inputIcon)
      .resize(400, 400)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(tempDir, 'splash-icon.png'));
    
    // Mover archivos optimizados
    fs.copyFileSync(path.join(tempDir, 'icon.png'), path.join(assetsDir, 'icon.png'));
    fs.copyFileSync(path.join(tempDir, 'adaptive-icon.png'), path.join(assetsDir, 'adaptive-icon.png'));
    fs.copyFileSync(path.join(tempDir, 'favicon.png'), path.join(assetsDir, 'favicon.png'));
    fs.copyFileSync(path.join(tempDir, 'splash-icon.png'), path.join(assetsDir, 'splash-icon.png'));
    
    // Limpiar directorio temporal
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log('✅ Iconos generados exitosamente');
    console.log('📱 icon.png: 1024x1024');
    console.log('🎨 adaptive-icon.png: 1024x1024');
    console.log('🌐 favicon.png: 512x512');
    console.log('💫 splash-icon.png: 400x400');
    console.log('');
    console.log('🚀 Para aplicar los cambios:');
    console.log('1. expo r -c');
    console.log('2. eas build --platform android --profile preview --clear-cache');
    
  } catch (error) {
    console.error('❌ Error generando iconos:', error.message);
    
    // Crear un README con instrucciones
    const readme = `
# 🎨 Guía para Optimizar Iconos - JojoFlix

## 📋 Dimensiones Requeridas:

### Android:
- **icon.png**: 1024x1024px (icono principal)
- **adaptive-icon.png**: 1024x1024px (icono adaptativo)
- **splash-icon.png**: 400x400px (splash screen)

### Web:
- **favicon.png**: 512x512px

## 🛠️ Herramientas Recomendadas:

### Online (Gratis):
1. **Canva**: https://canva.com
2. **Figma**: https://figma.com
3. **GIMP**: https://gimp.org

### Especificaciones:
- Formato: PNG
- Fondo transparente (excepto para adaptive-icon)
- Colores del logo: Rosa (#DF2892) y blanco
- Estilo: Minimalista, legible en tamaños pequeños

## 🎯 Tips para Mejor Calidad:
1. Usar vectores cuando sea posible
2. Asegurar contraste adecuado
3. Probar en diferentes tamaños
4. Mantener el diseño simple y reconocible

## 🚀 Después de actualizar los iconos:
\`\`\`bash
expo r -c
eas build --platform android --profile preview --clear-cache
\`\`\`
`;
    
    fs.writeFileSync(path.join(__dirname, 'ICON_OPTIMIZATION_GUIDE.md'), readme);
    console.log('📝 Guía creada: ICON_OPTIMIZATION_GUIDE.md');
  }
}

generateIcons();
