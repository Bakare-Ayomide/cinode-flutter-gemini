import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'video_player_screen.dart';
import 'checkout_screen.dart';

class DetailsScreen extends StatefulWidget {
  final Movie movie;

  const DetailsScreen({super.key, required this.movie});

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> {
  late Movie _movie;
  bool _isLoading = true;

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
          _movie = details;
          _isLoading = false;
        });
      }
    } else {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final movie = _movie;
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: CustomScrollView(
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
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('DETAILS', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2)),
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
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      SizedBox(
                        width: MediaQuery.of(context).size.width > 600 ? null : (MediaQuery.of(context).size.width - 52) / 2,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () {
                            ApiService().addToHistory("contactzerolord@gmail.com", movie);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => VideoPlayerScreen(
                                  movie: movie,
                                  url: movie.videoUrl ?? movie.overrideUrl ?? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                                ),
                              ),
                            );
                          },
                          child: const Text('PLAY', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11)),
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
                            ApiService().addToWatchlist("contactzerolord@gmail.com", movie);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Added to watchlist'), duration: Duration(seconds: 1))
                            );
                          },
                          child: const Text('+ LIST', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11)),
                        ),
                      ),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white.withOpacity(0.05),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                              side: const BorderSide(color: Colors.white10),
                            ),
                            elevation: 0,
                          ),
                          onPressed: () => _handleDownload(context),
                          icon: const Icon(Icons.download_for_offline, size: 18),
                          label: const Text('DOWNLOAD', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 11)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                  const Text('OVERVIEW', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.white24)),
                  const SizedBox(height: 12),
                  Text(
                    movie.overview ?? '',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w300,
                      color: Colors.white70,
                      height: 1.5,
                    ),
                  ),
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
                MaterialPageRoute(builder: (context) => DetailsScreen(movie: movie)),
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
    final user = await api.getMe("contactzerolord@gmail.com");
    if (user == null || user['is_premium'] != true) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF1A1A1B),
            title: Text('Premium Feature', style: GoogleFonts.playfairDisplay(color: Colors.white, fontSize: 32, fontStyle: FontStyle.italic)),
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
        title: Text('Secure Content', style: GoogleFonts.playfairDisplay(color: Colors.white, fontSize: 32, fontStyle: FontStyle.italic)),
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
                  Text('SECURING CONTENT', style: GoogleFonts.playfairDisplay(color: Colors.white, fontSize: 24, fontStyle: FontStyle.italic)),
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
                       String sourceUrl = widget.movie.videoUrl ?? widget.movie.overrideUrl ?? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                       String fileName = "${widget.movie.id}_master.mp4";
                       
                       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Finalizing download...')));
                       
                       String? localPath = await api.downloadFile(sourceUrl, fileName);
                       
                       if (localPath != null) {
                           await api.addToDownloads("contactzerolord@gmail.com", widget.movie, localPath: localPath);
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
