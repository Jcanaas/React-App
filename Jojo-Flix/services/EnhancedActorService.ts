// Servicio mejorado para obtener fotos de actores usando múltiples fuentes
// 1. Wikipedia API (fotos reales)
// 2. Unsplash (fotos de personas)
// 3. Placeholders locales

export interface ActorPhoto {
  name: string;
  profilePath: string | null;
  source: 'wikipedia' | 'unsplash' | 'placeholder';
}

class EnhancedActorService {
  private static instance: EnhancedActorService;
  private cache: Map<string, string> = new Map();

  static getInstance(): EnhancedActorService {
    if (!EnhancedActorService.instance) {
      EnhancedActorService.instance = new EnhancedActorService();
    }
    return EnhancedActorService.instance;
  }

  // Buscar foto en Wikipedia
  async searchWikipediaPhoto(actorName: string): Promise<string | null> {
    try {
      // Primero buscar la página del actor
      const searchResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(actorName)}`
      );
      
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        if (data.thumbnail && data.thumbnail.source) {
          return data.thumbnail.source;
        }
      }
      
      return null;
    } catch (error) {
      console.log(`Wikipedia no encontró foto para ${actorName}`);
      return null;
    }
  }

  // Buscar foto en Unsplash (fotos de personas genéricas)
  async searchUnsplashPhoto(actorName: string): Promise<string | null> {
    try {
      // Usar Unsplash Source para obtener una foto de persona aleatoria pero consistente
      const seed = this.generateSeed(actorName);
      const imageUrl = `https://source.unsplash.com/150x150/?portrait,person&${seed}`;
      
      // Verificar que la imagen existe
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) {
        return imageUrl;
      }
      
      return null;
    } catch (error) {
      console.log(`Unsplash error para ${actorName}`);
      return null;
    }
  }

  // Generar placeholder con avatar diferente
  generateActorPlaceholder(actorName: string): string {
    const initials = actorName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    // Generar color basado en el nombre para consistencia
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', 'F4A460', '87CEEB'];
    const colorIndex = actorName.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Usar múltiples servicios de avatares como fallback
    const services = [
      `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=150&background=${backgroundColor}&color=fff&format=png&rounded=true&bold=true`,
      `https://via.placeholder.com/150x150/${backgroundColor}/ffffff?text=${encodeURIComponent(initials)}`,
      `https://dummyimage.com/150x150/${backgroundColor}/ffffff&text=${encodeURIComponent(initials)}`
    ];
    
    return services[0]; // Usar el primero por defecto
  }

  // Obtener foto con múltiples fallbacks
  async getActorPhoto(actorName: string): Promise<ActorPhoto> {
    // Verificar cache primero
    if (this.cache.has(actorName)) {
      return {
        name: actorName,
        profilePath: this.cache.get(actorName)!,
        source: 'placeholder'
      };
    }

    let photoUrl: string | null = null;
    let source: 'wikipedia' | 'unsplash' | 'placeholder' = 'placeholder';

    // 1. Intentar Wikipedia primero (fotos reales)
    try {
      photoUrl = await this.searchWikipediaPhoto(actorName);
      if (photoUrl) {
        source = 'wikipedia';
      }
    } catch (error) {
      console.log(`Wikipedia falló para ${actorName}`);
    }

    // 2. Si no hay foto, intentar Unsplash
    if (!photoUrl) {
      try {
        photoUrl = await this.searchUnsplashPhoto(actorName);
        if (photoUrl) {
          source = 'unsplash';
        }
      } catch (error) {
        console.log(`Unsplash falló para ${actorName}`);
      }
    }

    // 3. Fallback a placeholder
    if (!photoUrl) {
      photoUrl = this.generateActorPlaceholder(actorName);
      source = 'placeholder';
    }

    // Guardar en cache
    this.cache.set(actorName, photoUrl);

    return {
      name: actorName,
      profilePath: photoUrl,
      source
    };
  }

  // Obtener múltiples fotos de actores
  async getMultipleActorPhotos(actors: string[]): Promise<ActorPhoto[]> {
    const promises = actors.map(actor => 
      this.getActorPhoto(actor).catch(() => ({
        name: actor,
        profilePath: this.generateActorPlaceholder(actor),
        source: 'placeholder' as const
      }))
    );

    return Promise.all(promises);
  }

  // Obtener fotos solo con placeholders (para pruebas rápidas)
  getPlaceholderPhotos(actors: string[]): ActorPhoto[] {
    return actors.map(actor => ({
      name: actor,
      profilePath: this.generateActorPlaceholder(actor),
      source: 'placeholder'
    }));
  }

  // Generar seed consistente para Unsplash
  private generateSeed(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return Math.abs(hash).toString();
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
  }
}

export default EnhancedActorService;
