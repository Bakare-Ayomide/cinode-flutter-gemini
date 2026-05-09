import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Home, 
  Bookmark, 
  Play, 
  Star, 
  Info, 
  X, 
  History,
  TrendingUp,
  User,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Plus,
  Check,
  Menu,
  Shield,
  Download,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieApi, setAuthEmail } from './lib/api';
import { Movie, MovieDetails, Review, WatchlistItem } from './types';
import AdminDashboard from './components/AdminDashboard';
import { CustomVideoPlayer } from './components/CustomVideoPlayer';
import { GoogleGenAI } from "@google/genai";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('cinode_user'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [trending, setTrending] = useState<Movie[]>([]);
  const [trendingTv, setTrendingTv] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [usMovies, setUsMovies] = useState<Movie[]>([]);
  const [frMovies, setFrMovies] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [recs, setRecs] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'watchlist' | 'search' | 'admin' | 'downloads'>('home');
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [publicSettings, setPublicSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<{row: number, col: number}>({row: 0, col: 0});

  useEffect(() => {
    checkDbStatus();
    if (user) {
      setAuthEmail(user);
      fetchInitialData();
      checkAdminStatus();
      fetchPublicSettings();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // D-pad Navigation Enhancement
        const activeEl = document.activeElement;
        if (activeEl && activeEl.closest('.snap-x')) {
          const container = activeEl.closest('.snap-x') as HTMLElement;
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            // Let the card focus change naturally, but ensure container scrolls
            setTimeout(() => {
              const newActive = document.activeElement as HTMLElement;
              if (newActive && (newActive.closest('.snap-x') === container || newActive.tagName === 'BUTTON')) {
                newActive.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            }, 50);
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl && activeEl.tabIndex === 0 && !['BUTTON', 'INPUT', 'TEXTAREA'].includes(activeEl.tagName)) {
          e.preventDefault();
          activeEl.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  useEffect(() => {
    if (playingMovie) {
      const videoEl = document.querySelector('video');
      if (videoEl && videoEl.requestFullscreen) {
        videoEl.requestFullscreen().catch(() => {
          // Ignore if blocked by browser
        });
      }
      
      // Try to lock orientation if supported
      if (screen.orientation && (screen.orientation as any).lock) {
        (screen.orientation as any).lock('landscape').catch(() => {
          // Ignore if not supported (e.g. desktop or non-mobile)
        });
      }
    }
  }, [playingMovie]);

  const checkAdminStatus = async () => {
    // Hardcoded fallback for the requested admin to ensure access
    if (user === 'earr.music@gmail.com' || user === 'contactzerolord@gmail.com') {
      setIsAdmin(true);
    }
    try {
      const data = await movieApi.getUserMe();
      setIsAdmin(data.is_admin);
      setIsPremium(data.is_premium);
    } catch (err) {
      setIsAdmin(false);
    }
  };

  const fetchPublicSettings = async () => {
    try {
      const data = await movieApi.getPublicSettings();
      setPublicSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWheel = (e: React.WheelEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollLeft += e.deltaY;
    }
  };

  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data.dbConnected);
    } catch (err) {
      setDbStatus(false);
    }
  };

  const fetchRecs = async () => {
    try {
      const history = await movieApi.getHistory();
      if (!history || history.length === 0) {
        const trendingRes = await movieApi.getTrending();
        setRecs(trendingRes.results.slice(0, 5));
        return;
      }

      const titles = history.map(h => h.title).join(", ");
      const apiKey = (process.env as any).GEMINI_API_KEY;

      if (!apiKey) {
        const trendingRes = await movieApi.getTrending();
        setRecs(trendingRes.results.slice(0, 5));
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Based on these movies/TV shows: ${titles}, recommend 5 similar popular titles. 
      Return ONLY a JSON array of strings (the titles). No markdown, no explanation.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const responseText = result.text || "[]";
      const recommendedTitles = JSON.parse(responseText.replace(/```json|```/g, "").trim());

      const movieDetails = await Promise.all(
        recommendedTitles.map(async (title: string) => {
          try {
            const searchData = await movieApi.search(title);
            return searchData.results[0];
          } catch (e) {
            return null;
          }
        })
      );

      setRecs(movieDetails.filter(m => m !== null));
    } catch (err) {
      console.error("Recs error:", err);
      const trendingRes = await movieApi.getTrending();
      setRecs(trendingRes.results.slice(0, 5));
    }
  };

  const fetchInitialData = async () => {
    try {
      const [
        trendingRes, 
        tvRes, 
        actionRes, 
        comedyRes, 
        horrorRes, 
        sciFiRes, 
        usRes, 
        frRes, 
        upcomingRes,
        watchlistRes
      ] = await Promise.all([
        movieApi.getTrending(),
        movieApi.getTvTrending(),
        movieApi.discover({ with_genres: 28 }), // Action
        movieApi.discover({ with_genres: 35 }), // Comedy
        movieApi.discover({ with_genres: 27 }), // Horror
        movieApi.discover({ with_genres: 878 }), // Sci-Fi
        movieApi.discover({ region: 'US', sort_by: 'popularity.desc' }),
        movieApi.discover({ region: 'FR', sort_by: 'popularity.desc' }),
        movieApi.discover({ sort_by: 'release_date.desc' }),
        movieApi.getWatchlist()
      ]);

      setTrending(trendingRes.results);
      setTrendingTv(tvRes.results);
      setActionMovies(actionRes.results);
      setComedyMovies(comedyRes.results);
      setHorrorMovies(horrorRes.results);
      setSciFiMovies(sciFiRes.results);
      setUsMovies(usRes.results);
      setFrMovies(frRes.results);
      setUpcoming(upcomingRes.results);
      setWatchlist(watchlistRes);

      // Fetch recs separately to not block main UI
      fetchRecs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) return;
    setLoading(true);
    try {
      await movieApi.login(emailInput);
      localStorage.setItem('cinode_user', emailInput);
      setUser(emailInput);
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cinode_user');
    setUser(null);
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      const data = await movieApi.search(val);
      setSearchResults(data.results);
    } else {
      setSearchResults([]);
    }
  };

  const openMovieDetails = async (movie: Movie) => {
    const type = movie.media_type || 'movie';
    setSelectedMovie(movie);
    setMovieDetails(null);
    try {
      const data = await movieApi.getDetails(type, movie.id);
      setMovieDetails(data);
      // Add to history
      if (user) {
        await movieApi.addToHistory({
          user_email: user,
          movie_id: movie.id,
          title: movie.title || movie.name,
          poster_path: movie.poster_path,
          media_type: type
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWatchlist = async (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation();
    const isInWatchlist = watchlist.some(w => w.movie_id === movie.id);
    try {
      if (isInWatchlist) {
        await movieApi.removeFromWatchlist(movie.id);
        setWatchlist(prev => prev.filter(w => w.movie_id !== movie.id));
      } else {
        await movieApi.addToWatchlist({
          user_email: user,
          movie_id: movie.id,
          title: movie.title || movie.name,
          poster_path: movie.poster_path,
          media_type: movie.media_type || 'movie'
        });
        const updated = await movieApi.getWatchlist();
        setWatchlist(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans text-[#E5E5E5]">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-12 text-center"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto text-3xl font-bold text-white shadow-2xl shadow-red-600/40">C</div>
            <h1 className="text-5xl font-serif italic font-light tracking-tighter uppercase">Cinode</h1>
          </div>
          
          <div className="space-y-8 bg-white/[0.02] border border-white/5 p-12 backdrop-blur-sm">
            <div className="space-y-2">
                <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-white/40">Access Personal Cinema</h2>
                <p className="text-sm font-light text-white/60">Enter your credentials to continue the journey.</p>
                {!dbStatus && (
                  <div className="mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded">
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                      Database Connection Timeout (ETIMEDOUT). <br/>
                      Check firewall settings on 156.232.88.10
                    </p>
                  </div>
                )}
            </div>
            
            <form onSubmit={handleLogin} className="space-y-8 text-left">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Digital Identity</label>
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 py-3 focus:outline-none focus:border-red-600 transition-all font-light text-lg placeholder:text-white/5"
                  placeholder="EMAIL@DOMAIN.COM"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-5 uppercase tracking-[0.2em] text-xs hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? "AUTHENTICATING..." : "Enter Cinema"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#0A0A0B] text-[#E5E5E5] font-sans h-screen overflow-hidden selection:bg-red-600/30 relative">
      {/* Mobile Sidebar Toggle - Optimized Position */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed bottom-6 right-6 z-[100] p-4 bg-red-600 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Left Sidebar Nav */}
      <nav className={`
        fixed md:relative inset-y-0 left-0 z-50 
        w-[80px] h-full border-r border-white/10 
        flex flex-col items-center py-8 justify-between 
        bg-[#0A0A0B] transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-10 items-center">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-red-600/20">C</div>
          <div className="space-y-8 flex flex-col items-center">
            <NavIcon active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={22} />} />
            <NavIcon active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search size={22} />} />
            <NavIcon active={activeTab === 'watchlist'} onClick={() => setActiveTab('watchlist')} icon={<Bookmark size={22} />} />
            <NavIcon active={activeTab === 'downloads'} onClick={() => setActiveTab('downloads')} icon={<Download size={22} />} />
            {isAdmin && (
              <NavIcon active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield size={22} className="text-red-600" />} />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-6 items-center">
            <button onClick={handleLogout} className="text-white/40 hover:text-red-600 transition-colors">
                <LogOut size={22} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shadow-lg"></div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
        {!dbStatus && (
            <div className="bg-red-600/10 border-b border-red-600/20 px-12 py-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Database Offline: Watchlist and Reviews are in read-only/demo mode.</p>
                <button onClick={checkDbStatus} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Retry Connection</button>
            </div>
        )}
        {activeTab === 'home' && (
          <div className="pb-32">
            {/* Hero Section */}
            {trending[0] && (
              <section className="relative h-[85vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-transparent to-transparent z-10" />
                <img 
                  src={BACKDROP_BASE + trending[0].backdrop_path} 
                  className="absolute inset-0 w-full h-full object-cover"
                  alt={trending[0].title}
                />
                
                <div className="relative z-20 h-full flex flex-col justify-end p-6 md:p-12 max-w-5xl">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] uppercase tracking-[0.2em] font-bold">Featured</span>
                      <span className="text-xs text-white/60 tracking-widest">{(trending[0].release_date || trending[0].first_air_date) ? new Date(trending[0].release_date || trending[0].first_air_date || '').getFullYear() : 'N/A'} • {trending[0].media_type?.toUpperCase()} • {trending[0].vote_average ? trending[0].vote_average.toFixed(1) : '0.0'} ★</span>
                    </div>
                    <h1 className="text-4xl md:text-9xl font-serif italic font-light tracking-tighter leading-none mb-6">
                      {trending[0].title || trending[0].name}
                    </h1>
                    <p className="text-[#E5E5E5]/70 text-lg md:text-xl max-w-2xl font-light leading-relaxed drop-shadow-lg line-clamp-3">
                      {trending[0].overview}
                    </p>
                    <div className="flex items-center gap-6 pt-4">
                      <button 
                        onClick={() => openMovieDetails(trending[0])}
                        className="px-10 py-4 bg-white text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95"
                      >
                        Play Trailer
                      </button>
                      <button 
                        onClick={(e) => toggleWatchlist(e, trending[0])}
                        className="px-8 py-4 border border-white/30 font-bold uppercase tracking-[0.2em] text-xs backdrop-blur-sm hover:bg-white/10 transition-all"
                      >
                        {watchlist.some(w => w.movie_id === trending[0].id) ? 'In Watchlist' : '+ Add Watchlist'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* Content Rows - 10 Sections */}
            <div className="px-6 md:px-12 py-8 space-y-10">
                {recs.length > 0 && (
                    <MovieRow title="Curated Recommendations" items={recs} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} isAI />
                )}
                <MovieRow title="Trending Now" items={trending.slice(1)} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Must-Watch Series" items={trendingTv} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Action Highlights" items={actionMovies} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Comedy Night" items={comedyMovies} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Horror Essentials" items={horrorMovies} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Sci-Fi Adventures" items={sciFiMovies} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Popular in US" items={usMovies} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Popular in France" items={frMovies} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <MovieRow title="Upcoming Releases" items={upcoming} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
            </div>
          </div>
        )}

        {/* Other tabs omitted for brevity, adding back logic-wise */}
        {activeTab === 'watchlist' && (
             <div className="px-6 md:px-12 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-end border-b border-white/10 pb-8">
               <h2 className="text-6xl font-serif italic font-light tracking-tighter uppercase italic">My Collection</h2>
               <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5E5E5]/40">{watchlist.length} TITLES</span>
             </div>
             {watchlist.length === 0 ? (
               <div className="py-32 text-center border border-white/5 bg-white/[0.02]">
                 <p className="text-white/20 text-xs uppercase tracking-[0.2em] font-bold">Your collection is empty.</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                 {watchlist.map((item) => (
                   <div key={item.id} className="relative group">
                    <MovieCard 
                      movie={{
                          id: item.movie_id,
                          title: item.title,
                          poster_path: item.poster_path,
                          media_type: item.media_type,
                          overview: '',
                          backdrop_path: '',
                          vote_average: 0,
                          genre_ids: []
                      }} 
                      onClick={() => openMovieDetails({
                          id: item.movie_id,
                          title: item.title,
                          poster_path: item.poster_path,
                          media_type: item.media_type,
                          overview: '',
                          backdrop_path: '',
                          vote_average: 0,
                          genre_ids: []
                      })}
                      onToggleWatchlist={toggleWatchlist}
                      watchlist={watchlist}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); movieApi.removeFromWatchlist(item.id).then(fetchInitialData); }}
                      className="absolute top-2 right-2 p-2 bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {activeTab === 'downloads' && (
            <div className="px-6 md:px-12 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end border-b border-white/10 pb-8">
                    <h2 className="text-6xl font-serif italic font-light tracking-tighter uppercase italic">Offline Vault</h2>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5E5E5]/40">Secured Titles</span>
                </div>
                <div className="flex flex-col items-center justify-center py-40 space-y-8 bg-white/[0.01] border border-dashed border-white/5">
                    <Download size={48} className="text-white/5" />
                    <div className="text-center space-y-2">
                        <p className="text-white/20 text-xs uppercase tracking-[0.2em] font-bold">The vault is currently sealed.</p>
                        <p className="text-[10px] text-white/10 font-light">Content downloaded for offline viewing will emerge here.</p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'search' && (
             <div className="px-6 md:px-12 py-12 space-y-16 animate-in fade-in duration-500">
             <div className="relative max-w-4xl">
               <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20" size={32} />
               <input 
                 autoFocus
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => handleSearch(e.target.value)}
                 placeholder="SEARCH TITLES..."
                 className="w-full bg-transparent border-b-2 border-white/10 py-10 pl-16 pr-8 text-5xl focus:outline-none focus:border-red-600 transition-all font-serif italic tracking-tighter placeholder:text-white/5 uppercase"
               />
             </div>
 
             {searchResults.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                 {searchResults.filter(m => m && m.id && m.poster_path).map((movie) => (
                   <MovieCard 
                     key={movie.id} 
                     movie={movie} 
                     onClick={() => openMovieDetails(movie)}
                     onToggleWatchlist={toggleWatchlist}
                     watchlist={watchlist}
                   />
                 ))}
               </div>
             ) : (
                <div className="py-32 opacity-10">
                    <TrendingUp size={100} strokeWidth={1} />
                </div>
             )}
           </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminDashboard />
        )}
      </main>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedMovie && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 lg:p-12">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedMovie(null)}
               className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-full h-full bg-[#0A0A0B] flex flex-col md:flex-row overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]"
            >
              <button 
                onClick={() => setSelectedMovie(null)}
                className="absolute right-8 top-8 z-50 p-3 bg-white/5 hover:bg-red-600 rounded-full transition-all hover:scale-110"
               >
                <X size={24} />
              </button>

              {/* Main Detail Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="h-[400px] md:h-[60vh] w-full relative">
                  <img src={BACKDROP_BASE + selectedMovie.backdrop_path} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-transparent to-transparent" />
                </div>
                
                <div className="px-12 md:px-20 -mt-20 relative space-y-20 pb-32">
                   <div className="space-y-10">
                        <div className="flex items-center gap-4">
                            <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] uppercase tracking-widest font-bold">Details</span>
                            <span className="text-xs text-white/40">{(selectedMovie.release_date || selectedMovie.first_air_date) ? new Date(selectedMovie.release_date || selectedMovie.first_air_date || '').getFullYear() : 'N/A'} • {movieDetails?.runtime || '0'} MIN</span>
                        </div>
                        <h2 className="text-4xl md:text-9xl font-serif italic font-light tracking-tighter leading-[0.8] uppercase italic max-w-4xl">
                            {selectedMovie.title || selectedMovie.name}
                        </h2>
                        
                        <div className="flex items-center gap-8">
                            <button 
                                onClick={() => setPlayingMovie(selectedMovie)}
                                className="px-10 py-4 bg-white text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95"
                            >
                                Play Film
                            </button>
                            <button 
                                onClick={() => {
                                    if (isPremium) {
                                        alert("Initiating offline transfer...");
                                    } else {
                                        setShowUpgrade(true);
                                    }
                                }}
                                className="px-10 py-5 bg-white text-black font-bold uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all hover:bg-neutral-200 active:scale-95 shadow-[0_0_40px_-5px_rgba(255,255,255,0.1)]"
                            >
                                <Download size={16} /> {isPremium ? 'Download Offline' : 'Unlock Downloads'}
                            </button>
                            <button 
                                onClick={(e) => toggleWatchlist(e, selectedMovie)}
                                className="px-10 py-5 border border-white/20 font-bold uppercase tracking-[0.2em] text-[11px] backdrop-blur-sm hover:bg-white/5 transition-all"
                            >
                                {watchlist.some(w => w.movie_id === selectedMovie?.id) ? 'Remove List' : '+ Add List'}
                            </button>
                        </div>

                        <div className="grid md:grid-cols-12 gap-12 pt-10 border-t border-white/5">
                            <div className="md:col-span-8 space-y-10">
                                <p className="text-[#E5E5E5]/80 text-2xl font-light leading-relaxed font-serif italic">
                                    {selectedMovie.overview}
                                </p>
                                
                                <div className="space-y-8">
                                    <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/40">Cast</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {movieDetails?.credits?.cast?.slice(0, 8).map(c => (
                                            <div key={c.id} className="flex items-center gap-3 bg-white/5 pr-4 rounded-full border border-white/5">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                                                    {c.profile_path && <img src={IMAGE_BASE + c.profile_path} className="w-full h-full object-cover" />}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-4 space-y-10 border-l border-white/5 pl-12">
                                <div>
                                    <div className="text-xs uppercase tracking-widest text-white/40 mb-4">Genre</div>
                                    <div className="flex flex-wrap gap-2">
                                        {movieDetails?.genres.map(g => (
                                            <span key={g.id} className="text-[10px] font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded">{g.name}</span>
                                        ))}
                                    </div>
                                </div>
                                {movieDetails?.production_countries[0] && (
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/40 mb-2">Production</div>
                                        <div className="text-2xl font-serif italic font-light">{movieDetails.production_countries[0].name}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                   </div>

                    {/* Recommendations Sections */}
                    <div className="pt-20 space-y-20">
                        {movieDetails?.recommendations?.results && movieDetails.recommendations.results.filter((m: any) => m && m.id).length > 0 && (
                            <MovieRow 
                                title="Similar Cinema" 
                                items={movieDetails.recommendations.results.filter((m: any) => m && m.id).slice(0, 12)} 
                                onCardClick={openMovieDetails} 
                                onToggleWatchlist={toggleWatchlist} 
                                watchlist={watchlist} 
                            />
                        )}

                        <MovieRow title="Curated for You" items={trending.slice(0, 10)} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                        <MovieRow title="Critically Acclaimed TV" items={trendingTv.slice(0, 10)} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                        <MovieRow title="Archive Additions" items={trending.slice(10, 20)} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Player Screen */}
      <AnimatePresence>
        {playingMovie && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black flex flex-col"
            >
                <div className="absolute top-6 left-6 z-50 flex items-center gap-6">
                    <button 
                        onClick={() => setPlayingMovie(null)}
                        className="p-3 bg-white/5 hover:bg-red-600 rounded-full text-white transition-all shadow-xl backdrop-blur-md"
                    >
                        <X size={24} />
                    </button>
                    <span className="font-serif italic text-2xl tracking-tighter text-white/90">{playingMovie.title || playingMovie.name}</span>
                </div>
                
                <CustomVideoPlayer 
                  src={movieDetails?.override_url || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                  poster={BACKDROP_BASE + playingMovie.backdrop_path}
                  title={playingMovie.title || playingMovie.name}
                  introStart={movieDetails?.intro_start}
                  introEnd={movieDetails?.intro_end}
                  onClose={() => setPlayingMovie(null)}
                />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Overlay */}
      <AnimatePresence>
        {showUpgrade && (
            <UpgradeOverlay 
                publicSettings={publicSettings}
                userEmail={user}
                onClose={() => setShowUpgrade(false)}
                onSuccess={() => {
                    setShowUpgrade(false);
                    setIsPremium(true);
                    checkAdminStatus(); // Refresh status
                }}
            />
        )}
      </AnimatePresence>
    </div>
  );
}

function UpgradeOverlay({ publicSettings, userEmail, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  
  const handleCheckout = async () => {
    setLoading(true);
    try {
      await movieApi.checkout({
        user_email: userEmail,
        plan: 'Monthly premium',
        transaction_id: `WEB-${Date.now()}`
      });
      onSuccess();
    } catch (e) {
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-xl bg-[#0D0D0E] border border-white/5 p-12 space-y-12"
      >
        <button onClick={onClose} className="absolute right-8 top-8 text-white/20 hover:text-white transition-colors">
            <X size={20} />
        </button>

        <div className="space-y-4">
            <h2 className="text-6xl font-serif italic font-light tracking-tighter uppercase italic">Premium Access</h2>
            <p className="text-white/40 text-sm font-light">Unlock the vault. Cinema without boundaries.</p>
        </div>

        <div className="space-y-8">
            <div className="flex items-baseline gap-4">
                <span className="text-5xl font-serif italic">${publicSettings?.premium_price_monthly || '9.99'}</span>
                <span className="text-xs uppercase tracking-widest text-white/20 font-bold">Per Month</span>
            </div>
            
            <div className="space-y-4">
                {[
                    'Master Vault Access',
                    'Offline Cinematic Download',
                    '4K Ultra HD Streaming',
                    'Early Access to Curations'
                ].map((f, i) => (
                    <div key={i} className="flex items-center gap-4 text-xs uppercase tracking-widest font-bold">
                        <Check size={14} className="text-red-500" />
                        <span>{f}</span>
                    </div>
                ))}
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Payment Instructions</p>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded text-xs text-white/60">
                    {publicSettings?.payment_info || 'PayPal: admin@example.com'}
                </div>
            </div>
        </div>

        <button 
            disabled={loading}
            onClick={handleCheckout}
            className="w-full bg-red-600 text-white font-bold py-6 uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-50"
        >
            {loading ? 'Processing Transaction...' : 'Complete Upgrade'}
        </button>
      </motion.div>
    </div>
  );
}

function NavIcon({ active, onClick, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-all duration-300 ${active ? 'bg-white/10 text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
    >
      {icon}
    </button>
  );
}

function MovieRow({ title, items, onCardClick, onToggleWatchlist, watchlist, isAI }: { 
      title: string, 
      items: Movie[], 
      onCardClick: (m: Movie) => void,
      onToggleWatchlist: (e: any, m: Movie) => void,
      watchlist: WatchlistItem[],
      isAI?: boolean
  }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      const handleScroll = () => {
        setShowLeftArrow(el.scrollLeft > 20);
      };

      el.addEventListener('scroll', handleScroll);
      
      // Auto-scroll logic
      const interval = setInterval(() => {
        if (el) {
          if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
            el.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            el.scrollBy({ left: 200, behavior: 'smooth' });
          }
        }
      }, 3000); // Scroll every 3 seconds

      return () => {
        el.removeEventListener('scroll', handleScroll);
        clearInterval(interval);
      };
    }, []);

    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const amount = direction === 'left' ? -400 : 400;
        scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      }
    };

    const handleWheel = (e: React.WheelEvent) => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += e.deltaY;
      }
    };

    return (
      <section className="space-y-4 overflow-hidden group/row relative">
        <div className="flex justify-between items-end mb-2">
            <h3 className="text-xl md:text-2xl font-serif italic text-white/90">{title}</h3>
            {isAI ? (
                <div className="px-2 py-0.5 bg-red-600/10 border border-red-600/20 rounded text-[10px] font-bold text-red-500 uppercase tracking-widest">
                    AI
                </div>
            ) : (
                <span className="text-[10px] uppercase tracking-widest text-white/40 cursor-pointer hover:text-white">View All</span>
            )}
        </div>

        <div className="relative">
          {/* Navigation Arrows */}
          <AnimatePresence>
            {showLeftArrow && (
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/60 backdrop-blur-md rounded-r-xl border-r border-y border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-red-600"
              >
                <ChevronLeft size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-black/60 backdrop-blur-md rounded-l-xl border-l border-y border-white/10 text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-red-600"
          >
            <ChevronRight size={18} />
          </button>

          <div 
            ref={scrollRef}
            onWheel={handleWheel}
            className="flex gap-4 md:gap-8 overflow-x-auto pb-6 no-scrollbar px-1 snap-x snap-mandatory scroll-smooth"
          >
            {items.filter(m => m && m.id).map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                onClick={() => onCardClick(movie)} 
                onToggleWatchlist={onToggleWatchlist}
                watchlist={watchlist}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  function MovieCard({ movie, onClick, onToggleWatchlist, watchlist }: any) {
    const isInWatchlist = watchlist.some(w => w.movie_id === movie.id);
  
    return (
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        className="flex-shrink-0 w-32 md:w-56 group relative cursor-pointer snap-start outline-none focus:ring-4 focus:ring-red-600 transition-all rounded-lg"
        onClick={onClick}
        tabIndex={0}
      >
        <div className="relative aspect-[2/3] bg-zinc-900 overflow-hidden border border-white/5 group-hover:border-white/20 transition-all duration-500 shadow-xl">
          <img 
            src={IMAGE_BASE + movie.poster_path} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
            alt={movie.title}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          
          <button 
              onClick={(e) => onToggleWatchlist(e, movie)}
              className={`absolute top-4 right-4 p-2 rounded bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 ${isInWatchlist ? 'text-red-600 border-red-600/50' : ''}`}
          >
              {isInWatchlist ? <Bookmark size={16} className="fill-current" /> : <Plus size={16} />}
          </button>
  
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <p className="text-[10px] font-bold uppercase tracking-widest truncate">{movie.title || movie.name}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center px-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{(movie.release_date || movie.first_air_date) ? new Date(movie.release_date || movie.first_air_date || '').getFullYear() : 'N/A'}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500/60">
            <Star size={10} className="fill-current" /> {movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'}
          </div>
        </div>
      </motion.div>
    );
  }
  
  function ReviewsSection({ movie, userEmail }: { movie: Movie, userEmail: string }) {
      const [reviews, setReviews] = useState<Review[]>([]);
      const [rating, setRating] = useState(5);
      const [comment, setComment] = useState('');
      const [submitting, setSubmitting] = useState(false);
  
      useEffect(() => {
          fetchReviews();
      }, [movie.id]);
  
      const fetchReviews = async () => {
          try {
              const data = await movieApi.getReviews(movie.media_type || 'movie', movie.id);
              setReviews(data);
          } catch (err) {
              console.error(err);
          }
      };
  
      const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!comment.trim()) return;
          setSubmitting(true);
          try {
              await movieApi.postReview({
                  user_email: userEmail,
                  movie_id: movie.id,
                  media_type: movie.media_type || 'movie',
                  rating,
                  comment
              });
              setComment('');
              fetchReviews();
          } catch (err) {
              console.error(err);
          } finally {
              setSubmitting(false);
          }
      };
  
      return (
          <section className="space-y-16 pt-20 border-t border-white/5">
              <div className="flex flex-col lg:flex-row gap-20">
                  {/* Form */}
                  <div className="w-full lg:w-1/3 space-y-10">
                      <div>
                        <h3 className="text-4xl font-serif italic font-light mb-4">Reviews</h3>
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Write Your Critic</p>
                      </div>
                      <form onSubmit={handleSubmit} className="bg-white/5 p-8 rounded border border-white/5 space-y-8">
                          <div className="space-y-4">
                              <div className="flex gap-4">
                                  {[1, 2, 3, 4, 5].map(s => (
                                      <button 
                                          type="button" 
                                          key={s} 
                                          onClick={() => setRating(s)}
                                          className={`transition-all hover:scale-110 ${rating >= s ? 'text-yellow-500' : 'text-white/10'}`}
                                      >
                                          <Star size={24} className="fill-current" />
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <textarea 
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded p-6 focus:outline-none focus:border-white/30 min-h-[150px] text-sm text-white/60 leading-relaxed font-sans"
                              placeholder="Your analysis..."
                          />
                          <button 
                              disabled={submitting}
                              className="w-full bg-white text-black font-bold py-4 uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                          >
                              {submitting ? "Publishing..." : "Post Review"}
                          </button>
                      </form>
                  </div>
  
                  {/* List */}
                  <div className="flex-1 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {reviews.length === 0 ? (
                              <div className="col-span-2 py-20 text-center border border-white/5 bg-white/[0.01]">
                                <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">No criticism logged yet.</p>
                              </div>
                          ) : (
                              reviews.filter(r => r && r.id).map(r => (
                                  <div key={r.id} className="p-6 bg-white/5 rounded space-y-4">
                                      <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 truncate max-w-[150px]">{r.user_email}</span>
                                          <span className="text-[10px] text-yellow-500 font-bold">★ {Number(r.rating || 0).toFixed(1)}</span>
                                      </div>
                                      <p className="text-white/60 text-xs leading-relaxed font-light italic">
                                        "{r.comment}"
                                      </p>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          </section>
      );
  }
