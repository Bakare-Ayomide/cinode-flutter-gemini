import 'package:dio/dio.dart';
import '../models/movie.dart';

class ApiService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://ais-dev-vvumg5dcacm3ujgd4h6brh-843881588574.europe-west2.run.app/api',
  ));

  Future<Movie?> getMovieDetails(String type, String id) async {
    try {
      final response = await _dio.get('/$type/$id');
      return Movie.fromJson(response.data);
    } catch (e) {
      print('Error fetching movie details: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getMe(String email) async {
    try {
      final response = await _dio.get(
        '/user/me',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return null;
    }
  }

  Future<void> addToHistory(String email, Movie movie) async {
    try {
      await _dio.post('/history', data: {
        'user_email': email,
        'movie_id': movie.id,
        'title': movie.displayTitle,
        'poster_path': movie.posterPath,
        'media_type': movie.mediaType,
      });
    } catch (e) {
      print('Error adding to history: $e');
    }
  }

  Future<List<Movie>> getHistory(String email) async {
    try {
      final response = await _dio.get(
        '/user/history',
        options: Options(headers: {'x-user-email': email}),
      );
      return (response.data as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> getPublicSettings() async {
    try {
      final response = await _dio.get('/settings/public');
      return response.data;
    } catch (e) {
      return {};
    }
  }

  Future<bool> checkout(String email, {required String plan, required String transactionId}) async {
    try {
      final response = await _dio.post('/user/checkout', data: {
        'email': email,
        'plan': plan,
        'transaction_id': transactionId,
      });
      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<List<Movie>> getTrending() async {
    try {
      final response = await _dio.get('/movies/trending');
      return (response.data['results'] as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<List<Movie>> getTvTrending() async {
    try {
      final response = await _dio.get('/tv/trending');
      return (response.data['results'] as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<List<Movie>> discover({int? genre, String? region, String? sortBy}) async {
    try {
      final response = await _dio.get('/discover', queryParameters: {
        if (genre != null) 'with_genres': genre,
        if (region != null) 'region': region,
        if (sortBy != null) 'sort_by': sortBy,
      });
      return (response.data['results'] as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<List<Movie>> getTrending() async {
    try {
      final response = await _dio.get('/movies/trending');
      return (response.data['results'] as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      print('Error fetching trending: $e');
      return [];
    }
  }

  Future<List<Movie>> getRecommendations(String email) async {
    try {
      final response = await _dio.get(
        '/recommendations',
        options: Options(headers: {'x-user-email': email}),
      );
      return (response.data as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      print('Error fetching recs: $e');
      return [];
    }
  }

  Future<List<Movie>> getWatchlist(String email) async {
    try {
      final response = await _dio.get(
        '/watchlist',
        options: Options(headers: {'x-user-email': email}),
      );
      return (response.data as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> addToWatchlist(String email, Movie movie) async {
    await _dio.post('/watchlist', data: {
      'user_email': email,
      'movie_id': movie.id,
      'title': movie.displayTitle,
      'poster_path': movie.posterPath,
      'media_type': movie.mediaType,
    });
  }

  Future<List<Movie>> search(String query) async {
    try {
      final response = await _dio.get('/search', queryParameters: {'q': query});
      return (response.data['results'] as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      print('Search error: $e');
      return [];
    }
  }
}
