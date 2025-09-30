const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GradleFixer {
  constructor() {
    this.projectRoot = __dirname;
    this.androidDir = path.join(this.projectRoot, 'android');
  }

  async diagnoseAndFix() {
    console.log('🔧 DIAGNÓSTICO Y REPARACIÓN DE GRADLE\n');
    console.log('=' .repeat(50));
    
    // 1. Verificar Java
    this.checkJavaVersion();
    
    // 2. Limpiar cachés
    await this.cleanCaches();
    
    // 3. Verificar configuración
    this.checkGradleConfig();
    
    // 4. Arreglar problemas comunes
    this.fixCommonIssues();
    
    // 5. Generar comandos de build
    this.generateBuildCommands();
  }

  checkJavaVersion() {
    console.log('☕ Verificando versión de Java...');
    try {
      const javaVersion = execSync('java -version', { encoding: 'utf8', stdio: 'pipe' });
      console.log('✅ Java encontrado');
      
      if (javaVersion.includes('18.') || javaVersion.includes('19.') || javaVersion.includes('20.')) {
        console.log('⚠️  ADVERTENCIA: Java 18+ puede causar problemas con Gradle');
        console.log('   Recomendación: Usa Java 11 o Java 17 LTS');
        this.suggestJavaFix();
      }
    } catch (error) {
      console.log('❌ Java no encontrado o problema de configuración');
    }
    console.log('');
  }

  suggestJavaFix() {
    console.log('💡 SOLUCIÓN PARA JAVA:');
    console.log('1. Instalar Java 17 LTS desde: https://adoptium.net/');
    console.log('2. O usar SDKMAN: sdk install java 17.0.7-tem');
    console.log('3. Configurar JAVA_HOME en variables de entorno');
    console.log('');
  }

  async cleanCaches() {
    console.log('🧹 Limpiando cachés...');
    
    const cachesToClean = [
      path.join(this.androidDir, 'build'),
      path.join(this.androidDir, 'app', 'build'),
      path.join(this.projectRoot, 'node_modules'),
      path.join(this.projectRoot, '.expo')
    ];
    
    for (const cache of cachesToClean) {
      if (fs.existsSync(cache)) {
        console.log(`   🗑️  Limpiando: ${path.basename(cache)}`);
        try {
          fs.rmSync(cache, { recursive: true, force: true });
          console.log(`   ✅ ${path.basename(cache)} limpiado`);
        } catch (error) {
          console.log(`   ⚠️  No se pudo limpiar ${path.basename(cache)}: ${error.message}`);
        }
      }
    }
    console.log('');
  }

  checkGradleConfig() {
    console.log('⚙️  Verificando configuración de Gradle...');
    
    const gradlePropsPath = path.join(this.androidDir, 'gradle.properties');
    if (fs.existsSync(gradlePropsPath)) {
      console.log('✅ gradle.properties encontrado');
      
      let props = fs.readFileSync(gradlePropsPath, 'utf8');
      
      // Verificar configuraciones importantes
      const checks = [
        { key: 'org.gradle.jvmargs', required: '-Xmx2048m', description: 'Memoria JVM' },
        { key: 'android.useAndroidX', required: 'true', description: 'AndroidX' },
        { key: 'newArchEnabled', required: 'true', description: 'Nueva arquitectura' },
        { key: 'hermesEnabled', required: 'true', description: 'Hermes JS' }
      ];
      
      checks.forEach(check => {
        if (props.includes(check.key)) {
          console.log(`   ✅ ${check.description}: Configurado`);
        } else {
          console.log(`   ⚠️  ${check.description}: No encontrado`);
        }
      });
    } else {
      console.log('❌ gradle.properties no encontrado');
    }
    console.log('');
  }

  fixCommonIssues() {
    console.log('🔨 Aplicando arreglos comunes...');
    
    // 1. Crear local.properties si no existe
    this.createLocalProperties();
    
    // 2. Agregar configuraciones de compatibilidad
    this.addCompatibilitySettings();
    
    console.log('✅ Arreglos aplicados');
    console.log('');
  }

  createLocalProperties() {
    const localPropsPath = path.join(this.androidDir, 'local.properties');
    
    if (!fs.existsSync(localPropsPath)) {
      console.log('   📝 Creando local.properties...');
      
      // Intentar detectar Android SDK
      const possibleSdkPaths = [
        'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Android\\Sdk',
        'C:\\Android\\Sdk',
        process.env.ANDROID_HOME || '',
        process.env.ANDROID_SDK_ROOT || ''
      ];
      
      let sdkPath = '';
      for (const possiblePath of possibleSdkPaths) {
        if (possiblePath && fs.existsSync(possiblePath)) {
          sdkPath = possiblePath;
          break;
        }
      }
      
      if (sdkPath) {
        fs.writeFileSync(localPropsPath, `sdk.dir=${sdkPath.replace(/\\/g, '\\\\')}\n`);
        console.log(`   ✅ local.properties creado con SDK: ${sdkPath}`);
      } else {
        console.log('   ⚠️  No se pudo detectar Android SDK automáticamente');
        console.log('   💡 Instala Android Studio o configura ANDROID_HOME');
      }
    }
  }

  addCompatibilitySettings() {
    const gradlePropsPath = path.join(this.androidDir, 'gradle.properties');
    
    if (fs.existsSync(gradlePropsPath)) {
      let props = fs.readFileSync(gradlePropsPath, 'utf8');
      
      // Configuraciones para mejorar compatibilidad
      const compatibilitySettings = [
        '# Configuraciones de compatibilidad agregadas automáticamente',
        'org.gradle.daemon=true',
        'org.gradle.configureondemand=true',
        'org.gradle.parallel=true',
        'android.enableJetifier=true',
        'android.suppressUnsupportedCompileSdk=34'
      ];
      
      let modified = false;
      compatibilitySettings.forEach(setting => {
        if (!props.includes(setting.split('=')[0])) {
          props += '\n' + setting;
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(gradlePropsPath, props);
        console.log('   ✅ Configuraciones de compatibilidad agregadas');
      }
    }
  }

  generateBuildCommands() {
    console.log('🚀 COMANDOS RECOMENDADOS PARA BUILD:');
    console.log('=' .repeat(50));
    console.log('');
    console.log('📱 OPCIÓN 1: EAS Build (Recomendado - Servidor remoto)');
    console.log('npx eas build --platform android --profile preview --clear-cache');
    console.log('');
    console.log('🔧 OPCIÓN 2: Build Local (Si tienes Android SDK)');
    console.log('npx expo run:android --device');
    console.log('');
    console.log('🛠️  OPCIÓN 3: Gradle Directo (Solo si las otras fallan)');
    console.log('cd android');
    console.log('.\\gradlew assembleDebug');
    console.log('');
    console.log('⚠️  Si persisten los errores:');
    console.log('1. Instala Android Studio completo');
    console.log('2. Usa Java 17 LTS');
    console.log('3. Configura ANDROID_HOME correctamente');
    console.log('4. Reinicia el sistema después de cambios');
  }
}

async function main() {
  const fixer = new GradleFixer();
  try {
    await fixer.diagnoseAndFix();
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = GradleFixer;