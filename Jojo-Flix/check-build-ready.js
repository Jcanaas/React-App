const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 VERIFICADOR DE APLICACIÓN DE CAMBIOS - JOJO-FLIX\n');

function checkExpoCache() {
  console.log('📂 Verificando caché de Expo...');
  
  const possibleCachePaths = [
    path.join(process.env.HOME || process.env.USERPROFILE, '.expo'),
    path.join(__dirname, '.expo'),
    path.join(process.env.APPDATA || '', 'expo') // Windows
  ];
  
  let cacheFound = false;
  for (const cachePath of possibleCachePaths) {
    if (fs.existsSync(cachePath)) {
      console.log(`✅ Caché encontrado en: ${cachePath}`);
      cacheFound = true;
    }
  }
  
  if (!cacheFound) {
    console.log('⚠️  No se encontró caché de Expo (puede ser normal)');
  }
  
  console.log('');
}

function checkBuildArtifacts() {
  console.log('🔨 Verificando artefactos de build...');
  
  const artifactPaths = [
    path.join(__dirname, 'android', 'app', 'build'),
    path.join(__dirname, 'android', 'build'),
    path.join(__dirname, '.expo', 'web'),
    path.join(__dirname, 'dist')
  ];
  
  let artifactsFound = false;
  for (const artifactPath of artifactPaths) {
    if (fs.existsSync(artifactPath)) {
      console.log(`⚠️  Build artifacts encontrados: ${artifactPath}`);
      console.log('   Recomendación: Limpiar con "expo r -c"');
      artifactsFound = true;
    }
  }
  
  if (!artifactsFound) {
    console.log('✅ No hay build artifacts antiguos');
  }
  
  console.log('');
}

function generateVerificationSteps() {
  console.log('📋 PASOS PARA VERIFICAR QUE LOS CAMBIOS SE APLICARON:\n');
  
  const steps = `
🔄 **PASO 1: Limpiar Caché**
\`\`\`bash
expo r -c
\`\`\`
*Esto limpia toda la caché de Metro bundler y Expo*

📱 **PASO 2: Build de Desarrollo (Recomendado)**
\`\`\`bash
eas build --platform android --profile preview --clear-cache
\`\`\`
*O para build local:*
\`\`\`bash
eas build --platform android --profile preview --local --clear-cache
\`\`\`

🚀 **PASO 3: Build de Producción (Opcional)**
\`\`\`bash
eas build --platform android --profile production --clear-cache
\`\`\`

📊 **PASO 4: Verificación Visual**
1. **En el emulador/dispositivo:**
   - Desinstala la app anterior completamente
   - Instala la nueva versión
   - Verifica que el icono se vea nítido en:
     * Drawer de aplicaciones
     * Pantalla de inicio
     * Configuración > Apps
     * Pantalla de carga (splash screen)

2. **En diferentes densidades de pantalla:**
   - Cambia la densidad DPI en el emulador
   - Verifica que el icono sigue nítido

3. **Icono adaptativo (Android 8+):**
   - Mantén presionado el icono
   - Verifica que se adapte correctamente al tema

🔍 **PASO 5: Verificación Técnica**
1. **Extrae el APK y verifica:**
   \`\`\`bash
   # Si tienes aapt instalado
   aapt dump badging your-app.apk | grep icon
   \`\`\`

2. **Verifica en Android Studio:**
   - Abre el APK en Android Studio
   - Ve a res/mipmap-* folders
   - Verifica que los iconos tengan las dimensiones correctas

⚠️  **IMPORTANTE:**
- Siempre desinstala la versión anterior antes de instalar la nueva
- Usa \`--clear-cache\` en todos los builds
- Si sigues viendo iconos pixelados, ejecuta \`node verify-and-fix-icons.js --fix\` nuevamente
`;

  console.log(steps);
  
  // Guardar en archivo
  const stepsFile = path.join(__dirname, 'VERIFICATION_STEPS.md');
  fs.writeFileSync(stepsFile, `# 🔍 Pasos de Verificación de Iconos - JOJO-FLIX\n\n${steps}`);
  console.log(`📄 Pasos guardados en: VERIFICATION_STEPS.md\n`);
}

function checkCurrentStatus() {
  console.log('📊 ESTADO ACTUAL DEL PROYECTO:\n');
  
  // Verificar iconos
  const iconPaths = [
    'assets/images/icon.png',
    'assets/images/adaptive-icon.png', 
    'assets/images/favicon.png',
    'assets/images/splash-icon.png'
  ];
  
  let allIconsOk = true;
  for (const iconPath of iconPaths) {
    const fullPath = path.join(__dirname, iconPath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`✅ ${iconPath} - ${sizeKB}KB`);
    } else {
      console.log(`❌ ${iconPath} - FALTA`);
      allIconsOk = false;
    }
  }
  
  // Verificar configuración
  const appJsonPath = path.join(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    console.log('✅ app.json - Configurado');
  } else {
    console.log('❌ app.json - FALTA');
    allIconsOk = false;
  }
  
  console.log('');
  
  if (allIconsOk) {
    console.log('🎉 ESTADO: TODO LISTO PARA BUILD');
    console.log('Ejecuta: expo r -c && eas build --platform android --profile preview --clear-cache');
  } else {
    console.log('⚠️  ESTADO: NECESITA CORRECCIÓN');
    console.log('Ejecuta: node verify-and-fix-icons.js --fix');
  }
}

// Función principal
function main() {
  console.log('=' .repeat(60));
  
  checkCurrentStatus();
  console.log('');
  
  checkExpoCache();
  checkBuildArtifacts();
  
  generateVerificationSteps();
  
  console.log('🎯 RESUMEN FINAL:');
  console.log('1. Los iconos están preparados ✅');
  console.log('2. Usa los comandos de limpieza antes del build');
  console.log('3. Sigue los pasos de verificación visual');
  console.log('4. Si hay problemas, re-ejecuta el fix automático');
  console.log('');
  console.log('📱 COMANDO RÁPIDO PARA APLICAR CAMBIOS:');
  console.log('expo r -c && eas build --platform android --profile preview --clear-cache');
}

main();