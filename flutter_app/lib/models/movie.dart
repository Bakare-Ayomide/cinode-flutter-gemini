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
  final String? jellyfinUrl;
  final int? introStart;
  final int? introEnd;
  final bool? hasAdminOverride;
  final List<Movie>? recommendations;
  final List<Map<String, dynamic>>? seasons;
  final bool isDownloaded;
  final String? localPath;
  final int? playbackPosition;
  final int? duration;
  final int? seasonNumber;
  final int? episodeNumber;
  final String? episodeName;

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
    this.jellyfinUrl,
    this.introStart,
    this.introEnd,
    this.hasAdminOverride,
    this.recommendations,
    this.seasons,
    this.isDownloaded = false,
    this.localPath,
    this.playbackPosition,
    this.duration,
    this.seasonNumber,
    this.episodeNumber,
    this.episodeName,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id'] is String ? int.parse(json['id']) : json['id'],
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
      jellyfinUrl: json['jellyfin_url'],
      introStart: json['intro_start'],
      introEnd: json['intro_end'],
      hasAdminOverride: json['has_admin_override'],
      isDownloaded: json['is_downloaded'] ?? false,
      localPath: json['local_path'],
      playbackPosition: json['playback_position'],
      duration: json['duration'],
      seasonNumber: json['season_number'],
      episodeNumber: json['episode_number'],
      episodeName: json['episode_name'],
      recommendations: json['recommendations'] != null && json['recommendations']['results'] != null
        ? (json['recommendations']['results'] as List).map((m) => Movie.fromJson(m)).toList()
        : null,
      seasons: json['seasons'] != null ? List<Map<String, dynamic>>.from(json['seasons']) : null,
    );
  }

  String get displayTitle => title;
  String get year {
    final date = releaseDate ?? firstAirDate;
    if (date == null || date.isEmpty) return 'N/A';
    return date.split('-')[0];
  }
}
