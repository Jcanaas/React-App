const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`📄 Solicitando: ${req.url}`);
  
  let filePath;
  
  // Manejar la ruta raíz
  if (req.url === '/' || req.url === '') {
    filePath = path.join(__dirname, 'icon-preview.html');
  }
  // Manejar rutas de assets
  else if (req.url.startsWith('/assets/')) {
    filePath = path.join(__dirname, req.url);
  }
  // Cualquier otra ruta
  else {
    filePath = path.join(__dirname, req.url);
  }
  
  console.log(`📁 Buscando archivo: ${filePath}`)
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Archivo no encontrado</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Error del servidor: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8001; // Cambiar puerto para evitar conflictos
server.listen(PORT, () => {
  console.log(`🌐 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`📱 Abre tu navegador y ve a: http://localhost:${PORT}`);
  console.log('🎨 Ahí podrás ver exactamente cómo se verán tus iconos');
  console.log('');
  console.log(`📂 Sirviendo desde: ${__dirname}`);
  console.log('Para detener el servidor, presiona Ctrl+C');
});