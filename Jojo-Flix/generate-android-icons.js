const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class AndroidIconGenerator {
  constructor() {
    this.baseIcon = path.join(__dirname, 'assets', 'images', 'icon.png');
    this.androidResPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
    
    // Definir las dimensiones para cada densidad de Android
    this.densityMap = {
      'mipmap-mdpi': { size: 48, description: 'Medium density' },
      'mipmap-hdpi': { size: 72, description: 'High density' },
      'mipmap-xhdpi': { size: 96, description: 'Extra high density' },
      'mipmap-xxhdpi': { size: 144, description: 'Extra extra high density' },
      'mipmap-xxxhdpi': { size: 192, description: 'Extra extra extra high density' }
    };
  }

  async generateAndroidIcons() {
    console.log('🤖 GENERADOR DE ICONOS ANDROID - JOJO-FLIX\n');
    console.log('=' .repeat(50));
    
    // Verificar que el icono base existe
    if (!fs.existsSync(this.baseIcon)) {
      throw new Error(`❌ Icono base no encontrado: ${this.baseIcon}`);
    }
    
    console.log(`✅ Icono base encontrado: ${this.baseIcon}`);
    console.log('');
    
    // Crear backup de iconos existentes
    await this.backupExistingIcons();
    
    // Generar iconos para cada densidad
    for (const [folder, config] of Object.entries(this.densityMap)) {
      await this.generateIconsForDensity(folder, config);
    }
    
    // Generar icono adaptativo si es necesario
    await this.generateAdaptiveIcons();
    
    console.log('\n🎉 ICONOS ANDROID GENERADOS EXITOSAMENTE');
    console.log('=' .repeat(50));
    console.log('');
    console.log('🚀 Para aplicar los cambios:');
    console.log('1. cd android && .\\gradlew clean');
    console.log('2. cd ..');
    console.log('3. npx expo run:android');
    console.log('');
    console.log('O para EAS Build:');
    console.log('eas build --platform android --profile preview --clear-cache');
  }

  async backupExistingIcons() {
    console.log('📦 Creando backup de iconos existentes...');
    
    const backupDir = path.join(__dirname, 'android_icons_backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    for (const folder of Object.keys(this.densityMap)) {
      const sourcePath = path.join(this.androidResPath, folder);
      const backupPath = path.join(backupDir, folder);
      
      if (fs.existsSync(sourcePath)) {
        if (!fs.existsSync(backupPath)) {
          fs.mkdirSync(backupPath);
        }
        
        // Copiar archivos existentes
        const files = fs.readdirSync(sourcePath);
        files.forEach(file => {
          if (file.startsWith('ic_launcher')) {
            fs.copyFileSync(
              path.join(sourcePath, file),
              path.join(backupPath, file)
            );
          }
        });
      }
    }
    
    console.log(`✅ Backup creado en: ${backupDir}`);
  }

  async generateIconsForDensity(folder, config) {
    const folderPath = path.join(this.androidResPath, folder);
    const { size, description } = config;
    
    console.log(`🎨 Generando ${folder} (${size}x${size}) - ${description}`);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Generar ic_launcher.webp (formato preferido por Android)
    const webpPath = path.join(folderPath, 'ic_launcher.webp');
    await sharp(this.baseIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: 100 })
      .toFile(webpPath);
    
    // También generar .png como fallback
    const pngPath = path.join(folderPath, 'ic_launcher.png');
    await sharp(this.baseIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(pngPath);
    
    // Generar ic_launcher_round.webp (para dispositivos que lo soporten)
    const roundWebpPath = path.join(folderPath, 'ic_launcher_round.webp');
    await sharp(this.baseIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: 100 })
      .toFile(roundWebpPath);
    
    console.log(`   ✅ ${folder}: ic_launcher.webp, ic_launcher.png, ic_launcher_round.webp`);
  }

  async generateAdaptiveIcons() {
    console.log('🎯 Generando iconos adaptativos...');
    
    const adaptivePath = path.join(this.androidResPath, 'mipmap-anydpi-v26');
    
    if (!fs.existsSync(adaptivePath)) {
      fs.mkdirSync(adaptivePath, { recursive: true });
    }
    
    // Generar ic_launcher_foreground.webp para todas las densidades
    for (const [folder, config] of Object.entries(this.densityMap)) {
      const folderPath = path.join(this.androidResPath, folder);
      const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.webp');
      
      await sharp(this.baseIcon)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 100 })
        .toFile(foregroundPath);
    }
    
    console.log('   ✅ Iconos adaptativos generados');
  }

  async verifyGeneration() {
    console.log('\n🔍 VERIFICANDO ICONOS GENERADOS...');
    console.log('=' .repeat(50));
    
    let allGood = true;
    
    for (const [folder, config] of Object.entries(this.densityMap)) {
      const folderPath = path.join(this.androidResPath, folder);
      const webpFile = path.join(folderPath, 'ic_launcher.webp');
      const pngFile = path.join(folderPath, 'ic_launcher.png');
      
      if (fs.existsSync(webpFile) && fs.existsSync(pngFile)) {
        console.log(`✅ ${folder}: Iconos generados correctamente`);
      } else {
        console.log(`❌ ${folder}: Faltan archivos`);
        allGood = false;
      }
    }
    
    return allGood;
  }
}

async function main() {
  const generator = new AndroidIconGenerator();
  
  try {
    await generator.generateAndroidIcons();
    const verified = await generator.verifyGeneration();
    
    if (verified) {
      console.log('\n🎉 TODOS LOS ICONOS ANDROID LISTOS');
      console.log('El icono del acceso directo debería verse perfecto ahora');
    } else {
      console.log('\n⚠️  Algunos iconos no se generaron correctamente');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n💡 SOLUCIÓN:');
    console.log('1. Asegúrate de que Sharp esté instalado: npm install sharp');
    console.log('2. Verifica que assets/images/icon.png exista');
    console.log('3. Ejecuta desde la carpeta raíz del proyecto');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = AndroidIconGenerator;