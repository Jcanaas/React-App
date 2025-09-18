# 📱 Guía Completa para Exportar APK - JojoFlix

## 🎯 Introducción
Esta guía te enseñará paso a paso cómo exportar tu aplicación **JojoFlix** a un archivo APK que puedas instalar en dispositivos Android.

---

## 🛠️ Requisitos Previos

### ✅ Software Necesario:
- **Node.js** (versión 18 o superior)
- **Expo CLI** instalado globalmente
- **EAS CLI** (Expo Application Services)
- **Cuenta de Expo** (gratuita)

### 📋 Verificar Instalaciones:
```bash
# Verificar Node.js
node --version

# Verificar Expo CLI
expo --version

# Verificar EAS CLI
eas --version
```

---

## 🚀 Preparación del Proyecto

### 1. **Instalar EAS CLI (si no lo tienes)**
```bash
npm install -g @expo/eas-cli
```

### 2. **Inicializar EAS en tu proyecto**
```bash
cd "c:\Users\jordi\Documents\GitHub\React-App\Jojo-Flix"
eas login
eas build:configure
```

### 3. **Verificar configuración del proyecto**
Asegúrate de que tu `app.json` esté configurado correctamente:

```json
{
  "expo": {
    "name": "Jojo-Flix",
    "slug": "Jojo-Flix",
    "version": "1.0.0",
    "android": {
      "package": "com.anonymous.JojoFlix",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "aab100de-d67a-45e5-a14d-7f76202b65a6"
      }
    }
  }
}
```

---

## 🔧 Configuración de Build

### 1. **Archivo `eas.json`**
Tu proyecto ya tiene configurado el archivo `eas.json`. Verifica que contenga:

```json
{
  "cli": {
    "version": ">= 13.2.3"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2. **Configuración para APK**
Para generar un APK (en lugar de AAB), usaremos el perfil `preview`:

---

## 📦 Proceso de Build

### **Build APK para Testing (Recomendado)**
```bash
# Build para testing/desarrollo con iconos optimizados
eas build --platform android --profile preview --clear-cache
```

### **Opción 2: Build de Producción (AAB)**
```bash
# Build para Google Play Store
eas build --platform android --profile production
```

### **Opción 3: Build Local (Más Rápido)**
```bash
# Build local en tu máquina (requiere Android SDK)
eas build --platform android --profile preview --local
```

---

## ⏱️ Proceso de Build

### 1. **Inicio del Build**
- El comando iniciará el proceso en los servidores de Expo
- Recibirás un enlace para monitorear el progreso
- El proceso puede tomar **10-20 minutos**

### 2. **Monitoreo**
```bash
# Ver el estado de tus builds
eas build:list
```

### 3. **Logs en Tiempo Real**
- Ve al enlace proporcionado en la terminal
- O visita: https://expo.dev/accounts/[tu-usuario]/projects/jojo-flix/builds

---

## 📲 Descarga e Instalación

### **Cuando el Build Complete:**

1. **Descargar APK**
   - Ve a la página de builds en Expo
   - Haz clic en "Download" junto a tu build
   - O usa el enlace directo proporcionado

2. **Instalar en Android**
   ```bash
   # Si tienes ADB instalado
   adb install path/to/your-app.apk
   ```

3. **Instalación Manual**
   - Transfiere el APK a tu dispositivo Android
   - Habilita "Fuentes desconocidas" en Configuración
   - Abre el APK y sigue las instrucciones

---

## 🔧 Configuraciones Avanzadas

### **Personalizar Icono y Splash Screen**
Tu `app.json` ya está configurado con iconos optimizados:
```json
{
  "icon": "./assets/images/icon.png",
  "android": {
    "icon": "./assets/images/icon.png",
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#DF2892"
    },
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#DF2892"
    }
  }
}
```

### **Optimización de Iconos (Ya Aplicada)**
Los iconos han sido optimizados con las siguientes dimensiones:
- **icon.png**: 1024x1024px (icono principal)
- **adaptive-icon.png**: 1024x1024px (icono adaptativo Android)
- **splash-icon.png**: 400x400px (pantalla de carga)
- **favicon.png**: 512x512px (web)

Si necesitas regenerar los iconos, ejecuta:
```bash
node optimize-icons.js
```

### **Versioning**
Para actualizaciones, incrementa la versión:
```json
{
  "version": "1.0.1",
  "android": {
    "versionCode": 2
  }
}
```

### **Build con Diferentes Perfiles**
```bash
# Development (incluye Expo Dev Tools)
eas build --platform android --profile development

# Preview (APK optimizado para testing)
eas build --platform android --profile preview

# Production (AAB para Google Play)
eas build --platform android --profile production
```

---

## 🐛 Solución de Problemas

### **Error: "No Android SDK found"**
```bash
# Si usas build local, instala Android Studio
# O usa build en la nube (sin --local)
eas build --platform android --profile preview
```

### **Error: "Build failed"**
1. Revisa los logs en el dashboard de Expo
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que no hay errores de TypeScript

### **Error: "Invalid package name"**
Verifica que el `package` en `app.json` sea único:
```json
{
  "android": {
    "package": "com.tudominio.jojoflix"
  }
}
```

### **Limpiar Cache**
```bash
# Limpiar cache de npm
npm cache clean --force

# Limpiar cache de Expo
expo r -c
```

---

## 📋 Checklist Pre-Build

### ✅ **Antes de hacer el build:**
- [ ] Todas las funcionalidades están testeadas
- [ ] No hay errores de TypeScript/JavaScript
- [ ] Las API keys están configuradas correctamente
- [ ] El icono y splash screen están en su lugar
- [ ] La versión está actualizada en `app.json`
- [ ] Las dependencias están actualizadas

### ✅ **Configuración Firebase:**
- [ ] Firebase está configurado correctamente
- [ ] Las reglas de Firestore están aplicadas
- [ ] La autenticación funciona
- [ ] Las notificaciones están configuradas

---

## 🚀 Comandos Rápidos

### **Build Estándar (APK)**
```bash
cd "c:\Users\jordi\Documents\GitHub\React-App\Jojo-Flix"
eas build --platform android --profile preview
```

### **Ver Status de Builds**
```bash
eas build:list
```

### **Cancelar Build en Progreso**
```bash
eas build:cancel [build-id]
```

### **Limpiar y Rebuild**
```bash
expo r -c
eas build --platform android --profile preview --clear-cache
```

---

## 📱 Testing en Dispositivos

### **APK de Testing (Preview)**
- ✅ Perfecto para pruebas internas
- ✅ Se puede instalar directamente
- ✅ No requiere Google Play Store
- ⚠️ No optimizado para producción

### **AAB de Producción**
- ✅ Optimizado para Google Play Store
- ✅ Tamaño reducido
- ❌ Requiere Google Play para distribución

---

## 🎯 Tips y Mejores Prácticas

### **1. Testing**
```bash
# Primero haz un build preview para testing
eas build --platform android --profile preview

# Si todo funciona bien, entonces build de producción
eas build --platform android --profile production
```

### **2. Versionado**
```bash
# Incrementa la versión para cada build
# version: "1.0.0" -> "1.0.1"
# versionCode: 1 -> 2
```

### **3. Performance**
```bash
# Para builds más rápidos, usa build local si tienes Android SDK
eas build --platform android --profile preview --local
```

### **4. Monitoreo**
- Siempre monitorea los builds en: https://expo.dev
- Guarda los enlaces de descarga
- Mantén un registro de versiones

---

## 📚 Recursos Adicionales

### **Documentación Oficial:**
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Builds](https://docs.expo.dev/build-reference/android-builds/)
- [App Store Deployment](https://docs.expo.dev/deploy/build-project/)

### **Troubleshooting:**
- [Common Build Errors](https://docs.expo.dev/build-reference/troubleshooting/)
- [Platform Specific Issues](https://docs.expo.dev/build-reference/android-builds/#common-issues)

---

## 🎉 ¡Felicitaciones!

Una vez que completes estos pasos, tendrás un APK funcional de **JojoFlix** que podrás:
- ✅ Instalar en cualquier dispositivo Android
- ✅ Compartir con amigos y familia
- ✅ Usar para testing antes de publicar en Google Play
- ✅ Distribuir internamente en tu organización

**¡Tu aplicación de streaming está lista para conquistar el mundo Android!** 🚀📱🎬
