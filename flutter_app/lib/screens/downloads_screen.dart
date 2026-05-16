import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import 'details_screen.dart';

class DownloadsScreen extends StatefulWidget {
  final String userEmail;
  const DownloadsScreen({super.key, required this.userEmail});

  @override
  State<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends State<DownloadsScreen> {
  List<Movie> _downloadedItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDownloads();
  }

  Future<void> _loadDownloads() async {
    setState(() => _isLoading = true);
    final items = await ApiService().getDownloads(widget.userEmail);
    setState(() {
      _downloadedItems = items;
      _isLoading = false;
    });
  }

  Future<void> _removeDownload(int movieId) async {
    await ApiService().removeFromDownloads(widget.userEmail, movieId);
    _loadDownloads();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 60),
          Text(
            'OFFLINE VAULT',
            style: GoogleFonts.manrope(
              fontSize: 64,
              fontWeight: FontWeight.w800,
              letterSpacing: -2,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Your curated library available anywhere, anytime.'.toUpperCase(),
            style: const TextStyle(color: Colors.white24, letterSpacing: 2, fontSize: 10, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 60),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator(color: Colors.redAccent))
              : _downloadedItems.isEmpty 
                ? _buildEmptyState()
                : GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      childAspectRatio: 2/3,
                      crossAxisSpacing: 30,
                      mainAxisSpacing: 30,
                    ),
                    itemCount: _downloadedItems.length,
                    itemBuilder: (context, index) {
                      final movie = _downloadedItems[index];
                      return _buildDownloadCard(movie);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.download_for_offline_outlined, size: 80, color: Colors.white.withOpacity(0.05)),
          const SizedBox(height: 30),
          const Text('No content in the vault yet', style: TextStyle(color: Colors.white24, fontWeight: FontWeight.bold, letterSpacing: 2)),
          const SizedBox(height: 10),
          const Text('Movies and shows you download will appear here.', style: TextStyle(color: Colors.white10, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildDownloadCard(Movie movie) {
    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => DetailsScreen(movie: movie, userEmail: widget.userEmail)));
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          image: DecorationImage(
            image: NetworkImage('https://image.tmdb.org/t/p/w500${movie.posterPath}'),
            fit: BoxFit.cover,
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              bottom: 10,
              right: 10,
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => _removeDownload(movie.id),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                      child: const Icon(Icons.delete, size: 16, color: Colors.redAccent),
                    ),
                  ),
                  const SizedBox(width: 5),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                    child: const Icon(Icons.play_arrow, size: 16, color: Colors.white),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
