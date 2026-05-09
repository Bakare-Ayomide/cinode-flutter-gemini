import axios from 'axios';
import { Movie, MovieDetails, Review, WatchlistItem } from '../types';

const api = axios.create({
  baseURL: '/api',
});

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
  checkout: (data: any) => api.post('/user/checkout', data).then(res => res.data),
};
