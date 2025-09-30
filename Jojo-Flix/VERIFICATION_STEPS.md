# 🔍 Pasos de Verificación de Iconos - JOJO-FLIX


🔄 **PASO 1: Limpiar Caché**
```bash
expo r -c
```
*Esto limpia toda la caché de Metro bundler y Expo*

📱 **PASO 2: Build de Desarrollo (Recomendado)**
```bash
eas build --platform android --profile preview --clear-cache
```
*O para build local:*
```bash
eas build --platform android --profile preview --local --clear-cache
```

🚀 **PASO 3: Build de Producción (Opcional)**
```bash
eas build --platform android --profile production --clear-cache
```

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
   ```bash
   # Si tienes aapt instalado
   aapt dump badging your-app.apk | grep icon
   ```

2. **Verifica en Android Studio:**
   - Abre el APK en Android Studio
   - Ve a res/mipmap-* folders
   - Verifica que los iconos tengan las dimensiones correctas

⚠️  **IMPORTANTE:**
- Siempre desinstala la versión anterior antes de instalar la nueva
- Usa `--clear-cache` en todos los builds
- Si sigues viendo iconos pixelados, ejecuta `node verify-and-fix-icons.js --fix` nuevamente
