import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import 'package:provider/provider.dart';
import 'details_screen.dart';
import 'search_screen.dart';
import 'watchlist_screen.dart';
import 'admin_dashboard_screen.dart';
import 'downloads_screen.dart';
import 'profile_screen.dart';
import 'premium_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  List<Movie> _trending = [];
  List<Movie> _action = [];
  List<Movie> _comedy = [];
  List<Movie> _horror = [];
  List<Movie> _upcoming = [];
  List<Movie> _recommendations = [];
  bool _isLoading = true;
  bool _isSidebarCollapsed = false;
  bool _isAdmin = false;
  final String _userEmail = "contactzerolord@gmail.com";

  @override
  void initState() {
    super.initState();
    _loadData();
    _checkAdmin();
  }

  Future<void> _checkAdmin() async {
    final api = context.read<ApiService>();
    final user = await api.getMe(_userEmail);
    if (user != null && user['is_admin'] == 1) {
      if (mounted) {
        setState(() {
          _isAdmin = true;
        });
      }
    }
  }

  Future<void> _loadData() async {
    final api = context.read<ApiService>();
    final results = await Future.wait([
      api.getTrending(),
      api.discover(genre: 28),
      api.discover(genre: 35),
      api.discover(genre: 27),
      api.discover(sortBy: 'release_date.desc'),
      api.getHistory(_userEmail),
    ]);

    setState(() {
      _trending = results[0];
      _action = results[1];
      _comedy = results[2];
      _horror = results[3];
      _upcoming = results[4];
      _recommendations = results[5];
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Sidebar Nav
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: _isSidebarCollapsed ? 0 : 80,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: Colors.white.withOpacity(0.1))),
              color: const Color(0xFF0A0A0B),
            ),
            child: Column(
              children: [
                const SizedBox(height: 40),
                GestureDetector(
                  onTap: () => setState(() => _isSidebarCollapsed = !_isSidebarCollapsed),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.red[600],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Text('C', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 60),
                _buildNavIcon(Icons.home_outlined, 0),
                _buildNavIcon(Icons.search, 1),
                _buildNavIcon(Icons.bookmark_outline, 2),
                _buildNavIcon(Icons.download_for_offline_outlined, 3),
                _buildNavIcon(Icons.star_outline, 6),
                if (_isAdmin) _buildNavIcon(Icons.shield_outlined, 4),
                const Spacer(),
                const Icon(Icons.logout, color: Colors.white24),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: () => setState(() => _selectedIndex = 5),
                  child: CircleAvatar(
                    radius: 16,
                    backgroundColor: _selectedIndex == 5 ? Colors.redAccent : Colors.orange,
                    child: _selectedIndex == 5 ? const Icon(Icons.person, size: 16, color: Colors.white) : null,
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
          
          if (_isSidebarCollapsed)
            Positioned(
              left: 20,
              top: 20,
              child: IconButton(
                icon: const Icon(Icons.menu, color: Colors.white),
                onPressed: () => setState(() => _isSidebarCollapsed = false),
              ),
            ),

          // Main Body
          Expanded(
            child: Stack(
              children: [
                _buildBody(),
                if (_isSidebarCollapsed)
                   Positioned(
                    left: 20,
                    top: 20,
                    child: FloatingActionButton.small(
                      backgroundColor: Colors.red[600],
                      onPressed: () => setState(() => _isSidebarCollapsed = false),
                      child: const Icon(Icons.menu),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 1:
        return const SearchScreen();
      case 2:
        return const WatchlistScreen();
      case 3:
        return const DownloadsScreen();
      case 4:
        return const AdminDashboardScreen();
      case 5:
        return const ProfileScreen();
      case 6:
        return const PremiumScreen();
      default:
        return _isLoading 
          ? const Center(child: CircularProgressIndicator(color: Colors.red))
          : CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                _buildHero(),
                if (_recommendations.isNotEmpty)
                  _buildContentSection('Recently Viewed', _recommendations),
                _buildContentSection('Trending Now', _trending.skip(1).toList()),
                _buildContentSection('Action Highlights', _action),
                _buildContentSection('Comedy Night', _comedy),
                _buildContentSection('Horror Essentials', _horror),
                _buildContentSection('New Releases', _upcoming),
              ],
            );
    }
  }

  Widget _buildNavIcon(IconData icon, int index) {
    bool active = _selectedIndex == index;
    return IconButton(
      icon: Icon(icon, color: active ? Colors.white : Colors.white24),
      onPressed: () => setState(() => _selectedIndex = index),
      padding: const EdgeInsets.symmetric(vertical: 20),
    );
  }

  Widget _buildHero() {
    if (_trending.isEmpty) return const SliverToBoxAdapter(child: SizedBox());
    final movie = _trending[0];
    
    return SliverToBoxAdapter(
      child: Stack(
        children: [
          Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: BoxDecoration(
              image: DecorationImage(
                image: NetworkImage('https://image.tmdb.org/t/p/original${movie.backdropPath}'),
                fit: BoxFit.cover,
                opacity: 0.6,
              ),
            ),
          ),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    const Color(0xFF0A0A0B),
                    const Color(0xFF0A0A0B).withOpacity(0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 60,
            left: 60,
            right: 60,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  movie.displayTitle,
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 84),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: 600,
                  child: Text(
                    movie.overview ?? '',
                    style: const TextStyle(color: Colors.white70, fontSize: 18, fontWeight: FontWeight.w300),
                    maxLines: 3,
                  ),
                ),
                const SizedBox(height: 40),
                Row(
                  children: [
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 25),
                        shape: const RoundedRectangleBorder(),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DetailsScreen(movie: movie),
                          ),
                        );
                      },
                      child: const Text('PLAY TRAILER', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
                    ),
                    const SizedBox(width: 20),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white30),
                        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 25),
                        shape: const RoundedRectangleBorder(),
                      ),
                      onPressed: () {},
                      child: const Text('+ ADD WATCHLIST', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 2)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentSection(String title, List<Movie> movies) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(60.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.playfairDisplay(fontSize: 32, fontStyle: FontStyle.italic)),
            const SizedBox(height: 40),
            SizedBox(
              height: 400,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: movies.length,
                itemBuilder: (context, index) => _buildMovieCard(movies[index]),
              ),
            ),
          ],
        ),
      ),
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
      child: Container(
        width: 240,
        margin: const EdgeInsets.only(right: 30),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Text(movie.year, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    const Icon(Icons.star, size: 10, color: Colors.yellow),
                    const SizedBox(width: 4),
                    Text(movie.voteAverage.toStringAsFixed(1), style: const TextStyle(color: Colors.white38, fontSize: 10)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
