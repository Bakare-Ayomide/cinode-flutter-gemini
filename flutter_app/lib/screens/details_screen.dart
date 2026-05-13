import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'video_player_screen.dart';
import 'checkout_screen.dart';

class DetailsScreen extends StatefulWidget {
  final Movie movie;
  final String userEmail;

  const DetailsScreen({super.key, required this.movie, required this.userEmail});

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> {
  late Movie _movie;
  bool _isLoading = true;
  int? _selectedSeason;
  List<dynamic> _episodes = [];
  bool _isLoadingEpisodes = false;

  @override
  void initState() {
    super.initState();
    _movie = widget.movie;
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    final apiService = ApiService();
    final details = await apiService.getMovieDetails(_movie.mediaType, _movie.id.toString());
    if (details != null) {
      if (mounted) {
        setState(() {
          // Preserve playback progress from search/trending results if not present in details
          final playback = _movie.playbackPosition;
          final dur = _movie.duration;
          
          _movie = details;
          
          if (playback != null && _movie.playbackPosition == null) {
             // Mixin the progress if details didn't return it
             _movie = Movie(
               id: _movie.id,
               title: _movie.title,
               name: _movie.name,
               overview: _movie.overview,
               posterPath: _movie.posterPath,
               backdropPath: _movie.backdropPath,
               mediaType: _movie.mediaType,
               voteAverage: _movie.voteAverage,
               releaseDate: _movie.releaseDate,
               firstAirDate: _movie.firstAirDate,
               videoUrl: _movie.videoUrl,
               overrideUrl: _movie.overrideUrl,
               jellyfinUrl: _movie.jellyfinUrl,
               introStart: _movie.introStart,
               introEnd: _movie.introEnd,
               hasAdminOverride: _movie.hasAdminOverride,
               recommendations: _movie.recommendations,
               seasons: _movie.seasons,
               isDownloaded: _movie.isDownloaded,
               localPath: _movie.localPath,
               playbackPosition: playback,
               duration: dur,
             );
          }
          
          _isLoading = false;
        });

        // If it's TV, load first season
        if (_movie.mediaType == 'tv' && _movie.seasons != null && _movie.seasons!.isNotEmpty) {
          final firstSeason = _movie.seasons!.firstWhere((s) => s['season_number'] > 0, orElse: () => _movie.seasons![0]);
          _handleSeasonChange(firstSeason['season_number']);
        }
      }
    } else {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleSeasonChange(int seasonNumber) async {
    setState(() {
      _selectedSeason = seasonNumber;
      _isLoadingEpisodes = true;
    });
    
    final apiService = ApiService();
    final data = await apiService.getTvSeason(_movie.id, seasonNumber);
    
    if (mounted) {
      setState(() {
        _episodes = data['episodes'] ?? [];
        _isLoadingEpisodes = false;
      });
    }
  }

  Future<void> _playEpisode(dynamic episode) async {
    final apiService = ApiService();
    setState(() => _isLoading = true);
    
    try {
      final deepDetails = await apiService.getMovieDetails('tv', _movie.id.toString(), s: _selectedSeason, e: episode['episode_number']);
      if (deepDetails != null) {
        final playUrl = deepDetails.videoUrl ?? deepDetails.overrideUrl ?? deepDetails.jellyfinUrl ?? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        
        // Find specific history for this episode
        final history = await apiService.getHistory(widget.userEmail);
        final episodeHistory = history.firstWhere(
          (h) => h.id == _movie.id && h.seasonNumber == _selectedSeason && h.episodeNumber == episode['episode_number'],
          orElse: () => Movie(id: -1, title: '', posterPath: '', mediaType: '', voteAverage: 0) // Dummy
        );

        if (mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => VideoPlayerScreen(
                userEmail: widget.userEmail,
                movie: Movie(
                  id: _movie.id,
                  title: "${_movie.displayTitle} - S$_selectedSeason E${episode['episode_number']}: ${episode['name']}",
                  mediaType: 'tv',
                  posterPath: _movie.posterPath,
                  voteAverage: _movie.voteAverage,
                  overview: episode['overview'],
                  playbackPosition: episodeHistory.id != -1 ? episodeHistory.playbackPosition : 0,
                  seasonNumber: _selectedSeason,
                  episodeNumber: episode['episode_number'],
                  episodeName: episode['name'],
                ),
                url: playUrl,
              ),
            ),
          ).then((_) => _fetchDetails());
        }
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _startPlayback({bool restart = false}) {
    final playUrl = _movie.videoUrl ?? _movie.overrideUrl ?? _movie.jellyfinUrl ?? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    
    // Create a copy of movie with 0 progress if restarting
    final movieToPlay = restart ? Movie(
      id: _movie.id,
      title: _movie.title,
      name: _movie.name,
      overview: _movie.overview,
      posterPath: _movie.posterPath,
      backdropPath: _movie.backdropPath,
      mediaType: _movie.mediaType,
      voteAverage: _movie.voteAverage,
      releaseDate: _movie.releaseDate,
      firstAirDate: _movie.firstAirDate,
      videoUrl: _movie.videoUrl,
      overrideUrl: _movie.overrideUrl,
      jellyfinUrl: _movie.jellyfinUrl,
      introStart: _movie.introStart,
      introEnd: _movie.introEnd,
      hasAdminOverride: _movie.hasAdminOverride,
      recommendations: _movie.recommendations,
      seasons: _movie.seasons,
      isDownloaded: _movie.isDownloaded,
      localPath: _movie.localPath,
      playbackPosition: 0,
      duration: _movie.duration,
    ) : _movie;

    ApiService().addToHistory(widget.userEmail, movieToPlay);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoPlayerScreen(
          movie: movieToPlay,
          url: playUrl,
          userEmail: widget.userEmail,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final movie = _movie;
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: MediaQuery.of(context).size.height * 0.6,
                pinned: true,
                backgroundColor: const Color(0xFF0A0A0B),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      movie.backdropPath != null && movie.backdropPath!.isNotEmpty 
                        ? Image.network(
                            'https://image.tmdb.org/t/p/original${movie.backdropPath}',
                            fit: BoxFit.cover,
                          )
                        : Container(color: Colors.grey[900]),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              Color(0xFF0A0A0B),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: MediaQuery.of(context).size.width > 600 ? 40 : 20,
                    vertical: MediaQuery.of(context).size.width > 600 ? 40 : 20,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.redAccent.withOpacity(0.1),
                              border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text('DETAILS', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.redAccent)),
                          ),
                          const SizedBox(width: 20),
                          Text('${movie.year} • ${movie.mediaType.toUpperCase()}', 
                            style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
                          if (movie.hasAdminOverride == true) ...[
                            const SizedBox(width: 10),
                            const Icon(Icons.verified, color: Colors.blue, size: 14),
                          ],
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text(
                        movie.displayTitle,
                        style: GoogleFonts.manrope(
                          fontSize: MediaQuery.of(context).size.width > 600 ? 52 : 32,
                          fontWeight: FontWeight.bold,
                          height: 1.1,
                          color: Colors.white,
                          letterSpacing: -1,
                        ),
                      ),
                      const SizedBox(height: 30),
                      if (movie.mediaType == 'movie')
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            SizedBox(
                              width: MediaQuery.of(context).size.width > 600 ? null : (MediaQuery.of(context).size.width - 52) / 2,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.redAccent,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  elevation: 8,
                                  shadowColor: Colors.redAccent.withOpacity(0.5),
                                ),
                                onPressed: () => _startPlayback(),
                                child: Text(
                                  (movie.playbackPosition != null && movie.playbackPosition! > 10) ? 'RESUME' : 'PLAY', 
                                  style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11)
                                ),
                              ),
                            ),
                            if (movie.playbackPosition != null && movie.playbackPosition! > 10)
                              SizedBox(
                                width: MediaQuery.of(context).size.width > 600 ? null : (MediaQuery.of(context).size.width - 52) / 2,
                                child: OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Colors.white30),
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  onPressed: () => _startPlayback(restart: true),
                                  child: const Text('RESTART', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11)),
                                ),
                              ),
                            SizedBox(
                              width: MediaQuery.of(context).size.width > 600 ? null : (MediaQuery.of(context).size.width - 52) / 2,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.white30),
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                onPressed: () {
                                  ApiService().addToWatchlist(widget.userEmail, movie);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Added to watchlist'), duration: Duration(seconds: 1))
                                  );
                                },
                                child: const Text('+ LIST', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11)),
                              ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 40),
                      const Text('OVERVIEW', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.white24)),
                      const SizedBox(height: 12),
                      Text(
                        movie.overview ?? '',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w300,
                          color: Colors.white70,
                          height: 1.5,
                        ),
                      ),
                      
                      // TV EPISODES SECTION
                      if (movie.mediaType == 'tv' && movie.seasons != null) ...[
                        const SizedBox(height: 40),
                        Row(
                          children: [
                            const Text('EPISODES', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.white24)),
                            const Spacer(),
                            DropdownButton<int>(
                              value: _selectedSeason,
                              dropdownColor: const Color(0xFF1A1A1B),
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                              underline: const SizedBox(),
                              items: movie.seasons!.map((s) {
                                return DropdownMenuItem<int>(
                                  value: s['season_number'],
                                  child: Text(s['name'] ?? 'Season ${s['season_number']}'),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) _handleSeasonChange(val);
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        if (_isLoadingEpisodes)
                          const Center(child: CircularProgressIndicator(color: Colors.redAccent))
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _episodes.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final ep = _episodes[index];
                              return InkWell(
                                onTap: () => _playEpisode(ep),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.03),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 80,
                                        height: 50,
                                        decoration: BoxDecoration(
                                          color: Colors.grey[900],
                                          borderRadius: BorderRadius.circular(6),
                                          image: ep['still_path'] != null 
                                          ? DecorationImage(
                                              image: NetworkImage('https://image.tmdb.org/t/p/w200${ep['still_path']}'),
                                              fit: BoxFit.cover,
                                            )
                                          : null,
                                        ),
                                        child: const Center(child: Icon(Icons.play_arrow, color: Colors.white24, size: 20)),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'EPISODE ${ep['episode_number']}', 
                                              style: const TextStyle(color: Colors.redAccent, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)
                                            ),
                                            Text(
                                              ep['name'] ?? '',
                                              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                      ],

                      const SizedBox(height: 60),
                      if (movie.recommendations != null && movie.recommendations!.isNotEmpty) ...[
                        _buildSectionHeader('SIMILAR TITLES'),
                        _buildHorizontalList(movie.recommendations!),
                        const SizedBox(height: 40),
                      ],
                      _buildSectionHeader('CURATED SQUAD'),
                      FutureBuilder<List<Movie>>(
                        future: ApiService().getTrending(),
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) return const SizedBox(height: 180);
                          return _buildHorizontalList(snapshot.data!);
                        }
                      ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ],
          ),
          if (_isLoading)
            Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator(color: Colors.redAccent)),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 4,
          color: Colors.white24,
        ),
      ),
    );
  }

  Widget _buildHorizontalList(List<Movie> movies) {
    return SizedBox(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: movies.length,
        itemBuilder: (context, index) {
          final movie = movies[index];
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => DetailsScreen(movie: movie, userEmail: widget.userEmail)),
              );
            },
            child: Container(
              width: 140,
              margin: const EdgeInsets.only(right: 20),
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage('https://image.tmdb.org/t/p/w500${movie.posterPath}'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _handleDownload(BuildContext context) async {
    final api = ApiService();
    final user = await api.getMe(widget.userEmail);
    if (user == null || user['is_premium'] != true) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF1A1A1B),
            title: Text('Premium Feature', style: GoogleFonts.manrope(color: Colors.white, fontSize: 32, )),
            content: const Text('Offline downloads are reserved for premium members. Upgrade now to watch your favorites anywhere.', style: TextStyle(color: Colors.white70, height: 1.5)),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('MAYBE LATER', style: TextStyle(color: Colors.white24, letterSpacing: 2))),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const CheckoutScreen()),
                  );
                },
                child: const Text('UPGRADE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, letterSpacing: 2)),
              ),
            ],
          ),
        );
      }
      return;
    }

    // Confirmation
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1B),
        title: Text('Secure Content', style: GoogleFonts.manrope(color: Colors.white, fontSize: 32, )),
        content: Text('Download "${widget.movie.displayTitle}" to your local vault for offline viewing?', style: const TextStyle(color: Colors.white70, height: 1.5)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('CANCEL', style: TextStyle(color: Colors.white24))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('INITIATE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))),
        ],
      ),
    );

    if (confirm != true) return;

    // Simulate download process
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Starting transfer to local vault...'), duration: Duration(seconds: 2))
      );

      // Simulate a progress dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => StatefulBuilder(
          builder: (context, setDialogState) {
            double progress = 0;
            Future.doWhile(() async {
              await Future.delayed(const Duration(milliseconds: 100));
              if (progress < 1.0) {
                setDialogState(() => progress += 0.05);
                return true;
              }
              return false;
            });

            return AlertDialog(
              backgroundColor: const Color(0xFF1A1A1B),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('SECURING CONTENT', style: GoogleFonts.manrope(color: Colors.white, fontSize: 24, )),
                  const SizedBox(height: 30),
                  LinearProgressIndicator(value: progress, backgroundColor: Colors.white10, color: Colors.redAccent),
                  const SizedBox(height: 10),
                  Text('${(progress * 100).toInt()}%', style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
              actions: [
                if (progress >= 1.0) 
                   TextButton(
                     onPressed: () async {
                       Navigator.pop(context); // Close progress dialog
                       
                       final api = ApiService();
                       String sourceUrl = widget.movie.videoUrl ?? widget.movie.overrideUrl ?? widget.movie.jellyfinUrl ?? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                       String fileName = "${widget.movie.id}_master.mp4";
                       
                       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Finalizing download...')));
                       
                       String? localPath = await api.downloadFile(sourceUrl, fileName);
                       
                       if (localPath != null) {
                           await api.addToDownloads(widget.userEmail, widget.movie, localPath: localPath);
                           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Content secured in local vault')));
                       } else {
                           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Download failed')));
                       }
                     },
                     child: const Text('FINALIZE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                   )
              ],
            );
          }
        ),
      );
    }
  }
}
