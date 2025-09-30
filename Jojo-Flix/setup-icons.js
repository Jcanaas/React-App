#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 CONFIGURADOR DE ICONOS - JOJO-FLIX\n');

// Verificar si sharp está instalado
function checkSharp() {
  try {
    require('sharp');
    console.log('✅ Sharp ya está instalado');
    return true;
  } catch (error) {
    console.log('❌ Sharp no está instalado');
    return false;
  }
}

// Instalar sharp si es necesario
function installSharp() {
  console.log('📦 Instalando Sharp...');
  try {
    execSync('npm install sharp', { stdio: 'inherit' });
    console.log('✅ Sharp instalado correctamente');
    return true;
  } catch (error) {
    console.log('❌ Error instalando Sharp:', error.message);
    return false;
  }
}

// Verificar que el icono base existe
function checkBaseIcon() {
  const iconPath = path.join(__dirname, 'assets', 'images', 'icon.png');
  if (fs.existsSync(iconPath)) {
    console.log('✅ Icono base encontrado');
    return true;
  } else {
    console.log('❌ Icono base no encontrado en assets/images/icon.png');
    console.log('   Por favor, coloca tu icono principal como icon.png en esa carpeta');
    return false;
  }
}

// Función principal
async function setup() {
  console.log('=' .repeat(50));
  
  // Verificar Sharp
  if (!checkSharp()) {
    if (!installSharp()) {
      process.exit(1);
    }
  }
  
  // Verificar icono base
  if (!checkBaseIcon()) {
    console.log('\n📝 INSTRUCCIONES:');
    console.log('1. Coloca tu icono principal como "icon.png" en assets/images/');
    console.log('2. El icono debe ser preferiblemente 1024x1024px o mayor');
    console.log('3. Formato PNG con fondo transparente');
    console.log('4. Ejecuta nuevamente este script');
    process.exit(1);
  }
  
  console.log('\n🎉 CONFIGURACIÓN COMPLETADA');
  console.log('=' .repeat(50));
  console.log('\n🚀 COMANDOS DISPONIBLES:');
  console.log('');
  console.log('📊 Verificar iconos:');
  console.log('   node verify-and-fix-icons.js');
  console.log('');
  console.log('🔧 Verificar y arreglar iconos:');
  console.log('   node verify-and-fix-icons.js --fix');
  console.log('');
  console.log('📱 Después de arreglar, para aplicar cambios:');
  console.log('   expo r -c');
  console.log('   eas build --platform android --profile preview --clear-cache');
  console.log('');
}

setup();