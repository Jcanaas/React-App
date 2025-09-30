#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ImageUsageAnalyzer {
  constructor() {
    this.projectRoot = __dirname;
    this.results = {
      nativeImageUsage: [],
      optimizedImageUsage: [],
      totalFiles: 0,
      recommendations: []
    };
  }

  async analyzeProject() {
    console.log('🔍 ANALIZANDO USO DE IMÁGENES EN JOJO-FLIX\n');
    console.log('=' .repeat(60));
    
    await this.scanDirectory(this.projectRoot);
    this.generateReport();
  }

  async scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Saltar node_modules, .git, etc
        if (!['node_modules', '.git', '.expo', 'android', 'ios', 'build'].includes(entry.name)) {
          await this.scanDirectory(fullPath);
        }
      } else if (entry.isFile() && this.isReactFile(entry.name)) {
        await this.analyzeFile(fullPath);
      }
    }
  }

  isReactFile(fileName) {
    return /\.(tsx?|jsx?)$/.test(fileName);
  }

  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);
      
      this.results.totalFiles++;
      
      // Buscar imports de Image nativo
      const nativeImageImports = content.match(/import.*Image.*from ['"]react-native['"]/g);
      if (nativeImageImports) {
        this.results.nativeImageUsage.push({
          file: relativePath,
          imports: nativeImageImports,
          usages: this.findImageUsages(content, '<Image')
        });
      }
      
      // Buscar componentes optimizados existentes
      const optimizedUsage = {
        LazyImage: content.includes('LazyImage'),
        OptimizedImage: content.includes('OptimizedImage'),  
        ExpoImage: content.includes('expo-image')
      };
      
      if (optimizedUsage.LazyImage || optimizedUsage.OptimizedImage || optimizedUsage.ExpoImage) {
        this.results.optimizedImageUsage.push({
          file: relativePath,
          ...optimizedUsage
        });
      }
      
    } catch (error) {
      console.warn(`⚠️  Error leyendo ${filePath}:`, error.message);
    }
  }

  findImageUsages(content, pattern) {
    const lines = content.split('\n');
    const usages = [];
    
    lines.forEach((line, index) => {
      if (line.includes(pattern)) {
        usages.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });
    
    return usages;
  }

  generateReport() {
    console.log('\n📊 REPORTE DE ANÁLISIS DE IMÁGENES\n');
    console.log('=' .repeat(60));
    
    // Estadísticas generales
    console.log('📈 ESTADÍSTICAS GENERALES:');
    console.log(`   📁 Archivos analizados: ${this.results.totalFiles}`);
    console.log(`   ❌ Archivos con Image nativo: ${this.results.nativeImageUsage.length}`);
    console.log(`   ✅ Archivos con imágenes optimizadas: ${this.results.optimizedImageUsage.length}`);
    console.log('');
    
    // Uso de Image nativo (problemático)
    if (this.results.nativeImageUsage.length > 0) {
      console.log('❌ ARCHIVOS QUE USAN IMAGE NATIVO (REQUIEREN MIGRACIÓN):');
      console.log('-' .repeat(50));
      
      this.results.nativeImageUsage.forEach(file => {
        console.log(`📄 ${file.file}`);
        console.log(`   Imports: ${file.imports.length}`);
        console.log(`   Usos de <Image>: ${file.usages.length}`);
        
        if (file.usages.length > 0) {
          file.usages.slice(0, 3).forEach(usage => {
            console.log(`     Línea ${usage.line}: ${usage.content.substring(0, 80)}...`);
          });
          if (file.usages.length > 3) {
            console.log(`     ... y ${file.usages.length - 3} más`);
          }
        }
        console.log('');
      });
    }
    
    // Uso optimizado (bueno)
    if (this.results.optimizedImageUsage.length > 0) {
      console.log('✅ ARCHIVOS CON IMÁGENES OPTIMIZADAS:');
      console.log('-' .repeat(50));
      
      this.results.optimizedImageUsage.forEach(file => {
        const optimizations = [];
        if (file.LazyImage) optimizations.push('LazyImage');
        if (file.OptimizedImage) optimizations.push('OptimizedImage');
        if (file.ExpoImage) optimizations.push('expo-image');
        
        console.log(`✅ ${file.file}`);
        console.log(`   Usa: ${optimizations.join(', ')}`);
        console.log('');
      });
    }
    
    // Generar recomendaciones
    this.generateRecommendations();
    
    // Generar script de migración
    this.generateMigrationScript();
  }

  generateRecommendations() {
    console.log('🎯 RECOMENDACIONES ESPECÍFICAS:');
    console.log('-' .repeat(50));
    
    if (this.results.nativeImageUsage.length === 0) {
      console.log('🎉 ¡EXCELENTE! No se encontraron usos de Image nativo.');
      console.log('   Tu proyecto ya está bien optimizado.');
    } else {
      console.log(`⚠️  CRÍTICO: ${this.results.nativeImageUsage.length} archivos necesitan migración.`);
      console.log('');
      
      // Priorizar archivos por impacto
      const highImpactFiles = this.results.nativeImageUsage.filter(file => 
        file.file.includes('Carousel') || 
        file.file.includes('Banner') || 
        file.file.includes('ContentDetail')
      );
      
      if (highImpactFiles.length > 0) {
        console.log('🔥 ALTA PRIORIDAD (máximo impacto en rendimiento):');
        highImpactFiles.forEach(file => {
          console.log(`   📄 ${file.file} (${file.usages.length} usos)`);
        });
        console.log('');
      }
      
      console.log('📋 PLAN DE MIGRACIÓN RECOMENDADO:');
      console.log('   1. Migrar archivos de alta prioridad primero');
      console.log('   2. Reemplazar "import { Image } from \'react-native\'"');
      console.log('   3. Por "import OptimizedImage from \'./OptimizedImage\'"');
      console.log('   4. Cambiar <Image> por <OptimizedImage>');
      console.log('   5. Añadir props: showLoader={true}');
    }
    
    console.log('');
  }

  generateMigrationScript() {
    console.log('🚀 SCRIPT DE MIGRACIÓN AUTOMÁTICA:');
    console.log('-' .repeat(50));
    
    if (this.results.nativeImageUsage.length === 0) {
      console.log('✅ No se necesita migración.');
      return;
    }
    
    console.log('# Ejecutar estos comandos para migración automática:');
    console.log('');
    
    this.results.nativeImageUsage.forEach((file, index) => {
      console.log(`# ${index + 1}. Migrar ${file.file}`);
      console.log(`# sed -i 's/import.*Image.*from.*react-native.*/import OptimizedImage from ".\\/OptimizedImage";/g' "${file.file}"`);
      console.log(`# sed -i 's/<Image/<OptimizedImage/g' "${file.file}"`);
      console.log(`# sed -i 's/<\\/Image>/<\\/OptimizedImage>/g' "${file.file}"`);
      console.log('');
    });
    
    console.log('⚠️  IMPORTANTE: Revisar manualmente después de la migración automática.');
    console.log('⚠️  Algunos archivos pueden necesitar ajustes específicos.');
  }
}

async function main() {
  const analyzer = new ImageUsageAnalyzer();
  try {
    await analyzer.analyzeProject();
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Revisar archivos marcados como alta prioridad');
    console.log('2. Ejecutar migración manual o automática');
    console.log('3. Probar la app después de cada migración');
    console.log('4. Implementar prefetch en carruseles principales');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = ImageUsageAnalyzer;