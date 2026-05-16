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

export interface PaymentConfig {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  crypto_address: string;
  other_method: string;
  payment_note: string;
  tracking_questions: string; // JSON string in DB, but we'll parse it
}

export interface PaymentSubmission {
  id: number;
  user_email: string;
  plan: string;
  amount: number;
  sender_name: string;
  transaction_reference: string;
  referral_code: string;
  tracking_answers: string; // JSON string
  proof_image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  created_at: string;
}

export interface Affiliate {
  id: number;
  user_email: string;
  referral_code: string;
  is_active: boolean;
  created_at: string;
}

export interface Ad {
  id: number;
  name: string;
  type: 'image' | 'video' | 'html';
  media_url?: string;
  html_content?: string;
  click_url?: string;
  placement: string;
  priority: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  impressions: number;
  clicks: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target_type: 'all' | 'user';
  target_user_email?: string;
  created_at: string;
  is_read?: boolean;
}
