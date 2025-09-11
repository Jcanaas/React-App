// TMDB API Service
// Para obtener tu API key gratuita: https://www.themoviedb.org/settings/api

import { TMDB_CONFIG, isApiKeyConfigured } from '../config/tmdb';

export interface TMDBConfiguration {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  video: boolean;
  original_language: string;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  credit_id: string;
  order: number;
  adult: boolean;
  gender: number;
  known_for_department: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  credit_id: string;
  adult: boolean;
  gender: number;
  known_for_department: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBReview {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface TMDBVideo {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
  size: number;
  official: boolean;
  published_at: string;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  runtime: number | null;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  episodes?: TMDBEpisode[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  budget: number;
  revenue: number;
  runtime: number;
  status: string;
  tagline: string;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
}

export interface TMDBTVDetails extends TMDBTVShow {
  created_by: { id: number; name: string; profile_path: string | null }[];
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  number_of_episodes: number;
  number_of_seasons: number;
  production_companies: { id: number; name: string; logo_path: string | null }[];
  seasons: TMDBSeason[];
  status: string;
  type: string;
}

class TMDBService {
  private static instance: TMDBService;
  private apiKey: string = TMDB_CONFIG.API_KEY;
  private baseUrl: string = TMDB_CONFIG.BASE_URL;
  private imageBaseUrl: string = TMDB_CONFIG.IMAGE_BASE_URL;
  private configuration: TMDBConfiguration | null = null;

  static getInstance(): TMDBService {
    if (!TMDBService.instance) {
      TMDBService.instance = new TMDBService();
    }
    return TMDBService.instance;
  }

  private constructor() {
    this.initializeConfiguration();
  }

  private async initializeConfiguration(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/configuration?api_key=${this.apiKey}`);
      this.configuration = await response.json();
    } catch (error) {
      console.error('Error fetching TMDB configuration:', error);
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T | null> {
    if (!isApiKeyConfigured()) {
      console.error('TMDB API key no configurada');
      return null;
    }

    try {
      const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${this.apiKey}&language=es-ES`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return null;
    }
  }

  // Configurar API Key
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.initializeConfiguration();
  }

  // Obtener URL completa de imagen
  getImageUrl(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  // Buscar contenido
  async search(query: string, type: 'movie' | 'tv' | 'multi' = 'multi') {
    const endpoint = `/search/${type}`;
    return await this.makeRequest<{
      page: number;
      results: (TMDBMovie | TMDBTVShow)[];
      total_pages: number;
      total_results: number;
    }>(`${endpoint}?query=${encodeURIComponent(query)}`);
  }

  // Obtener detalles de película
  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails | null> {
    return await this.makeRequest<TMDBMovieDetails>(`/movie/${movieId}`);
  }

  // Obtener detalles de serie
  async getTVDetails(tvId: number): Promise<TMDBTVDetails | null> {
    return await this.makeRequest<TMDBTVDetails>(`/tv/${tvId}`);
  }

  // Obtener créditos (reparto y equipo)
  async getMovieCredits(movieId: number): Promise<TMDBCredits | null> {
    return await this.makeRequest<TMDBCredits>(`/movie/${movieId}/credits`);
  }

  async getTVCredits(tvId: number): Promise<TMDBCredits | null> {
    return await this.makeRequest<TMDBCredits>(`/tv/${tvId}/credits`);
  }

  // Obtener críticas/reseñas
  async getMovieReviews(movieId: number): Promise<{ results: TMDBReview[] } | null> {
    return await this.makeRequest<{ results: TMDBReview[] }>(`/movie/${movieId}/reviews`);
  }

  async getTVReviews(tvId: number): Promise<{ results: TMDBReview[] } | null> {
    return await this.makeRequest<{ results: TMDBReview[] }>(`/tv/${tvId}/reviews`);
  }

  // Obtener videos (trailers, etc.)
  async getMovieVideos(movieId: number): Promise<{ results: TMDBVideo[] } | null> {
    return await this.makeRequest<{ results: TMDBVideo[] }>(`/movie/${movieId}/videos`);
  }

  async getTVVideos(tvId: number): Promise<{ results: TMDBVideo[] } | null> {
    return await this.makeRequest<{ results: TMDBVideo[] }>(`/tv/${tvId}/videos`);
  }

  // Obtener temporada específica con episodios
  async getTVSeason(tvId: number, seasonNumber: number): Promise<TMDBSeason | null> {
    return await this.makeRequest<TMDBSeason>(`/tv/${tvId}/season/${seasonNumber}`);
  }

  // Obtener episodio específico
  async getTVEpisode(tvId: number, seasonNumber: number, episodeNumber: number): Promise<TMDBEpisode | null> {
    return await this.makeRequest<TMDBEpisode>(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
  }

  // Obtener contenido trending
  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
    return await this.makeRequest<{
      page: number;
      results: (TMDBMovie | TMDBTVShow)[];
      total_pages: number;
      total_results: number;
    }>(`/trending/${mediaType}/${timeWindow}`);
  }

  // Obtener top rated
  async getTopRated(type: 'movie' | 'tv') {
    return await this.makeRequest<{
      page: number;
      results: (TMDBMovie | TMDBTVShow)[];
      total_pages: number;
      total_results: number;
    }>(`/${type}/top_rated`);
  }

  // Obtener populares
  async getPopular(type: 'movie' | 'tv') {
    return await this.makeRequest<{
      page: number;
      results: (TMDBMovie | TMDBTVShow)[];
      total_pages: number;
      total_results: number;
    }>(`/${type}/popular`);
  }

  // Obtener recomendaciones
  async getRecommendations(type: 'movie' | 'tv', id: number) {
    return await this.makeRequest<{
      page: number;
      results: (TMDBMovie | TMDBTVShow)[];
      total_pages: number;
      total_results: number;
    }>(`/${type}/${id}/recommendations`);
  }

  // Obtener similar content
  async getSimilar(type: 'movie' | 'tv', id: number) {
    return await this.makeRequest<{
      page: number;
      results: (TMDBMovie | TMDBTVShow)[];
      total_pages: number;
      total_results: number;
    }>(`/${type}/${id}/similar`);
  }

  // Buscar por género
  async getByGenre(type: 'movie' | 'tv', genreId: number) {
    return await this.makeRequest<{
      page: number;
      results: (TMDBMovie | TMDBTVShow)[];
      total_pages: number;
      total_results: number;
    }>(`/discover/${type}?with_genres=${genreId}`);
  }

  // Obtener géneros disponibles
  async getGenres(type: 'movie' | 'tv') {
    return await this.makeRequest<{
      genres: { id: number; name: string }[];
    }>(`/genre/${type}/list`);
  }

  // Buscar por ID externo (IMDb ID)
  async findByExternalId(externalId: string, source: 'imdb_id' | 'freebase_mid' | 'freebase_id' | 'tvdb_id' = 'imdb_id') {
    return await this.makeRequest<{
      movie_results: TMDBMovie[];
      tv_results: TMDBTVShow[];
    }>(`/find/${externalId}?external_source=${source}`);
  }
}

export const tmdbService = TMDBService.getInstance();
export default tmdbService;
