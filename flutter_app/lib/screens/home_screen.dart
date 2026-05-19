import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
import 'notification_screen.dart';
import 'affiliate_dashboard_screen.dart';

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
  List<dynamic> _ads = [];
  bool _isLoading = true;
  bool _isSidebarCollapsed = false;
  bool _isAdmin = false;
  bool _isPremium = false;
  bool _isAffiliate = false;
  String? _userEmail;
  final TextEditingController _emailController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadAuth();
  }

  Future<void> _loadAuth() async {
    final prefs = await SharedPreferences.getInstance();
    
    final email = prefs.getString('user_email');
    if (email != null) {
      if (mounted) {
        setState(() {
          _userEmail = email;
        });
        _loadData();
        _checkAdmin();
      }
    } else {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) return;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_email', email);
    
    if (mounted) {
      setState(() {
        _userEmail = email;
        _isLoading = true;
      });
      _loadData();
      _checkAdmin();
    }
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_email');
    if (mounted) {
      setState(() {
        _userEmail = null;
        _isAdmin = false;
        _selectedIndex = 0;
      });
    }
  }

  Future<void> _checkAdmin() async {
    if (_userEmail == null) return;
    final api = context.read<ApiService>();
    final user = await api.getMe(_userEmail!);
    if (user != null) {
      if (mounted) {
        setState(() {
          _isAdmin = user['is_admin'] == 1;
          _isPremium = user['is_premium'] == 1 || user['is_premium'] == true;
          _isAffiliate = user['is_affiliate'] == true || user['is_affiliate'] == 1;
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
      api.getHistory(_userEmail!),
      api.getActiveAds(),
    ]);

    setState(() {
      _trending = results[0] as List<Movie>;
      _action = results[1] as List<Movie>;
      _comedy = results[2] as List<Movie>;
      _horror = results[3] as List<Movie>;
      _upcoming = results[4] as List<Movie>;
      _recommendations = results[5] as List<Movie>;
      _ads = results[6] as List<dynamic>;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    bool isWide = MediaQuery.of(context).size.width > 900;
    bool showOverlay = !_isSidebarCollapsed && !isWide;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: Stack(
        children: [
          Row(
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
                    const SizedBox(height: 60),
                    _buildNavIcon(Icons.home_outlined, 0),
                    _buildNavIcon(Icons.search, 1),
                    _buildNavIcon(Icons.bookmark_outline, 2),
                    _buildNavIcon(Icons.download_for_offline_outlined, 3),
                    if (!_isPremium) _buildNavIcon(Icons.star_outline, 6),
                    if (_isAffiliate) _buildNavIcon(Icons.campaign_outlined, 8),
                    if (_isAdmin) _buildNavIcon(Icons.shield_outlined, 4),
                    const Spacer(),
                    const SizedBox(height: 20),
                    IconButton(
                      icon: const Icon(Icons.logout, color: Colors.white24),
                      onPressed: _handleLogout,
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),

              // Main Body
              Expanded(
                child: Stack(
                  children: [
                    AnimatedOpacity(
                      duration: const Duration(milliseconds: 300),
                      opacity: showOverlay ? 0.2 : 1.0,
                      child: AbsorbPointer(
                        absorbing: showOverlay,
                        child: _buildBody(),
                      ),
                    ),
                    // Floating Header for Notifications
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withOpacity(0.8),
                              Colors.transparent,
                            ],
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.search, color: Colors.white60, size: 26),
                                onPressed: () => setState(() => _selectedIndex = 1),
                              ),
                              IconButton(
                                icon: Stack(
                                  children: [
                                    const Icon(Icons.notifications_none, color: Colors.white60, size: 26),
                                    Positioned(
                                      right: 2,
                                      top: 2,
                                      child: Container(
                                        padding: const EdgeInsets.all(2),
                                        decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                                        constraints: const BoxConstraints(minWidth: 10, minHeight: 10),
                                      ),
                                    ),
                                  ],
                                ),
                                onPressed: () => setState(() => _selectedIndex = 7),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          if (_isSidebarCollapsed)
            Positioned(
              left: 20,
              top: 20,
              child: FloatingActionButton.small(
                backgroundColor: Colors.red[600]?.withOpacity(0.8),
                elevation: 0,
                onPressed: () => setState(() => _isSidebarCollapsed = false),
                child: const Icon(Icons.menu),
              ),
            ),
            
          if (showOverlay)
            Positioned.fill(
              child: GestureDetector(
                onTap: () => setState(() => _isSidebarCollapsed = true),
                child: Container(color: Colors.black.withOpacity(0.4)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_userEmail == null) return _buildLoginView();

    switch (_selectedIndex) {
      case 1:
        return SearchScreen(userEmail: _userEmail!);
      case 2:
        return WatchlistScreen(userEmail: _userEmail!);
      case 3:
        return DownloadsScreen(userEmail: _userEmail!);
      case 4:
        return const AdminDashboardScreen();
      case 5:
        return ProfileScreen(userEmail: _userEmail!, onLogout: _handleLogout);
      case 6:
        return PremiumScreen(userEmail: _userEmail!);
      case 7:
        return NotificationScreen(userEmail: _userEmail!);
      case 8:
        return AffiliateDashboardScreen(userEmail: _userEmail!);
      default:
        return _isLoading 
          ? const Center(child: CircularProgressIndicator(color: Colors.red))
          : CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                _buildHero(),
                if (_recommendations.isNotEmpty)
                  _buildContentSection('Recently Played', _recommendations),
                if (_ads.any((a) => a['placement'] == 'homepage'))
                  _buildAdBanner(_ads.firstWhere((a) => a['placement'] == 'homepage')),
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
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Stack(
        alignment: Alignment.center,
        children: [
          IconButton(
            icon: Icon(
              icon, 
              color: active ? Colors.red[600] : Colors.white24, 
              size: 22,
            ),
            onPressed: () {
              setState(() {
                _selectedIndex = index;
                _isSidebarCollapsed = true;
              });
            },
          ),
          if (active)
            Positioned(
              left: 0,
              child: Container(
                width: 3,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.red[600],
                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(4)),
                ),
              ),
            ),
        ],
      ),
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
                            builder: (context) => DetailsScreen(movie: movie, userEmail: _userEmail!),
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
                      onPressed: () {
                        context.read<ApiService>().addToWatchlist(_userEmail!, movie);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Added to watchlist'), duration: Duration(seconds: 1))
                        );
                      },
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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.manrope(fontSize: 22, )),
            const SizedBox(height: 15),
            SizedBox(
              height: 250,
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
    double progress = (movie.progressTime != null && movie.duration != null) ? (movie.progressTime! / movie.duration!) : 0;
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DetailsScreen(movie: movie, userEmail: _userEmail!),
          ),
        );
      },
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withOpacity(0.05)),
                      image: DecorationImage(
                        image: NetworkImage('https://image.tmdb.org/t/p/w500${movie.posterPath}'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  if (progress > 0)
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 3,
                        decoration: BoxDecoration(
                          color: Colors.white10,
                          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(8)),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: progress.clamp(0, 1),
                          child: Container(
                            decoration: const BoxDecoration(
                              color: Colors.redAccent,
                              borderRadius: BorderRadius.vertical(bottom: Radius.circular(8)),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
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

  Widget _buildLoginView() {
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 40),
            Text(
              'CINODE',
              style: GoogleFonts.manrope(
                fontSize: 48,
                
                fontWeight: FontWeight.w300,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'ACCESS PERSONAL CINEMA',
              style: TextStyle(fontSize: 10, letterSpacing: 4, color: Colors.white24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 60),
            const Text(
              'DIGITAL IDENTITY',
              style: TextStyle(fontSize: 8, letterSpacing: 2, color: Colors.white24, fontWeight: FontWeight.bold),
            ),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(
                hintText: 'EMAIL@DOMAIN.COM',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.05)),
                enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white12)),
                focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.redAccent)),
              ),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w300),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: const RoundedRectangleBorder(),
                ),
                onPressed: _handleLogin,
                child: const Text('SIGN IN / SIGN UP', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 10)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
