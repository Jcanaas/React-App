// Servicio simple con avatares garantizados
// Usa múltiples fuentes de placeholders que siempre funcionan

export interface SimpleActorPhoto {
  name: string;
  profilePath: string;
  initials: string;
  backgroundColor: string;
}

class SimpleActorService {
  private static instance: SimpleActorService;

  static getInstance(): SimpleActorService {
    if (!SimpleActorService.instance) {
      SimpleActorService.instance = new SimpleActorService();
    }
    return SimpleActorService.instance;
  }

  // Generar foto usando diferentes servicios de avatares
  generateActorAvatar(actorName: string): SimpleActorPhoto {
    const initials = actorName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    // Colores predefinidos que se ven bien
    const colors = [
      '1abc9c', '2ecc71', '3498db', '9b59b6', 'e74c3c', 
      'f39c12', '16a085', '27ae60', '2980b9', '8e44ad',
      'c0392b', 'd35400', '7f8c8d', '34495e', 'e67e22'
    ];
    
    // Seleccionar color basado en el nombre para consistencia
    const colorIndex = actorName.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Múltiples servicios como backup
    const services = [
      `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=${backgroundColor}&color=ffffff&format=png&rounded=true&bold=true&length=2`,
      `https://via.placeholder.com/200x200/${backgroundColor}/ffffff.png?text=${encodeURIComponent(initials)}`,
      `https://dummyimage.com/200x200/${backgroundColor}/ffffff.png&text=${encodeURIComponent(initials)}`,
      `https://placehold.co/200x200/${backgroundColor}/ffffff/png?text=${encodeURIComponent(initials)}`,
      // Backup local como data URL si todo falla
      this.generateDataURLAvatar(initials, backgroundColor)
    ];
    
    return {
      name: actorName,
      profilePath: services[0], // Empezar con el primero
      initials,
      backgroundColor
    };
  }

  // Generar avatar como data URL (siempre funciona)
  generateDataURLAvatar(initials: string, backgroundColor: string): string {
    // Crear un SVG simple como data URL
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="100" fill="#${backgroundColor}"/>
        <text x="100" y="115" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="60" font-weight="bold">${initials}</text>
      </svg>
    `;
    
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  }

  // Obtener múltiples avatares
  getMultipleActorAvatars(actors: string[]): SimpleActorPhoto[] {
    return actors.map(actor => this.generateActorAvatar(actor));
  }

  // Verificar si una URL funciona y devolver backup si no
  async getWorkingAvatar(actorData: SimpleActorPhoto): Promise<string> {
    const testUrls = [
      `https://ui-avatars.com/api/?name=${encodeURIComponent(actorData.initials)}&size=200&background=${actorData.backgroundColor}&color=ffffff&format=png&rounded=true&bold=true`,
      `https://via.placeholder.com/200x200/${actorData.backgroundColor}/ffffff.png?text=${encodeURIComponent(actorData.initials)}`,
      this.generateDataURLAvatar(actorData.initials, actorData.backgroundColor)
    ];

    for (const url of testUrls) {
      try {
        // Crear AbortController para timeout manual
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return url;
        }
      } catch (error) {
        continue;
      }
    }

    // Si todo falla, devolver el data URL que siempre funciona
    return this.generateDataURLAvatar(actorData.initials, actorData.backgroundColor);
  }
}

export default SimpleActorService;
