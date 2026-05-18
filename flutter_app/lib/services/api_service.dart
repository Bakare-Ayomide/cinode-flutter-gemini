import 'package:dio/dio.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/movie.dart';

class ApiService {
  String _baseUrl = 'https://ais-pre-vvumg5dcacm3ujgd4h6brh-843881588574.europe-west2.run.app/api';
  late final Dio _dio;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
    ));
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString('cinode_backend_url');
    if (savedUrl != null && savedUrl.isNotEmpty) {
      _updateBaseUrl(savedUrl);
    }
  }

  void _updateBaseUrl(String url) {
    _baseUrl = url.endsWith('/api') ? url : (url.endsWith('/') ? '${url}api' : '$url/api');
    _dio.options.baseUrl = _baseUrl;
  }

  Future<void> setCustomBackend(String url) async {
    final prefs = await SharedPreferences.getInstance();
    if (url.isEmpty) {
      await prefs.remove('cinode_backend_url');
    } else {
      await prefs.setString('cinode_backend_url', url);
      _updateBaseUrl(url);
    }
  }

  Future<String?> discoverBackend() async {
    final productionUrl = 'https://ais-pre-vvumg5dcacm3ujgd4h6brh-843881588574.europe-west2.run.app/api';
    final candidates = [
       _baseUrl,
       productionUrl,
    ];

    for (var url in candidates) {
      try {
        final probeDio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 3)));
        final cleanUrl = url.endsWith('/api') ? url : (url.endsWith('/') ? '${url}api' : '$url/api');
        final response = await probeDio.get('$cleanUrl/health');
        if (response.statusCode == 200 && response.data['status'] == 'ok') {
          _updateBaseUrl(url);
          return url;
        }
      } catch (e) {
        // Continue
      }
    }
    return null;
  }

  Future<Movie?> getMovieDetails(String type, String id) async {
    try {
      final response = await _dio.get('/movies/details/$type/$id');
      return Movie.fromJson(response.data);
    } catch (e) {
      print('Error fetching movie details: $e');
      return null;
    }
  }

  Future<List<Episode>> getSeasonDetails(String tvId, int seasonNumber) async {
    try {
      final response = await _dio.get('/tv/$tvId/season/$seasonNumber');
      return (response.data['episodes'] as List).map((e) => Episode.fromJson(e)).toList();
    } catch (e) {
      print('Error fetching season details: $e');
      return [];
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

  Future<List<Movie>> getDownloads(String email) async {
    try {
      final response = await _dio.get(
        '/downloads',
        options: Options(headers: {'x-user-email': email}),
      );
      return (response.data as List).map((m) => Movie.fromJson(m)).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> addToDownloads(String email, Movie movie, {String? localPath}) async {
    try {
      await _dio.post('/downloads', data: {
        'user_email': email,
        'movie_id': movie.id,
        'title': movie.displayTitle,
        'poster_path': movie.posterPath,
        'media_type': movie.mediaType,
        'local_path': localPath,
      });
    } catch (e) {
      print('Download error: $e');
      throw e;
    }
  }

  Future<String?> downloadFile(String url, String fileName) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${directory.path}/downloads');
      if (!await downloadDir.exists()) {
        await downloadDir.create(recursive: true);
      }
      
      final filePath = '${downloadDir.path}/$fileName';
      await _dio.download(url, filePath, onReceiveProgress: (received, total) {
        if (total != -1) {
          print((received / total * 100).toStringAsFixed(0) + "%");
        }
      });
      return filePath;
    } catch (e) {
      print('File download error: $e');
      return null;
    }
  }

  Future<void> removeFromDownloads(String email, int movieId) async {
    try {
      final downloads = await getDownloads(email);
      final movie = downloads.firstWhere((m) => m.id == movieId);
      if (movie.localPath != null) {
        final file = File(movie.localPath!);
        if (await file.exists()) {
          await file.delete();
        }
      }

      await _dio.delete(
        '/downloads/$movieId',
        options: Options(headers: {'x-user-email': email}),
      );
    } catch (e) {
      print('Remove download error: $e');
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

  // Playback Progress
  Future<Map<String, dynamic>> getPlaybackProgress(String email, String type, String id) async {
    try {
      final response = await _dio.get(
        '/playback/progress/$type/$id',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return {'progress_time': 0.0, 'duration': 0.0};
    }
  }

  Future<void> savePlaybackProgress(String email, Map<String, dynamic> data) async {
    try {
      await _dio.post(
        '/playback/progress',
        data: data,
        options: Options(headers: {'x-user-email': email}),
      );
    } catch (e) {
      print('Save playback progress error: $e');
    }
  }

  // Payments & Checkout
  Future<Map<String, dynamic>> getCheckoutConfig() async {
    try {
      final response = await _dio.get('/checkout/config');
      return response.data;
    } catch (e) {
      return {};
    }
  }

  Future<bool> submitPayment(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/checkout/submit', data: data);
      return response.data['success'] == true;
    } catch (e) {
      print('Payment submission error: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>?> uploadProof({
    required File imageFile,
  }) async {
    try {
      String fileName = imageFile.path.split('/').last;
      FormData formData = FormData.fromMap({
        'proof': await MultipartFile.fromFile(imageFile.path, filename: fileName),
      });

      final response = await _dio.post(
        '/checkout/upload-proof',
        data: formData,
      );
      
      return response.data;
    } catch (e) {
      print('Upload proof error: $e');
      return null;
    }
  }

  Future<List<dynamic>> getUserPayments(String email) async {
    try {
      final response = await _dio.get(
        '/user/payments',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  // Affiliates
  Future<Map<String, dynamic>?> getAffiliateDashboard(String email) async {
    try {
      final response = await _dio.get(
        '/affiliate/dashboard',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return null;
    }
  }

  Future<void> requestPayout(String email) async {
    try {
      await _dio.post(
        '/affiliate/payout-request',
        options: Options(headers: {'x-user-email': email}),
      );
    } catch (e) {
      print('Payout request error: $e');
    }
  }

  // Ads
  Future<List<dynamic>> getActiveAds() async {
    try {
      final response = await _dio.get('/ads/active');
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> trackAd(int adId, String action) async {
    try {
      await _dio.post('/ads/track/$adId/$action');
    } catch (e) {
      print('Ad tracking error: $e');
    }
  }

  // Notifications
  Future<List<dynamic>> getNotifications(String email) async {
    try {
      final response = await _dio.get(
        '/notifications',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> markNotificationAsRead(String email, int notificationId) async {
    try {
      await _dio.post(
        '/notifications/read/$notificationId',
        options: Options(headers: {'x-user-email': email}),
      );
    } catch (e) {
      print('Mark notification read error: $e');
    }
  }

  Future<void> markAllNotificationsAsRead(String email) async {
    try {
      await _dio.post(
        '/notifications/read-all',
        options: Options(headers: {'x-user-email': email}),
      );
    } catch (e) {
      print('Mark all notifications read error: $e');
    }
  }

  // Admin Methods (Expanded)
  Future<List<dynamic>> getAdminPayments(String email) async {
    try {
      final response = await _dio.get(
        '/admin/payments',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> reviewPayment(String email, Map<String, dynamic> review) async {
    await _dio.post(
      '/admin/payments/review',
      data: review,
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<Map<String, dynamic>> getAdminPaymentConfig(String email) async {
    try {
      final response = await _dio.get(
        '/admin/payment-config',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return {};
    }
  }

  Future<void> saveAdminPaymentConfig(String email, Map<String, dynamic> config) async {
    await _dio.post(
      '/admin/payment-config',
      data: config,
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<List<dynamic>> getAdminAffiliates(String email) async {
    try {
      final response = await _dio.get(
        '/admin/affiliates',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getAdminEarnings(String email) async {
    try {
      final response = await _dio.get(
        '/admin/affiliates/earnings',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> createAffiliate(String email, Map<String, dynamic> data) async {
    await _dio.post(
      '/admin/affiliates',
      data: data,
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> toggleAffiliate(String email, Map<String, dynamic> data) async {
    await _dio.post(
      '/admin/affiliates/toggle',
      data: data,
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> payoutEarnings(String email, List<int> ids) async {
    await _dio.post(
      '/admin/affiliates/payout',
      data: {'ids': ids},
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<List<dynamic>> getAdminAds(String email) async {
    try {
      final response = await _dio.get(
        '/admin/ads',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> saveAdminAd(String email, Map<String, dynamic> ad) async {
    await _dio.post(
      '/admin/ads',
      data: ad,
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> deleteAdminAd(String email, int id) async {
    await _dio.delete(
      '/admin/ads/$id',
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<List<dynamic>> getAdminNotifications(String email) async {
    try {
      final response = await _dio.get(
        '/admin/notifications',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> sendNotification(String email, Map<String, dynamic> notif) async {
    await _dio.post(
      '/admin/notifications/send',
      data: notif,
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> deleteAdminNotification(String email, int id) async {
    await _dio.delete(
      '/admin/notifications/$id',
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<bool> testAdminMail(String email, String targetEmail) async {
    try {
      final response = await _dio.post(
        '/admin/mail-test',
        data: {'to': targetEmail},
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<List<dynamic>> getAdminUsers(String email) async {
    try {
      final response = await _dio.get(
        '/admin/users',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> grantPremium(String email, String userEmail, String duration) async {
    await _dio.post(
      '/admin/users/grant-premium',
      data: {'email': userEmail, 'duration': duration},
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> deleteAdminUser(String email, String userEmail) async {
    await _dio.delete(
      '/admin/users/$userEmail',
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> promoteAdmin(String email, String userEmail, bool isAdmin) async {
    await _dio.post(
      '/admin/users/promote',
      data: {'email': userEmail, 'is_admin': isAdmin},
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> revokePremium(String email, String userEmail) async {
    await _dio.post(
      '/admin/users/revoke-premium',
      data: {'email': userEmail},
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<List<dynamic>> getAdminLocalLibrary(String email) async {
    try {
      final response = await _dio.get(
        '/admin/local-library',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> browseDirectory(String email, {String? path}) async {
    try {
      final response = await _dio.get(
        '/admin/browse',
        queryParameters: {'path': path},
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> scanLocalLibrary(String email, String moviePath, String tvPath) async {
    await _dio.post(
      '/admin/local-library/scan',
      data: {'moviePath': moviePath, 'tvPath': tvPath},
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> updateLocalLibraryEntry(String email, dynamic id, String? tmdbId) async {
    await _dio.post(
      '/admin/local-library/update',
      data: {'id': id, 'tmdb_id': tmdbId},
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<Map<String, dynamic>?> extractInfo(String imageUrl) async {
    try {
      final response = await _dio.post('/checkout/extract-info', data: {'image_url': imageUrl});
      return response.data;
    } catch (e) {
      return null;
    }
  }

  Future<List<dynamic>> getAdminOverrides(String email) async {
    try {
      final response = await _dio.get(
        '/admin/overrides',
        options: Options(headers: {'x-user-email': email}),
      );
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<void> adminSaveOverride(String email, Map<String, dynamic> override) async {
    await _dio.post(
      '/admin/overrides',
      data: override,
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> adminDeleteOverride(String email, int id) async {
    await _dio.delete(
      '/admin/overrides/$id',
      options: Options(headers: {'x-user-email': email}),
    );
  }

  Future<void> updateUserSettings(String email, Map<String, dynamic> settings) async {
    try {
      await _dio.post(
        '/user/settings',
        data: {'settings': settings},
        options: Options(headers: {'x-user-email': email}),
      );
    } catch (e) {
      print('Update settings error: $e');
      rethrow;
    }
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
