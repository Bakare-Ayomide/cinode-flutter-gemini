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

  void _onSearch(String query) async {
    if (query.isEmpty) return;
    setState(() => _isSearching = true);
    // Note: Need to add search to ApiService
    // For now mocking or assuming api has it
    // final results = await context.read<ApiService>().search(query);
    // setState(() { _results = results; _isSearching = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(60.0),
          child: TextField(
            controller: _controller,
            onSubmitted: _onSearch,
            style: GoogleFonts.playfairDisplay(fontSize: 48, fontStyle: FontStyle.italic),
            decoration: const InputDecoration(
              hintText: 'SEARCH CATALOG...',
              hintStyle: TextStyle(color: Colors.white10),
              border: InputBorder.none,
              prefixIcon: Padding(
                padding: EdgeInsets.only(right: 20),
                child: Icon(Icons.search, size: 48, color: Colors.white10),
              ),
            ),
          ),
        ),
        Expanded(
          child: _isSearching 
            ? const Center(child: CircularProgressIndicator(color: Colors.red))
            : GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 60),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  childAspectRatio: 0.7,
                  crossAxisSpacing: 30,
                  mainAxisSpacing: 30,
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
