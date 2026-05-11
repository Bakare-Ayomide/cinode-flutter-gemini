import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import 'package:provider/provider.dart';
import 'details_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _controller = TextEditingController();
  List<Movie> _results = [];
  bool _isSearching = false;
  List<String> _history = [];

  void _onSearch(String query) async {
    if (query.isEmpty) return;
    setState(() {
      _isSearching = true;
      if (!_history.contains(query)) {
        _history.insert(0, query);
        if (_history.length > 5) _history.removeLast();
      }
    });
    
    final results = await ApiService().search(query);
    if (mounted) {
      setState(() { 
        _results = results; 
        _isSearching = false; 
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(40.0),
          child: TextField(
            controller: _controller,
            onSubmitted: _onSearch,
            style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'SEARCH CATALOG...',
              hintStyle: TextStyle(color: Colors.white10),
              border: InputBorder.none,
              prefixIcon: Padding(
                padding: EdgeInsets.only(right: 20),
                child: Icon(Icons.search, size: 32, color: Colors.white10),
              ),
            ),
          ),
        ),
        if (_results.isEmpty && !_isSearching && _history.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('RECENT SEARCHES', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.white24)),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: _history.map((h) => GestureDetector(
                    onTap: () {
                      _controller.text = h;
                      _onSearch(h);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        border: Border.all(color: Colors.white10),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(h, style: const TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  )).toList(),
                ),
              ],
            ),
          ),
        Expanded(
          child: _isSearching 
            ? const Center(child: CircularProgressIndicator(color: Colors.red))
            : GridView.builder(
                padding: const EdgeInsets.all(40),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: MediaQuery.of(context).size.width > 800 ? 5 : 2,
                  childAspectRatio: 0.7,
                  crossAxisSpacing: 20,
                  mainAxisSpacing: 20,
                ),
                itemCount: _results.length,
                itemBuilder: (context, index) => _buildMovieCard(_results[index]),
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
            builder: (context) => DetailsScreen(movie: movie),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage('https://image.tmdb.org/t/p/w500${movie.posterPath}'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
