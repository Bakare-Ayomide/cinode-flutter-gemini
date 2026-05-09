export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  credits: {
    cast: CastMember[];
  };
  videos: {
    results: Video[];
  };
  production_countries: { name: string }[];
  override_url?: string;
  intro_start?: number;
  intro_end?: number;
  has_admin_override?: boolean;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  key: string;
  site: string;
  type: string;
  is_override?: boolean;
}

export interface Review {
  id: number;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string;
  media_type: 'movie' | 'tv';
}
