import axios from 'axios';
import { Movie, MovieDetails, Review, WatchlistItem } from '../types';

const getBaseUrl = () => {
  const envUrl = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');
  if (envUrl) return envUrl;
  
  // If we are likely hosted on Vercel and have no env var set,
  // default to the AI Studio backend URL.
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://ais-pre-vvumg5dcacm3ujgd4h6brh-843881588574.europe-west2.run.app';
  }
  
  return ''; // Default to relative path (works for AI Studio preview)
};

const api = axios.create({
  baseURL: getBaseUrl() + '/api',
  timeout: 30000, // 30 seconds to handle slow DB/cloud responses
});

// Add error interceptor with better logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Network Error";
    if (error.response) {
      message = error.response.data?.error || error.response.data?.message || `Status ${error.response.status}`;
    } else if (error.request) {
      message = "Server is unresponsive. Please check your connection.";
    } else {
      message = error.message;
    }
    console.error("Frontend API Error:", message);
    return Promise.reject(new Error(message));
  }
);

// Set user email in headers for all requests
export const setAuthEmail = (email: string) => {
  api.defaults.headers.common['x-user-email'] = email;
};

export const movieApi = {
  getTrending: () => api.get('/movies/trending').then(res => res.data),
  getTvTrending: () => api.get('/tv/trending').then(res => res.data),
  discover: (params: any) => api.get('/discover', { params }).then(res => res.data),
  getGenres: () => api.get('/movies/genres').then(res => res.data),
  getDetails: (type: string, id: number) => api.get<MovieDetails>(`/movies/details/${type}/${id}`).then(res => res.data),
  search: (query: string) => api.get('/search', { params: { q: query } }).then(res => res.data),
  getWatchlist: () => api.get<WatchlistItem[]>('/watchlist').then(res => res.data),
  addToWatchlist: (item: any) => api.post('/watchlist', item),
  removeFromWatchlist: (id: number) => api.delete(`/watchlist/${id}`),
  getReviews: (type: string, id: number) => api.get<Review[]>(`/reviews/${type}/${id}`).then(res => res.data),
  postReview: (review: any) => api.post('/reviews', review),
  getRecommendations: () => api.get<Movie[]>('/recommendations').then(res => res.data),
  getHistory: () => api.get<any[]>('/user/history').then(res => res.data),
  addToHistory: (item: any) => api.post('/history', item),
  login: (email: string) => api.post('/user/login', { email }),
  getUserMe: () => api.get('/user/me').then(res => res.data),
  // Admin APIs
  getAdminStats: () => api.get('/admin/stats').then(res => res.data),
  getAdminUsers: () => api.get('/admin/users').then(res => res.data),
  promoteUser: (email: string, is_admin: boolean) => api.post('/admin/users/promote', { email, is_admin }),
  deleteUser: (email: string) => api.delete(`/admin/users/${email}`),
  getAdminSettings: () => api.get('/admin/settings').then(res => res.data),
  saveAdminSetting: (key: string, value: string) => api.post('/admin/settings', { key, value }),
  getAdminOverrides: () => api.get('/admin/overrides').then(res => res.data),
  saveAdminOverride: (override: any) => api.post('/admin/overrides', override),
  deleteAdminOverride: (id: number) => api.delete(`/admin/overrides/${id}`),
  getPublicSettings: () => api.get('/settings/public').then(res => res.data),
  getSeasonDetails: (tvId: number, seasonNumber: number) => api.get<any>(`/tv/${tvId}/season/${seasonNumber}`).then(res => res.data),
  getDownloads: () => api.get<any[]>('/downloads').then(res => res.data),
  addToDownloads: (item: any) => api.post('/downloads', item),
  removeFromDownloads: (id: number) => api.delete(`/downloads/${id}`),
  checkout: (data: any) => api.post('/user/checkout', data).then(res => res.data),
  // New Payments & Checkout
  getCheckoutConfig: () => api.get('/checkout/config').then(res => res.data),
  submitCheckout: (data: any) => api.post('/checkout/submit', data).then(res => res.data),
  getUserPayments: () => api.get('/user/payments').then(res => res.data),
  uploadProof: (formData: FormData) => api.post('/checkout/upload-proof', formData, {
    headers: {
      'Content-Type': 'multipart/form-data' 
    }
  }).then(res => res.data),
  extractInfo: (imageUrl: string) => api.post('/checkout/extract-info', { image_url: imageUrl }).then(res => res.data),
  // Affiliates
  getAffiliateDashboard: () => api.get('/affiliate/dashboard').then(res => res.data),
  requestPayout: () => api.post('/affiliate/payout-request').then(res => res.data),
  // Ads
  getActiveAds: () => api.get('/ads/active').then(res => res.data),
  trackAd: (id: number, action: 'impression' | 'click') => api.post(`/ads/track/${id}/${action}`),
  // Notifications
  getNotifications: () => api.get('/notifications').then(res => res.data),
  markNotificationRead: (id: number) => api.post(`/notifications/read/${id}`),
  markAllNotificationsRead: () => api.post('/notifications/read-all'),
  // Admin Extensions
  getAdminPayments: () => api.get('/admin/payments').then(res => res.data),
  reviewPayment: (data: any) => api.post('/admin/payments/review', data),
  getAdminPaymentConfig: () => api.get('/admin/payment-config').then(res => res.data),
  saveAdminPaymentConfig: (config: any) => api.post('/admin/payment-config', config),
  getAdminAffiliates: () => api.get('/admin/affiliates').then(res => res.data),
  createAffiliate: (data: any) => api.post('/admin/affiliates', data),
  toggleAffiliate: (data: any) => api.post('/admin/affiliates/toggle', data),
  getAdminEarnings: () => api.get('/admin/affiliates/earnings').then(res => res.data),
  payoutEarnings: (earning_ids: number[]) => api.post('/admin/affiliates/payout', { earning_ids }),
  getAdminAds: () => api.get('/admin/ads').then(res => res.data),
  saveAdminAd: (ad: any) => api.post('/admin/ads', ad),
  deleteAdminAd: (id: number) => api.delete(`/admin/ads/${id}`),
  getAdminNotifications: () => api.get('/admin/notifications').then(res => res.data),
  sendNotification: (notif: any) => api.post('/admin/notifications', notif),
  deleteAdminNotification: (id: number) => api.delete(`/admin/notifications/${id}`),
  grantPremium: (email: string, duration: string) => api.post('/admin/users/grant-premium', { email, duration }),
  revokePremium: (email: string) => api.post('/admin/users/revoke-premium', { email }),
  updateUserSettings: (settings: any) => api.post('/user/settings', { settings }),
  restoreFromJson: () => api.post('/admin/restore-from-json').then(res => res.data),
  // Playback Progress
  getPlaybackProgress: (type: string, id: number) => api.get(`/playback/progress/${type}/${id}`).then(res => res.data),
  savePlaybackProgress: (data: { movie_id: number | string, media_type: string, title?: string, poster_path?: string, progress_time: number, duration: number }) => api.post('/playback/progress', data).then(res => res.data),
};
