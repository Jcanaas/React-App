#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GradleErrorSolver {
  constructor() {
    this.projectRoot = __dirname;
    this.androidDir = path.join(this.projectRoot, 'android');
  }

  async solveBuildError() {
    console.log('🚨 SOLUCIONADOR DE ERRORES DE GRADLE - EXPO\n');
    console.log('=' .repeat(60));
    
    console.log('📋 DIAGNÓSTICO INICIAL...\n');
    
    // Paso 1: Verificar versiones críticas
    await this.checkCriticalVersions();
    
    // Paso 2: Limpiar todo completamente
    await this.deepClean();
    
    // Paso 3: Arreglar configuraciones problemáticas
    await this.fixConfigurations();
    
    // Paso 4: Verificar y arreglar dependencias
    await this.fixDependencies();
    
    // Paso 5: Generar comandos de solución
    this.generateSolutionCommands();
  }

  async checkCriticalVersions() {
    console.log('🔍 VERIFICANDO VERSIONES CRÍTICAS...\n');
    
    try {
      // Java Version
      const javaVersion = execSync('java -version 2>&1', { encoding: 'utf8' });
      console.log('☕ Java:', javaVersion.split('\\n')[0]);
      
      if (javaVersion.includes('18.') || javaVersion.includes('19.') || javaVersion.includes('20.') || javaVersion.includes('21.')) {
        console.log('❌ PROBLEMA CRÍTICO: Java > 17 puede causar errores de Gradle');
        console.log('💡 SOLUCIÓN: Instala Java 17 LTS');
        console.log('   Download: https://adoptium.net/temurin/releases/?version=17');
      } else if (javaVersion.includes('17.') || javaVersion.includes('11.')) {
        console.log('✅ Java versión compatible');
      }
    } catch (error) {
      console.log('❌ Java no encontrado o mal configurado');
    }
    
    try {
      // Node Version
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log('🟢 Node:', nodeVersion);
      
      // NPM Version
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log('📦 NPM:', npmVersion);
      
      // Expo CLI Version
      const expoVersion = execSync('npx expo --version', { encoding: 'utf8' }).trim();
      console.log('🎯 Expo CLI:', expoVersion);
      
    } catch (error) {
      console.log('⚠️  Error verificando versiones:', error.message);
    }
    
    console.log('');
  }

  async deepClean() {
    console.log('🧹 LIMPIEZA PROFUNDA...\n');
    
    const pathsToClean = [
      // Caché de Node
      path.join(this.projectRoot, 'node_modules'),
      path.join(this.projectRoot, 'package-lock.json'),
      
      // Caché de Expo
      path.join(this.projectRoot, '.expo'),
      
      // Build de Android
      path.join(this.androidDir, 'build'),
      path.join(this.androidDir, 'app', 'build'),
      path.join(this.androidDir, '.gradle'),
      
      // Archivos temporales
      path.join(this.projectRoot, 'temp_icons'),
      path.join(this.projectRoot, 'android_icons_backup')
    ];
    
    for (const cleanPath of pathsToClean) {
      if (fs.existsSync(cleanPath)) {
        try {
          console.log(`   🗑️  Limpiando: ${path.basename(cleanPath)}`);
          fs.rmSync(cleanPath, { recursive: true, force: true });
          console.log(`   ✅ ${path.basename(cleanPath)} eliminado`);
        } catch (error) {
          console.log(`   ⚠️  No se pudo limpiar ${path.basename(cleanPath)}: ${error.message}`);
        }
      }
    }
    
    // Limpiar caché global de Gradle
    try {
      console.log('   🧽 Limpiando caché global de Gradle...');
      const gradleHome = process.env.GRADLE_HOME || path.join(process.env.USERPROFILE || process.env.HOME, '.gradle');
      if (fs.existsSync(gradleHome)) {
        const cachePath = path.join(gradleHome, 'caches');
        if (fs.existsSync(cachePath)) {
          fs.rmSync(cachePath, { recursive: true, force: true });
          console.log('   ✅ Caché de Gradle eliminado');
        }
      }
    } catch (error) {
      console.log('   ⚠️  No se pudo limpiar caché de Gradle:', error.message);
    }
    
    console.log('');
  }

  async fixConfigurations() {
    console.log('🔧 ARREGLANDO CONFIGURACIONES...\n');
    
    // Arreglar gradle.properties
    this.fixGradleProperties();
    
    // Arreglar local.properties
    this.fixLocalProperties();
    
    // Arreglar build.gradle
    this.fixBuildGradle();
    
    console.log('');
  }

  fixGradleProperties() {
    const gradlePropsPath = path.join(this.androidDir, 'gradle.properties');
    
    if (fs.existsSync(gradlePropsPath)) {
      console.log('   📝 Actualizando gradle.properties...');
      
      let props = fs.readFileSync(gradlePropsPath, 'utf8');
      
      // Configuraciones críticas para evitar errores
      const criticalSettings = [
        '# Configuraciones para evitar errores comunes',
        'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError',
        'org.gradle.daemon=true',
        'org.gradle.parallel=true',
        'org.gradle.configureondemand=false',
        'android.useAndroidX=true',
        'android.enableJetifier=true',
        'android.suppressUnsupportedCompileSdk=34',
        'android.enableR8.fullMode=false',
        'android.enableDexingArtifactTransform=false',
        'org.gradle.unsafe.configuration-cache=false'
      ];
      
      // Eliminar configuraciones problemáticas
      props = props.replace(/org\.gradle\.unsafe\.configuration-cache=true/g, 'org.gradle.unsafe.configuration-cache=false');
      props = props.replace(/android\.enableR8\.fullMode=true/g, 'android.enableR8.fullMode=false');
      
      // Agregar configuraciones críticas si no existen
      criticalSettings.forEach(setting => {
        const key = setting.split('=')[0];
        if (!props.includes(key) && !setting.startsWith('#')) {
          props += '\\n' + setting;
        }
      });
      
      fs.writeFileSync(gradlePropsPath, props);
      console.log('   ✅ gradle.properties actualizado');
    }
  }

  fixLocalProperties() {
    const localPropsPath = path.join(this.androidDir, 'local.properties');
    
    console.log('   📝 Verificando local.properties...');
    
    // Buscar Android SDK
    const possibleSdkPaths = [
      path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk'),
      path.join(process.env.ANDROID_HOME || ''),
      path.join(process.env.ANDROID_SDK_ROOT || ''),
      'C:\\\\Android\\\\Sdk'
    ];
    
    let sdkPath = '';
    for (const possiblePath of possibleSdkPaths) {
      if (possiblePath && fs.existsSync(possiblePath)) {
        sdkPath = possiblePath;
        break;
      }
    }
    
    if (sdkPath) {
      const content = `sdk.dir=${sdkPath.replace(/\\\\/g, '\\\\\\\\')}\\n`;
      fs.writeFileSync(localPropsPath, content);
      console.log(`   ✅ local.properties creado con SDK: ${sdkPath}`);
    } else {
      const content = '# Android SDK no encontrado automáticamente\\n# Configura manualmente después de instalar Android Studio\\n';
      fs.writeFileSync(localPropsPath, content);
      console.log('   ⚠️  Android SDK no encontrado, archivo creado vacío');
    }
  }

  fixBuildGradle() {
    const buildGradlePath = path.join(this.androidDir, 'build.gradle');
    
    if (fs.existsSync(buildGradlePath)) {
      console.log('   📝 Verificando build.gradle...');
      
      let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
      
      // Asegurar repositorios necesarios
      if (!buildGradle.includes('maven { url "https://maven.google.com" }')) {
        buildGradle = buildGradle.replace(
          'repositories {',
          'repositories {\\n        maven { url "https://maven.google.com" }'
        );
      }
      
      fs.writeFileSync(buildGradlePath, buildGradle);
      console.log('   ✅ build.gradle verificado');
    }
  }

  async fixDependencies() {
    console.log('📦 ARREGLANDO DEPENDENCIAS...\n');
    
    try {
      console.log('   📥 Reinstalando node_modules...');
      execSync('npm install', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      console.log('   ✅ Dependencias instaladas');
    } catch (error) {
      console.log('   ❌ Error instalando dependencias:', error.message);
    }
    
    console.log('');
  }

  generateSolutionCommands() {
    console.log('🚀 COMANDOS DE SOLUCIÓN RECOMENDADOS:\n');
    console.log('=' .repeat(60));
    
    console.log('💡 OPCIÓN 1: EAS Build (Más confiable)');
    console.log('npx eas build --platform android --profile production --clear-cache');
    console.log('');
    
    console.log('💡 OPCIÓN 2: Si tienes Android Studio instalado');
    console.log('npx expo run:android --device');
    console.log('');
    
    console.log('💡 OPCIÓN 3: Gradle directo (Solo como último recurso)');
    console.log('cd android');
    console.log('.\\\\gradlew clean');
    console.log('.\\\\gradlew assembleDebug');
    console.log('');
    
    console.log('⚠️  SI AÚN HAY ERRORES:');
    console.log('=' .repeat(40));
    console.log('1. 🔥 Instala Java 17 LTS desde: https://adoptium.net/');
    console.log('2. 🤖 Instala Android Studio completo');
    console.log('3. 🔄 Reinicia el sistema después de instalar Java');
    console.log('4. 🧹 Ejecuta este script nuevamente');
    console.log('5. 📞 Si persiste, usa EAS Build (opción 1)');
    console.log('');
    
    console.log('🎯 ERRORES COMUNES Y SOLUCIONES:');
    console.log('=' .repeat(40));
    console.log('❌ "Unsupported class file major version" → Java muy nuevo, usa Java 17');
    console.log('❌ "SDK location not found" → Instala Android Studio');
    console.log('❌ "Daemon will be stopped" → Problema de memoria, ya arreglado');
    console.log('❌ "Task failed" → Dependencias corruptas, ya limpiadas');
    console.log('');
    
    console.log('✅ CONFIGURACIONES APLICADAS:');
    console.log('- Memoria aumentada a 4GB');
    console.log('- R8 deshabilitado (causa problemas)');
    console.log('- Configuration cache deshabilitado');
    console.log('- Dexing artifact transform deshabilitado');
    console.log('- Caché completamente limpiado');
  }
}

async function main() {
  const solver = new GradleErrorSolver();
  try {
    await solver.solveBuildError();
    console.log('\\n🎉 PROCESO COMPLETADO');
    console.log('Prueba ahora con: npx eas build --platform android --profile production --clear-cache');
  } catch (error) {
    console.error('\\n❌ ERROR:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = GradleErrorSolver;