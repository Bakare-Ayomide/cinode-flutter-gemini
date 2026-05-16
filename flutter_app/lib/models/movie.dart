class Movie {
  final int id;
  final String title;
  final String? name;
  final String? overview;
  final String posterPath;
  final String? backdropPath;
  final String mediaType;
  final double voteAverage;
  final String? releaseDate;
  final String? firstAirDate;
  
  // Overrides and extra info
  final String? videoUrl;
  final String? overrideUrl;
  final int? introStart;
  final int? introEnd;
  final bool? hasAdminOverride;
  final List<Movie>? recommendations;
  final bool isDownloaded;
  final String? localPath;
  final double? progressTime;
  final double? duration;
  final List<Season>? seasons;

  Movie({
    required this.id,
    required this.title,
    this.name,
    this.overview,
    required this.posterPath,
    this.backdropPath,
    required this.mediaType,
    required this.voteAverage,
    this.releaseDate,
    this.firstAirDate,
    this.videoUrl,
    this.overrideUrl,
    this.introStart,
    this.introEnd,
    this.hasAdminOverride,
    this.recommendations,
    this.isDownloaded = false,
    this.localPath,
    this.progressTime,
    this.duration,
    this.seasons,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id'],
      title: json['title'] ?? json['name'] ?? 'Untitled',
      name: json['name'],
      overview: json['overview'],
      posterPath: json['poster_path'] ?? '',
      backdropPath: json['backdrop_path'],
      mediaType: json['media_type'] ?? 'movie',
      voteAverage: (json['vote_average'] as num?)?.toDouble() ?? 0.0,
      releaseDate: json['release_date'],
      firstAirDate: json['first_air_date'],
      videoUrl: json['video_url'],
      overrideUrl: json['override_url'],
      introStart: json['intro_start'],
      introEnd: json['intro_end'],
      hasAdminOverride: json['has_admin_override'],
      isDownloaded: json['is_downloaded'] ?? false,
      localPath: json['local_path'],
      progressTime: (json['progress_time'] as num?)?.toDouble(),
      duration: (json['duration'] as num?)?.toDouble(),
      recommendations: json['recommendations'] != null && json['recommendations']['results'] != null
        ? (json['recommendations']['results'] as List).map((m) => Movie.fromJson(m)).toList()
        : null,
      seasons: json['seasons'] != null 
        ? (json['seasons'] as List).map((s) => Season.fromJson(s)).toList() 
        : null,
    );
  }

  String get displayTitle => title;
  String get year {
    final date = releaseDate ?? firstAirDate;
    if (date == null || date.isEmpty) return 'N/A';
    return date.split('-')[0];
  }
}

class Season {
  final int id;
  final int seasonNumber;
  final int episodeCount;
  final String name;
  final String overview;
  final String? posterPath;
  final String? airDate;

  Season({
    required this.id,
    required this.seasonNumber,
    required this.episodeCount,
    required this.name,
    required this.overview,
    this.posterPath,
    this.airDate,
  });

  factory Season.fromJson(Map<String, dynamic> json) {
    return Season(
      id: json['id'],
      seasonNumber: json['season_number'],
      episodeCount: json['episode_count'],
      name: json['name'] ?? '',
      overview: json['overview'] ?? '',
      posterPath: json['poster_path'],
      airDate: json['air_date'],
    );
  }
}

class Episode {
  final int id;
  final int episodeNumber;
  final int seasonNumber;
  final String name;
  final String overview;
  final String? stillPath;
  final String? airDate;
  final String? videoUrl;
  final int? introStart;
  final int? introEnd;
  final bool? hasAdminOverride;

  Episode({
    required this.id,
    required this.episodeNumber,
    required this.seasonNumber,
    required this.name,
    required this.overview,
    this.stillPath,
    this.airDate,
    this.videoUrl,
    this.introStart,
    this.introEnd,
    this.hasAdminOverride,
  });

  factory Episode.fromJson(Map<String, dynamic> json) {
    return Episode(
      id: json['id'],
      episodeNumber: json['episode_number'],
      seasonNumber: json['season_number'],
      name: json['name'] ?? '',
      overview: json['overview'] ?? '',
      stillPath: json['still_path'],
      airDate: json['air_date'],
      videoUrl: json['video_url'],
      introStart: json['intro_start'],
      introEnd: json['intro_end'],
      hasAdminOverride: json['has_admin_override'],
    );
  }
}
