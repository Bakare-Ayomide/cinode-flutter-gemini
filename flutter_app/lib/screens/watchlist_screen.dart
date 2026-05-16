import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import 'package:provider/provider.dart';
import 'details_screen.dart';

class WatchlistScreen extends StatefulWidget {
  final String userEmail;
  const WatchlistScreen({super.key, required this.userEmail});

  @override
  State<WatchlistScreen> createState() => _WatchlistScreenState();
}

class _WatchlistScreenState extends State<WatchlistScreen> {
  List<Movie> _watchlist = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWatchlist();
  }

  Future<void> _loadWatchlist() async {
    final api = context.read<ApiService>();
    final list = await api.getWatchlist(widget.userEmail);
    setState(() {
      _watchlist = list;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(60.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(
                'MY COLLECTION',
                style: GoogleFonts.manrope(
                  fontSize: 72,
                  
                  fontWeight: FontWeight.w300,
                  letterSpacing: -4,
                ),
              ),
              Text(
                '${_watchlist.length} TITLES',
                style: const TextStyle(color: Colors.white24, fontWeight: FontWeight.bold, letterSpacing: 2),
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Colors.red))
            : _watchlist.isEmpty 
              ? const Center(child: Text('NOTHING IN COLLECTION', style: TextStyle(color: Colors.white10, letterSpacing: 8)))
              : GridView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 60),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 5,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 30,
                    mainAxisSpacing: 30,
                  ),
                  itemCount: _watchlist.length,
                  itemBuilder: (context, index) => _buildMovieCard(_watchlist[index]),
                ),
        ),
      ],
    );
  }

  Widget _buildMovieCard(Movie movie) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DetailsScreen(movie: movie, userEmail: widget.userEmail),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white.withOpacity(0.05)),
                image: DecorationImage(
                  image: NetworkImage('https://image.tmdb.org/t/p/w500${movie.posterPath}'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          const SizedBox(height: 15),
          Text(movie.displayTitle, maxLines: 1, overflow: TextOverflow.ellipsis, 
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}
