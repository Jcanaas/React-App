
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
```bash
expo r -c
eas build --platform android --profile preview --clear-cache
```
