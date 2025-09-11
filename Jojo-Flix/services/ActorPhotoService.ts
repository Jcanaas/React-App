// Servicio para obtener fotos de actores usando TMDB
// Usamos TMDB solo para las imágenes, OMDb para el resto de datos

export interface ActorPhoto {
  name: string;
  profilePath: string | null;
  character?: string;
}

class ActorPhotoService {
  private static instance: ActorPhotoService;
  private apiKey: string = ''; // Se puede configurar opcionalmente
  private baseUrl: string = 'https://api.themoviedb.org/3';
  private imageBaseUrl: string = 'https://image.tmdb.org/t/p/w185';

  static getInstance(): ActorPhotoService {
    if (!ActorPhotoService.instance) {
      ActorPhotoService.instance = new ActorPhotoService();
    }
    return ActorPhotoService.instance;
  }

  // Configurar API key de TMDB (opcional)
  configureApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Buscar foto de actor en TMDB
  async searchActorPhoto(actorName: string): Promise<string | null> {
    if (!this.apiKey) {
      // Si no hay API key, devolver una imagen de placeholder
      return this.getPlaceholderImage(actorName);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/person?api_key=${this.apiKey}&query=${encodeURIComponent(actorName)}`
      );
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const actor = data.results[0];
        if (actor.profile_path) {
          return `${this.imageBaseUrl}${actor.profile_path}`;
        }
      }
      
      return this.getPlaceholderImage(actorName);
    } catch (error) {
      console.error(`Error al buscar foto de ${actorName}:`, error);
      return this.getPlaceholderImage(actorName);
    }
  }

  // Obtener múltiples fotos de actores
  async getMultipleActorPhotos(actors: string[]): Promise<ActorPhoto[]> {
    const promises = actors.map(async (actor) => {
      const profilePath = await this.searchActorPhoto(actor);
      return {
        name: actor,
        profilePath
      };
    });

    return Promise.all(promises);
  }

  // Generar imagen placeholder con iniciales
  private getPlaceholderImage(actorName: string): string {
    const initials = actorName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    // Usar un servicio de avatares con iniciales
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&size=185&background=random&color=fff&format=png&rounded=true&bold=true`;
  }

  // Obtener fotos usando solo nombres (sin API key)
  getPlaceholderPhotos(actors: string[]): ActorPhoto[] {
    return actors.map(actor => ({
      name: actor,
      profilePath: this.getPlaceholderImage(actor)
    }));
  }
}

export default ActorPhotoService;
