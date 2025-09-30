const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class IconVerifier {
  constructor() {
    this.assetsDir = path.join(__dirname, 'assets', 'images');
    this.appJsonPath = path.join(__dirname, 'app.json');
    this.requiredIcons = {
      'icon.png': { width: 1024, height: 1024, description: 'Icono principal' },
      'adaptive-icon.png': { width: 1024, height: 1024, description: 'Icono adaptativo Android' },
      'favicon.png': { width: 512, height: 512, description: 'Favicon web' },
      'splash-icon.png': { width: 400, height: 400, description: 'Icono splash screen' }
    };
  }

  async verifyIcons() {
    console.log('🔍 VERIFICANDO ICONOS...\n');
    
    const results = {
      valid: [],
      invalid: [],
      missing: []
    };

    for (const [filename, specs] of Object.entries(this.requiredIcons)) {
      const filePath = path.join(this.assetsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        results.missing.push({ filename, specs });
        console.log(`❌ ${filename}: FALTA`);
        continue;
      }

      try {
        const metadata = await sharp(filePath).metadata();
        const isValid = metadata.width === specs.width && metadata.height === specs.height;
        
        if (isValid) {
          results.valid.push({ filename, specs, metadata });
          console.log(`✅ ${filename}: ${metadata.width}x${metadata.height} - CORRECTO`);
        } else {
          results.invalid.push({ filename, specs, metadata });
          console.log(`⚠️  ${filename}: ${metadata.width}x${metadata.height} - DEBE SER ${specs.width}x${specs.height}`);
        }
      } catch (error) {
        results.invalid.push({ filename, specs, error: error.message });
        console.log(`❌ ${filename}: ERROR - ${error.message}`);
      }
    }

    return results;
  }

  async fixIcons() {
    console.log('\n🔧 ARREGLANDO ICONOS...\n');
    
    const baseIconPath = path.join(this.assetsDir, 'icon.png');
    
    if (!fs.existsSync(baseIconPath)) {
      throw new Error('❌ No se encontró el icono base (icon.png)');
    }

    // Crear directorio temporal
    const tempDir = path.join(__dirname, 'temp_icon_fix');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    try {
      // Generar todos los iconos desde el icono base
      for (const [filename, specs] of Object.entries(this.requiredIcons)) {
        console.log(`🎨 Generando ${filename} (${specs.width}x${specs.height})...`);
        
        const outputPath = path.join(tempDir, filename);
        await sharp(baseIconPath)
          .resize(specs.width, specs.height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({ quality: 100, compressionLevel: 9 })
          .toFile(outputPath);

        // Copiar al directorio final
        fs.copyFileSync(outputPath, path.join(this.assetsDir, filename));
        console.log(`✅ ${filename} generado correctamente`);
      }

      // Limpiar directorio temporal
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      console.log('\n🎉 TODOS LOS ICONOS GENERADOS CORRECTAMENTE');
      
    } catch (error) {
      console.error('❌ Error generando iconos:', error.message);
      throw error;
    }
  }

  verifyAppJsonConfig() {
    console.log('\n📋 VERIFICANDO CONFIGURACIÓN EN APP.JSON...\n');
    
    if (!fs.existsSync(this.appJsonPath)) {
      console.log('❌ app.json no encontrado');
      return false;
    }

    const appJson = JSON.parse(fs.readFileSync(this.appJsonPath, 'utf8'));
    const issues = [];

    // Verificar configuración principal
    if (appJson.expo.icon !== './assets/images/icon.png') {
      issues.push('Icono principal mal configurado');
    }

    // Verificar configuración Android
    const android = appJson.expo.android;
    if (!android) {
      issues.push('Configuración Android faltante');
    } else {
      if (android.icon !== './assets/images/icon.png') {
        issues.push('Icono Android mal configurado');
      }
      if (!android.adaptiveIcon || android.adaptiveIcon.foregroundImage !== './assets/images/icon.png') {
        issues.push('Icono adaptativo mal configurado');
      }
    }

    // Verificar configuración Web
    const web = appJson.expo.web;
    if (!web || web.favicon !== './assets/images/favicon.png') {
      issues.push('Favicon mal configurado');
    }

    if (issues.length === 0) {
      console.log('✅ Configuración en app.json CORRECTA');
      return true;
    } else {
      console.log('⚠️  PROBLEMAS EN CONFIGURACIÓN:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      return false;
    }
  }

  async generateReport() {
    console.log('\n📊 GENERANDO REPORTE COMPLETO...\n');
    
    const verification = await this.verifyIcons();
    const configOk = this.verifyAppJsonConfig();
    
    const report = `# 🔍 Reporte de Verificación de Iconos - ${new Date().toLocaleString()}

## 📊 Resumen General
- ✅ Iconos válidos: ${verification.valid.length}
- ⚠️  Iconos inválidos: ${verification.invalid.length}
- ❌ Iconos faltantes: ${verification.missing.length}
- 📋 Configuración app.json: ${configOk ? '✅ CORRECTA' : '❌ PROBLEMAS'}

## 📁 Detalles de Verificación

### ✅ Iconos Correctos (${verification.valid.length})
${verification.valid.map(item => 
  `- **${item.filename}**: ${item.metadata.width}x${item.metadata.height} - ${item.specs.description}`
).join('\n')}

### ⚠️ Iconos con Problemas (${verification.invalid.length})
${verification.invalid.map(item => 
  `- **${item.filename}**: ${item.metadata ? `${item.metadata.width}x${item.metadata.height}` : 'ERROR'} - Debe ser ${item.specs.width}x${item.specs.height}`
).join('\n')}

### ❌ Iconos Faltantes (${verification.missing.length})
${verification.missing.map(item => 
  `- **${item.filename}**: ${item.specs.width}x${item.specs.height} - ${item.specs.description}`
).join('\n')}

## 🚀 Acciones Recomendadas

${verification.invalid.length > 0 || verification.missing.length > 0 ? `
### 🔧 Para arreglar automáticamente:
\`\`\`bash
node verify-and-fix-icons.js --fix
\`\`\`
` : ''}

### 📱 Para aplicar cambios en la app:
\`\`\`bash
# Limpiar caché y recompilar
expo r -c

# Build para testing
eas build --platform android --profile preview --clear-cache

# Build para producción
eas build --platform android --profile production --clear-cache
\`\`\`

## 📋 Verificación Manual
1. Revisar que todos los archivos de iconos existan en \`assets/images/\`
2. Confirmar que las dimensiones sean correctas
3. Verificar que no haya pixelación
4. Probar en diferentes dispositivos Android

---
*Reporte generado automáticamente por verify-and-fix-icons.js*
`;

    const reportPath = path.join(__dirname, 'ICON_VERIFICATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Reporte guardado en: ICON_VERIFICATION_REPORT.md`);
    
    return {
      verification,
      configOk,
      hasIssues: verification.invalid.length > 0 || verification.missing.length > 0 || !configOk
    };
  }
}

async function main() {
  const verifier = new IconVerifier();
  const shouldFix = process.argv.includes('--fix');
  
  try {
    console.log('🎨 VERIFICADOR Y REPARADOR DE ICONOS - JOJO-FLIX\n');
    console.log('=' .repeat(50));
    
    // Generar reporte inicial
    const report = await verifier.generateReport();
    
    if (shouldFix && report.hasIssues) {
      console.log('\n🔧 MODO REPARACIÓN ACTIVADO');
      console.log('=' .repeat(50));
      
      await verifier.fixIcons();
      
      // Verificar después de la reparación
      console.log('\n🔍 VERIFICACIÓN POST-REPARACIÓN');
      console.log('=' .repeat(50));
      
      await verifier.generateReport();
      
      console.log('\n🎉 PROCESO COMPLETADO');
      console.log('Para aplicar los cambios:');
      console.log('1. expo r -c');
      console.log('2. eas build --platform android --profile preview --clear-cache');
      
    } else if (report.hasIssues) {
      console.log('\n⚠️  SE ENCONTRARON PROBLEMAS');
      console.log('Para arreglar automáticamente ejecuta:');
      console.log('node verify-and-fix-icons.js --fix');
      
    } else {
      console.log('\n🎉 TODO ESTÁ CORRECTO');
      console.log('Los iconos están optimizados y listos para usar');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = IconVerifier;