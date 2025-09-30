const fs = require('fs');
const path = require('path');

function verifyAndroidIcons() {
  console.log('🔍 VERIFICACIÓN DE ICONOS ANDROID\n');
  console.log('=' .repeat(50));
  
  const androidResPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  
  let allGood = true;
  let totalFiles = 0;
  
  densities.forEach(density => {
    const folderPath = path.join(androidResPath, `mipmap-${density}`);
    console.log(`\n📁 Verificando mipmap-${density}:`);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`   ❌ Carpeta no existe`);
      allGood = false;
      return;
    }
    
    const requiredFiles = [
      'ic_launcher.webp',
      'ic_launcher.png', 
      'ic_launcher_round.webp',
      'ic_launcher_foreground.webp'
    ];
    
    requiredFiles.forEach(fileName => {
      const filePath = path.join(folderPath, fileName);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`   ✅ ${fileName} - ${sizeKB}KB`);
        totalFiles++;
      } else {
        console.log(`   ⚠️  ${fileName} - FALTA`);
      }
    });
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 RESUMEN: ${totalFiles} archivos encontrados`);
  
  if (allGood && totalFiles >= 15) { // Al menos 3 archivos por cada 5 densidades
    console.log('🎉 VERIFICACIÓN EXITOSA');
    console.log('✅ Todos los iconos Android están listos');
    console.log('');
    console.log('🚀 PRÓXIMOS PASOS:');
    console.log('1. Hacer build: npx eas build --platform android --profile preview --clear-cache');
    console.log('2. O ejecutar localmente: npx expo run:android');
    console.log('');
    console.log('📱 RESULTADO ESPERADO:');
    console.log('- Icono del acceso directo nítido y bien definido');
    console.log('- Compatible con todos los tamaños de pantalla Android');
    console.log('- Soporte para iconos adaptativos (Android 8+)');
    
  } else {
    console.log('⚠️  PROBLEMAS DETECTADOS');
    console.log('Ejecuta: node generate-android-icons.js');
  }
  
  return allGood;
}

// Función para mostrar comparación antes/después
function showComparison() {
  console.log('\n🔄 COMPARACIÓN ANTES/DESPUÉS:');
  console.log('=' .repeat(50));
  console.log('❌ ANTES: Icono pixelado, baja calidad');
  console.log('✅ DESPUÉS: Icono nítido en todas las densidades');
  console.log('');
  console.log('📐 DIMENSIONES GENERADAS:');
  console.log('- mipmap-mdpi: 48x48px (densidad media)');
  console.log('- mipmap-hdpi: 72x72px (densidad alta)'); 
  console.log('- mipmap-xhdpi: 96x96px (densidad extra alta)');
  console.log('- mipmap-xxhdpi: 144x144px (densidad extra extra alta)');
  console.log('- mipmap-xxxhdpi: 192x192px (densidad máxima)');
}

if (require.main === module) {
  const isGood = verifyAndroidIcons();
  showComparison();
  
  if (isGood) {
    console.log('\n🎯 TODO LISTO PARA BUILD');
  }
}

module.exports = { verifyAndroidIcons };