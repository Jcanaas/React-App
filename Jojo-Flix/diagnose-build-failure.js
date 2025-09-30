#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class EASBuildDiagnostic {
  constructor() {
    this.projectRoot = __dirname;
    this.buildUrl = 'https://expo.dev/accounts/jcanas/projects/Jojo-Flix/builds/60c6f53d-eac9-4903-807e-f9cc417e66f5';
  }

  async diagnoseFailure() {
    console.log('🔍 DIAGNÓSTICO AVANZADO DE EAS BUILD FAILURE\n');
    console.log('=' .repeat(70));
    
    // Paso 1: Verificar configuración actual
    await this.checkCurrentConfiguration();
    
    // Paso 2: Analizar el error específico
    await this.analyzeSpecificError();
    
    // Paso 3: Crear configuración de emergencia
    await this.createEmergencyConfiguration();
    
    // Paso 4: Proponer soluciones específicas
    this.proposeSolutions();
  }

  async checkCurrentConfiguration() {
    console.log('🔧 VERIFICANDO CONFIGURACIÓN ACTUAL...\n');
    
    // Verificar app.json
    const appJsonPath = path.join(this.projectRoot, 'app.json');
    if (fs.existsSync(appJsonPath)) {
      try {
        const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
        console.log('📱 App Config:');
        console.log(`   - Name: ${appJson.expo?.name || 'No definido'}`);
        console.log(`   - Slug: ${appJson.expo?.slug || 'No definido'}`);
        console.log(`   - SDK Version: ${appJson.expo?.sdkVersion || 'No definido'}`);
        console.log(`   - Platform Version: ${appJson.expo?.platforms?.join(', ') || 'No definido'}`);
        
        if (appJson.expo?.android) {
          console.log('🤖 Android Config:');
          console.log(`   - Package: ${appJson.expo.android.package || 'No definido'}`);
          console.log(`   - Version Code: ${appJson.expo.android.versionCode || 'No definido'}`);
        }
      } catch (error) {
        console.log('❌ Error leyendo app.json:', error.message);
      }
    }
    
    // Verificar package.json
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log('\\n📦 Package Info:');
        console.log(`   - Expo SDK: ${packageJson.dependencies?.expo || 'No definido'}`);
        console.log(`   - React Native: ${packageJson.dependencies?.['react-native'] || 'No definido'}`);
        console.log(`   - EAS CLI: ${packageJson.devDependencies?.['@expo/cli'] || 'Global'}`);
      } catch (error) {
        console.log('❌ Error leyendo package.json:', error.message);
      }
    }
    
    console.log('');
  }

  async analyzeSpecificError() {
    console.log('🚨 ANÁLISIS DEL ERROR ESPECÍFICO...\n');
    
    console.log('📋 ERROR REPORTADO:');
    console.log('   "Gradle build failed with unknown error"');
    console.log('   Build ID: 60c6f53d-eac9-4903-807e-f9cc417e66f5');
    console.log('');
    
    console.log('🎯 CAUSAS MÁS PROBABLES (basado en investigación):');
    console.log('');
    
    console.log('1. 🔥 JAVA VERSION INCOMPATIBILITY (MÁS PROBABLE)');
    console.log('   - EAS usa Java 17, pero detectaste Java 18 localmente');
    console.log('   - Esto puede causar conflictos en dependency resolution');
    console.log('   - Solución: Forzar configuración de Java en build');
    console.log('');
    
    console.log('2. 📱 ANDROID TARGET SDK MISMATCH');
    console.log('   - Expo SDK 53+ requiere Android API 34+');
    console.log('   - Configuraciones legacy pueden causar conflictos');
    console.log('   - Solución: Actualizar android/build.gradle');
    console.log('');
    
    console.log('3. 🎨 RECURSOS ANDROID CORRUPTOS');
    console.log('   - Los nuevos iconos pueden tener formato incorrecto');
    console.log('   - Gradle no puede procesar ciertos recursos');
    console.log('   - Solución: Verificar format de iconos y resources');
    console.log('');
    
    console.log('4. 🔒 MEMORY/TIMEOUT ISSUES');
    console.log('   - Build demasiado grande o complejo');
    console.log('   - EAS build runner se queda sin memoria');
    console.log('   - Solución: Optimizar build size y configuraciones');
    console.log('');
  }

  async createEmergencyConfiguration() {
    console.log('🚑 CREANDO CONFIGURACIÓN DE EMERGENCIA...\n');
    
    // Crear eas.json optimizado
    const optimizedEasConfig = {
      "cli": {
        "version": ">= 16.8.0",
        "appVersionSource": "remote"
      },
      "build": {
        "development": {
          "developmentClient": true,
          "distribution": "internal",
          "android": {
            "image": "default",
            "resourceClass": "medium"
          }
        },
        "preview": {
          "android": {
            "buildType": "apk",
            "image": "default",
            "resourceClass": "medium"
          },
          "distribution": "internal"
        },
        "production": {
          "android": {
            "buildType": "apk",
            "autoIncrement": true,
            "image": "default",
            "resourceClass": "large"
          }
        },
        "emergency": {
          "android": {
            "buildType": "apk",
            "image": "default",
            "resourceClass": "large",
            "env": {
              "GRADLE_OPTS": "-Xmx4096m -XX:MaxMetaspaceSize=512m",
              "JAVA_OPTS": "-Xmx4096m"
            },
            "config": "emergency-build.json"
          },
          "distribution": "internal"
        }
      },
      "submit": {
        "production": {}
      }
    };
    
    const easJsonPath = path.join(this.projectRoot, 'eas-emergency.json');
    fs.writeFileSync(easJsonPath, JSON.stringify(optimizedEasConfig, null, 2));
    console.log('✅ eas-emergency.json creado con configuración optimizada');
    
    // Crear configuración de build de emergencia
    const emergencyBuildConfig = {
      "expo": {
        "android": {
          "compileSdkVersion": 34,
          "targetSdkVersion": 34,
          "buildToolsVersion": "34.0.0"
        }
      }
    };
    
    const emergencyConfigPath = path.join(this.projectRoot, 'emergency-build.json');
    fs.writeFileSync(emergencyConfigPath, JSON.stringify(emergencyBuildConfig, null, 2));
    console.log('✅ emergency-build.json creado');
    
    // Crear gradle.properties de emergencia
    const emergencyGradleProps = `
# CONFIGURACIÓN DE EMERGENCIA PARA EAS BUILD
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.daemon=true
org.gradle.parallel=false
org.gradle.configureondemand=false

# Android
android.useAndroidX=true
android.enableJetifier=true
android.compileSdkVersion=34
android.targetSdkVersion=34
android.buildToolsVersion=34.0.0

# Optimizaciones
android.enableR8=false
android.enableR8.fullMode=false
android.enableDexingArtifactTransform=false
android.suppressUnsupportedCompileSdk=34

# Desactivar características problemáticas
org.gradle.unsafe.configuration-cache=false
org.gradle.configuration-cache=false
`.trim();
    
    const androidDir = path.join(this.projectRoot, 'android');
    if (fs.existsSync(androidDir)) {
      const emergencyGradlePropsPath = path.join(androidDir, 'gradle-emergency.properties');
      fs.writeFileSync(emergencyGradlePropsPath, emergencyGradleProps);
      console.log('✅ gradle-emergency.properties creado');
    }
    
    console.log('');
  }

  proposeSolutions() {
    console.log('🚀 PLAN DE SOLUCIÓN PASO A PASO...\n');
    console.log('=' .repeat(70));
    
    console.log('🥇 SOLUCIÓN #1: BUILD DE EMERGENCIA (RECOMENDADO)');
    console.log('');
    console.log('# Copiar configuración de emergencia');
    console.log('cp eas-emergency.json eas.json');
    console.log('');
    console.log('# Build con configuración optimizada');
    console.log('npx eas build --platform android --profile emergency --clear-cache');
    console.log('');
    console.log('✅ Esta configuración:');
    console.log('   - Usa resource class "large" (más memoria)');
    console.log('   - Desactiva optimizaciones problemáticas');
    console.log('   - Configura variables de entorno específicas');
    console.log('');
    
    console.log('🥈 SOLUCIÓN #2: BUILD MÍNIMO');
    console.log('');
    console.log('# Crear build básico sin optimizaciones');
    console.log('npx eas build --platform android --profile development --clear-cache');
    console.log('');
    console.log('✅ Esta opción es más básica pero más estable');
    console.log('');
    
    console.log('🥉 SOLUCIÓN #3: DIAGNÓSTICO DETALLADO');
    console.log('');
    console.log('# Ver logs completos del build fallado');
    console.log('npx eas build:list');
    console.log('npx eas build:view 60c6f53d-eac9-4903-807e-f9cc417e66f5');
    console.log('');
    console.log('✅ Esto te dará los logs exactos del error');
    console.log('');
    
    console.log('🔧 SOLUCIÓN #4: LIMPIAR Y RECONFIGURAR');
    console.log('');
    console.log('# Limpiar configuración completamente');
    console.log('npx eas build:configure');
    console.log('npx eas build --platform android --profile production --clear-cache');
    console.log('');
    
    console.log('⚡ SOLUCIÓN RÁPIDA DE EMERGENCIA:');
    console.log('=' .repeat(50));
    console.log('Si necesitas el APK urgentemente:');
    console.log('');
    console.log('1. npx expo export --platform android');
    console.log('2. Usar Android Studio para build manual');
    console.log('3. O usar service como AppCenter/Bitrise');
    console.log('');
    
    console.log('🎯 MI RECOMENDACIÓN:');
    console.log('=' .repeat(30));
    console.log('1. 🚀 Prueba SOLUCIÓN #1 (build de emergencia)');
    console.log('2. 📋 Si falla, usa SOLUCIÓN #3 (ver logs)');
    console.log('3. 🔄 Como último recurso, SOLUCIÓN #4 (reconfigurar)');
    console.log('');
    console.log('⏰ Tiempo estimado: 10-15 minutos por intento');
  }
}

async function main() {
  const diagnostic = new EASBuildDiagnostic();
  try {
    await diagnostic.diagnoseFailure();
    console.log('\\n🎯 SIGUIENTE PASO RECOMENDADO:');
    console.log('cp eas-emergency.json eas.json && npx eas build --platform android --profile emergency --clear-cache');
  } catch (error) {
    console.error('\\n❌ ERROR EN DIAGNÓSTICO:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = EASBuildDiagnostic;