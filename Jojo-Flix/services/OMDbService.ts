// OMDb API Service
// API Key: a8f97814
// Documentación: http://www.omdbapi.com/

export interface OMDbMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export interface OMDbSeries extends OMDbMovie {
  totalSeasons: string;
}

export interface OMDbSeason {
  Title: string;
  Season: string;
  totalSeasons: string;
  Episodes: Array<{
    Title: string;
    Released: string;
    Episode: string;
    imdbRating: string;
    imdbID: string;
  }>;
  Response: string;
}

export interface OMDbSearchResult {
  Search: Array<{
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
  }>;
  totalResults: string;
  Response: string;
}

class OMDbService {
  private static instance: OMDbService;
  private apiKey: string = 'a8f97814';
  private baseUrl: string = 'http://www.omdbapi.com/';

  static getInstance(): OMDbService {
    if (!OMDbService.instance) {
      OMDbService.instance = new OMDbService();
    }
    return OMDbService.instance;
  }

  private async makeRequest(params: Record<string, string>): Promise<any> {
    const url = new URL(this.baseUrl);
    url.searchParams.append('apikey', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.Response === 'False') {
        throw new Error(data.Error || 'Error desconocido de OMDb API');
      }
      
      return data;
    } catch (error) {
      console.error('Error en OMDb API:', error);
      throw error;
    }
  }

  // Buscar por título
  async searchByTitle(title: string, type?: 'movie' | 'series' | 'episode'): Promise<OMDbSearchResult> {
    const params: Record<string, string> = { s: title };
    if (type) params.type = type;
    
    return this.makeRequest(params);
  }

  // Obtener detalles por IMDb ID
  async getByImdbId(imdbId: string, plot: 'short' | 'full' = 'full'): Promise<OMDbMovie | OMDbSeries> {
    return this.makeRequest({ i: imdbId, plot });
  }

  // Obtener detalles por título
  async getByTitle(title: string, year?: string, type?: 'movie' | 'series'): Promise<OMDbMovie | OMDbSeries> {
    const params: Record<string, string> = { t: title, plot: 'full' };
    if (year) params.y = year;
    if (type) params.type = type;
    
    return this.makeRequest(params);
  }

  // Obtener temporada completa
  async getSeason(imdbId: string, season: number): Promise<OMDbSeason> {
    return this.makeRequest({ i: imdbId, Season: season.toString() });
  }

  // Buscar contenido y obtener el primer resultado con detalles
  async searchAndGetDetails(title: string, type?: 'movie' | 'series'): Promise<OMDbMovie | OMDbSeries | null> {
    try {
      // Primero buscar
      const searchResult = await this.searchByTitle(title, type);
      
      if (searchResult.Search && searchResult.Search.length > 0) {
        // Obtener detalles del primer resultado
        const firstResult = searchResult.Search[0];
        return await this.getByImdbId(firstResult.imdbID);
      }
      
      return null;
    } catch (error) {
      console.error('Error al buscar y obtener detalles:', error);
      return null;
    }
  }

  // Obtener múltiples detalles por lista de títulos
  async getMultipleByTitles(titles: string[], type?: 'movie' | 'series'): Promise<(OMDbMovie | OMDbSeries)[]> {
    const promises = titles.map(title => 
      this.searchAndGetDetails(title, type).catch(() => null)
    );
    
    const results = await Promise.all(promises);
    return results.filter(result => result !== null) as (OMDbMovie | OMDbSeries)[];
  }

  // Parsear actores en array
  parseActors(actorsString: string): string[] {
    return actorsString.split(', ').filter(actor => actor.trim() !== '');
  }

  // Buscar información de un actor específico
  async getActorInfo(actorName: string): Promise<OMDbMovie | null> {
    try {
      const searchResult = await this.searchByTitle(actorName, undefined);
      
      if (searchResult.Search && searchResult.Search.length > 0) {
        // Buscar el primer resultado que sea una persona/actor
        for (const result of searchResult.Search) {
          try {
            const details = await this.getByImdbId(result.imdbID);
            return details;
          } catch {
            continue;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error al buscar actor ${actorName}:`, error);
      return null;
    }
  }

  // Obtener información de múltiples actores
  async getMultipleActorsInfo(actors: string[]): Promise<{ name: string; info: OMDbMovie | null }[]> {
    const promises = actors.slice(0, 8).map(async (actor) => { // Limitar a 8 actores para no saturar la API
      const info = await this.getActorInfo(actor).catch(() => null);
      return { name: actor, info };
    });
    
    return Promise.all(promises);
  }

  // Parsear géneros en array
  parseGenres(genresString: string): string[] {
    return genresString.split(', ').filter(genre => genre.trim() !== '');
  }

  // Obtener rating de IMDb como número
  getImdbRating(data: OMDbMovie | OMDbSeries): number {
    return parseFloat(data.imdbRating) || 0;
  }

  // Obtener año como número
  getYear(data: OMDbMovie | OMDbSeries): number {
    return parseInt(data.Year) || 0;
  }

  // Verificar si es una serie
  isSeries(data: OMDbMovie | OMDbSeries): data is OMDbSeries {
    return data.Type === 'series';
  }

  // Obtener poster en buena resolución (si está disponible)
  getHDPoster(posterUrl: string): string {
    if (posterUrl === 'N/A') return '';
    // OMDb a veces proporciona posters en baja resolución, intentamos mejorarlos
    return posterUrl.replace('SX300', 'SX600').replace('SY300', 'SY600');
  }
}

export default OMDbService;
