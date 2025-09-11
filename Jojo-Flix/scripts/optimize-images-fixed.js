const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/images');
const OUTPUT_DIR = path.join(__dirname, '../assets/optimized');

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  // Imágenes de banner (grandes)
  banner: {
    width: 1200,
    height: 675,
    quality: 80,
    format: 'webp'
  },
  // Pósters verticales
  poster: {
    width: 400,
    height: 600,
    quality: 85,
    format: 'webp'
  },
  // Logos
  logo: {
    width: 300,
    height: 150,
    quality: 90,
    format: 'png'
  },
  // Imágenes pequeñas/iconos
  icon: {
    width: 200,
    height: 200,
    quality: 95,
    format: 'png'
  }
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log('Created directory: ' + dirPath);
  }
}

function getImageType(filename) {
  const name = filename.toLowerCase();
  
  if (name.includes('banner') || name.includes('bg')) {
    return 'banner';
  } else if (name.includes('logo')) {
    return 'logo';
  } else if (name.includes('icon') || name.includes('adaptive')) {
    return 'icon';
  } else {
    return 'poster'; // Default para pósters verticales
  }
}

async function optimizeImage(inputPath, outputPath, config) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log('Processing: ' + path.basename(inputPath) + ' (' + metadata.width + 'x' + metadata.height + ')');
    
    let pipeline = image.resize(config.width, config.height, {
      fit: 'cover',
      position: 'center'
    });
    
    if (config.format === 'webp') {
      pipeline = pipeline.webp({ quality: config.quality });
    } else if (config.format === 'png') {
      pipeline = pipeline.png({ quality: config.quality, compressionLevel: 6 });
    } else if (config.format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: config.quality });
    }
    
    await pipeline.toFile(outputPath);
    
    // Obtener tamaños de archivo
    const originalStats = await fs.stat(inputPath);
    const optimizedStats = await fs.stat(outputPath);
    const reduction = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1);
    
    console.log('  Original: ' + (originalStats.size / 1024 / 1024).toFixed(2) + 'MB');
    console.log('  Optimized: ' + (optimizedStats.size / 1024 / 1024).toFixed(2) + 'MB');
    console.log('  Reduction: ' + reduction + '%');
    
    return {
      original: originalStats.size,
      optimized: optimizedStats.size,
      reduction: parseFloat(reduction)
    };
  } catch (error) {
    console.error('Error processing ' + inputPath + ':', error.message);
    return null;
  }
}

async function processAllImages() {
  console.log('🖼️  Starting image optimization...\n');
  
  try {
    await ensureDirectoryExists(OUTPUT_DIR);
    
    const files = await fs.readdir(ASSETS_DIR);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|webp)$/i.test(file) && 
      !file.startsWith('.')
    );
    
    console.log('Found ' + imageFiles.length + ' images to optimize\n');
    
    let totalOriginal = 0;
    let totalOptimized = 0;
    let processedCount = 0;
    
    for (const file of imageFiles) {
      const inputPath = path.join(ASSETS_DIR, file);
      const imageType = getImageType(file);
      const config = OPTIMIZATION_CONFIG[imageType];
      
      // Generar nombre de salida con formato correcto
      const nameWithoutExt = path.parse(file).name;
      const outputFile = nameWithoutExt + '.' + config.format;
      const outputPath = path.join(OUTPUT_DIR, outputFile);
      
      console.log('[' + (processedCount + 1) + '/' + imageFiles.length + '] ' + file + ' (' + imageType + ')');
      
      const result = await optimizeImage(inputPath, outputPath, config);
      
      if (result) {
        totalOriginal += result.original;
        totalOptimized += result.optimized;
        processedCount++;
      }
      
      console.log(''); // Línea en blanco para separar
    }
    
    // Estadísticas finales
    const totalReduction = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
    
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('========================');
    console.log('Images processed: ' + processedCount + '/' + imageFiles.length);
    console.log('Total original size: ' + (totalOriginal / 1024 / 1024).toFixed(2) + 'MB');
    console.log('Total optimized size: ' + (totalOptimized / 1024 / 1024).toFixed(2) + 'MB');
    console.log('Total size reduction: ' + ((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2) + 'MB (' + totalReduction + '%)');
    
    // Generar mapping para actualizar el código
    console.log('\n📝 MAPPING FOR CODE UPDATE');
    console.log('============================');
    
    const mappingPath = path.join(__dirname, '../image-mapping.json');
    const mapping = {};
    
    for (const file of imageFiles) {
      const imageType = getImageType(file);
      const config = OPTIMIZATION_CONFIG[imageType];
      const nameWithoutExt = path.parse(file).name;
      const optimizedFile = nameWithoutExt + '.' + config.format;
      
      mapping[file] = 'optimized/' + optimizedFile;
    }
    
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
    console.log('Mapping saved to: ' + mappingPath);
    
  } catch (error) {
    console.error('Error during optimization:', error);
  }
}

// Verificar si sharp está instalado
async function checkDependencies() {
  try {
    require('sharp');
    return true;
  } catch (error) {
    console.error('❌ Sharp is not installed. Please run:');
    console.error('npm install --save-dev sharp');
    return false;
  }
}

// Ejecutar el script
async function main() {
  const hasSharp = await checkDependencies();
  if (hasSharp) {
    await processAllImages();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  processAllImages,
  OPTIMIZATION_CONFIG
};
