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
  Trash2,
  CheckCircle,
  AlertCircle,
  Gem,
  Bell,
  ArrowUpRight,
  Maximize,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieApi, setAuthEmail, getBaseUrl, discoverBackend } from './lib/api';
import { Movie, MovieDetails, Review, WatchlistItem } from './types';
import AdminDashboard from './components/AdminDashboard';
import DownloadsScreen from './components/DownloadsScreen';
import ProfileScreen from './components/ProfileScreen';
import { CustomVideoPlayer } from './components/CustomVideoPlayer';
import { NotificationBell } from './components/NotificationBell';
import { AdPlacement } from './components/AdPlacement';
import { CheckoutPage } from './components/CheckoutPage';
import { AffiliateDashboard } from './components/AffiliateDashboard';

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('cinode_user'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
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
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalNotify, setGlobalNotify] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  const showGlobalMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setGlobalNotify({ type, text });
    setTimeout(() => setGlobalNotify(null), 5000);
  };

  useEffect(() => {
    const handleNotify = (e: any) => {
        showGlobalMessage(e.detail.type, e.detail.text);
    };
    window.addEventListener('app-notify', handleNotify);
    return () => window.removeEventListener('app-notify', handleNotify);
  }, []);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [showPlayerScreen, setShowPlayerScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'watchlist' | 'search' | 'admin' | 'downloads' | 'profile' | 'affiliate'>('home');
  const [isPremium, setIsPremium] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
  const [publicSettings, setPublicSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<boolean>(true);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('cinode_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [focusIndex, setFocusIndex] = useState<{row: number, col: number}>({row: 0, col: 0});

  useEffect(() => {
    localStorage.setItem('cinode_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    // Splash screen timer
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 3000);
    
    const initApp = async () => {
      await discoverBackend();
      checkDbStatus();
      if (user) {
        setAuthEmail(user);
        fetchInitialData();
        checkAdminStatus();
        fetchPublicSettings();
      }
    };
    initApp();

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


  const checkAdminStatus = async () => {
    // Hardcoded fallback for the requested admin to ensure access
    if (user === 'earr.music@gmail.com' || user === 'contactzerolord@gmail.com') {
      setIsAdmin(true);
    }
    try {
      const data = await movieApi.getUserMe();
      setIsAdmin(data.is_admin);
      setIsPremium(data.is_premium);
      setIsAffiliate(data.is_affiliate);
    } catch (err) {
      setIsAdmin(false);
      setIsAffiliate(false);
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
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: {
           'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setDbStatus(data.dbConnected);
      if (!data.dbConnected) {
          setDbErrorMessage(data.dbError);
      } else {
          setDbErrorMessage(null);
      }
    } catch (err) {
      setDbStatus(false);
      setDbErrorMessage(`System Offline: Could not contact backend (${baseUrl}/api/health).`);
    }
  };

  const fetchRecs = async () => {
    try {
      const recommendedTitles = await movieApi.getRecommendations();
      
      if (!recommendedTitles || recommendedTitles.length === 0) {
        const trendingRes = await movieApi.getTrending();
        setRecs(trendingRes?.results?.slice(0, 5) || []);
        return;
      }

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
      try {
        const trendingRes = await movieApi.getTrending();
        setRecs(trendingRes.results.slice(0, 5));
      } catch (e) {}
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
        watchlistRes,
        historyRes
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
        movieApi.getWatchlist().catch(() => []), // Don't block whole UI if watchlist fails
        movieApi.getHistory().catch(() => [])
      ]);

      setTrending(trendingRes?.results || []);
      setTrendingTv(tvRes?.results || []);
      setActionMovies(actionRes?.results || []);
      setComedyMovies(comedyRes?.results || []);
      setHorrorMovies(horrorRes?.results || []);
      setSciFiMovies(sciFiRes?.results || []);
      setUsMovies(usRes?.results || []);
      setFrMovies(frRes?.results || []);
      setUpcoming(upcomingRes?.results || []);
      setRecentlyPlayed(Array.isArray(historyRes) ? historyRes : []);
      setWatchlist(Array.isArray(watchlistRes) ? watchlistRes : []);

      // Fetch recs separately to not block main UI
      fetchRecs();
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Failed to load content. Please check connection.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) return;
    setLoading(true);
    try {
      const res = await movieApi.login({ 
        email: emailInput, 
        password: passwordInput, 
        username: usernameInput,
        isSignUp 
      });
      if (rememberMe) {
          localStorage.setItem('cinode_user', emailInput);
      }
      setUser(emailInput);
    } catch (err: any) {
      alert(err.message || "Authentication failed");
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
      
      // Auto-add to history if results found and not already in first 3 positions
      if (data.results.length > 0 && !searchHistory.includes(val)) {
        setSearchHistory(prev => [val, ...prev.filter(h => h !== val)].slice(0, 5));
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleInAppDownload = async (movie: Movie) => {
    if (!isPremium) {
       setShowCheckout(true);
       return;
    }

    try {
        const isNative = window.location.protocol === 'capacitor:';
        
        if (isNative) {
            // For Native Apps: Show a real native download flow placeholder
            // In a full implementation, we'd use Capacitor Filesystem + Background Fetch
            showGlobalMessage('info', `Initializing secure download for ${movie.title || movie.name}...`);
            await movieApi.addToDownloads({
                movie_id: movie.id,
                title: movie.title || movie.name,
                poster_path: movie.poster_path,
                media_type: movie.media_type || 'movie'
            });
            setTimeout(() => showGlobalMessage('success', 'Title added to your local vault.'), 2000);
        } else {
            // Web flow
            await movieApi.addToDownloads({
                movie_id: movie.id,
                title: movie.title || movie.name,
                poster_path: movie.poster_path,
                media_type: movie.media_type || 'movie'
            });
            showGlobalMessage('success', 'Title added to your offline library.');
        }
    } catch (err) {
        showGlobalMessage('error', 'Download synchronization failed.');
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('cinode_search_history');
  };

  const openMovieDetails = async (movie: Movie) => {
    const type = movie.media_type || 'movie';
    setSelectedMovie(movie);
    setMovieDetails(null);
    setSelectedSeason(null);
    setEpisodes([]);
    
    try {
      const data = await movieApi.getDetails(type, movie.id);
      setMovieDetails(data);
      
      if (type === 'tv' && data.seasons && data.seasons.length > 0) {
        // Auto-fetch first season
        const firstSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
        if (firstSeason) {
          fetchSeason(movie.id, firstSeason.season_number);
        }
      }

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

  const fetchSeason = async (tvId: number, seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    setIsSeasonLoading(true);
    try {
      const data = await movieApi.getSeasonDetails(tvId, seasonNumber);
      setEpisodes(data.episodes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeasonLoading(false);
    }
  };

  const toggleWatchlist = async (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation();
    const isInWatchlist = Array.isArray(watchlist) && watchlist.some(w => w.movie_id === movie.id);
    try {
      if (isInWatchlist) {
        await movieApi.removeFromWatchlist(movie.id);
        setWatchlist(prev => Array.isArray(prev) ? prev.filter(w => w.movie_id !== movie.id) : []);
      } else {
        await movieApi.addToWatchlist({
          user_email: user,
          movie_id: movie.id,
          title: movie.title || movie.name,
          poster_path: movie.poster_path,
          media_type: movie.media_type || 'movie'
        });
        const updated = await movieApi.getWatchlist();
        setWatchlist(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isSplashVisible) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 font-sans">
         <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-8"
         >
            <div className="w-24 h-24 bg-red-600 rounded-2xl flex items-center justify-center mx-auto text-5xl font-bold text-white shadow-[0_0_50px_rgba(220,38,38,0.5)]">
              <img src="/assets/icon.png" alt="Cinode" className="w-16 h-16 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
              <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 absolute" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-serif italic text-white tracking-tighter">Cinode</h1>
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/20">The Vault of Cinematics</p>
            </div>
            <div className="w-12 h-[2px] bg-red-600 mx-auto mt-12 animate-pulse" />
         </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans text-[#E5E5E5]">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-12"
        >
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center mx-auto shadow-2xl shadow-red-600/40 relative">
               <img src="/assets/icon.png" alt="Icon" className="w-10 h-10 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
               <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 absolute" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-5xl font-serif italic font-light tracking-tighter uppercase">Cinode</h1>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 p-8 md:p-12 backdrop-blur-sm rounded-3xl shadow-2xl">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">{isSignUp ? 'Establish Identity' : 'Authenticate Entry'}</h2>
                <p className="text-xs font-medium text-white/60">{isSignUp ? 'Join the premium circle of cinemapiles.' : 'Unlock your curated vault of motion pictures.'}</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Codename (Username)</label>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-all font-medium text-sm placeholder:text-white/5 text-white"
                    placeholder="CHOOSE A CODENAME"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Digital Address (Email)</label>
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-all font-medium text-sm placeholder:text-white/5 text-white"
                  placeholder="EMAIL@DOMAIN.COM"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold block">Secret Key (Password)</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!emailInput) return alert("Please enter email first");
                        try {
                          await movieApi.forgotPassword(emailInput);
                          alert("A reset link has been simulated. Check your identity vault.");
                        } catch(e) { alert("Email not found"); }
                      }}
                      className="text-[9px] uppercase font-black tracking-widest text-red-500 hover:text-white transition-colors"
                    >
                      Leak Password?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-all font-medium text-sm placeholder:text-white/5 text-white"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <button 
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-10 h-5 rounded-full transition-all relative ${rememberMe ? 'bg-red-600' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${rememberMe ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-[10px] uppercase font-black text-white/20 tracking-widest">Persist Session</span>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-white/5"
              >
                {loading ? "INITIALIZING..." : (isSignUp ? "INITIALIZE ACCOUNT" : "AUTHENTICATE")}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-white/5 text-center">
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                >
                  {isSignUp ? 'Already identified? Sign In' : 'New to the vault? Create Profile'}
                </button>
            </div>
            
            {!dbStatus && (
              <div className="mt-8 p-4 bg-red-600/10 border border-red-600/20 rounded-2xl">
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-relaxed">
                  System Offline: {dbErrorMessage || "Identity server unreachable."}
                </p>
              </div>
            )}
          </div>
          
          <div className="text-center space-y-4">
             <p className="text-[8px] uppercase tracking-[0.4em] font-black text-white/10">Cinode Protocol v3.4.0</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#0A0A0B] text-[#E5E5E5] font-sans h-screen overflow-hidden selection:bg-red-600/30 relative">
      {/* Global Error Banner */}
      <AnimatePresence>
        {globalError && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[1000] w-[90%] max-w-lg bg-[#0D0D0E]/95 backdrop-blur-2xl text-white p-6 flex items-center justify-between shadow-[0_0_50px_rgba(220,38,38,0.3)] rounded-2xl border border-red-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-red-600 p-2.5 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <Shield size={20} className="text-white" />
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-red-500">System Alert</p>
                <p className="text-sm font-medium text-white/90 leading-tight">{globalError}</p>
              </div>
            </div>
            <button 
              onClick={() => setGlobalError(null)} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10 ml-4"
            >
              <X size={20} className="text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Sidebar Toggle - Optimized Position */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed bottom-6 right-6 z-[100] p-4 bg-red-600 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar Nav */}
      <nav className={`
        fixed md:relative inset-y-0 left-0 z-50 
        w-[80px] h-full border-r border-white/10 
        flex flex-col items-center py-8 justify-between 
        bg-[#0A0A0B] transition-transform duration-300
        overflow-y-auto no-scrollbar
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-6 items-center">
          <div className="space-y-5 flex flex-col items-center">
            <NavIcon active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }} icon={<Home size={20} />} />
            <NavIcon active={activeTab === 'search'} onClick={() => { setActiveTab('search'); setIsSidebarOpen(false); }} icon={<Search size={20} />} />
            <NavIcon active={activeTab === 'watchlist'} onClick={() => { setActiveTab('watchlist'); setIsSidebarOpen(false); }} icon={<Bookmark size={20} />} />
            <NavIcon active={activeTab === 'downloads'} onClick={() => { setActiveTab('downloads'); setIsSidebarOpen(false); }} icon={<Download size={20} />} />
            {isAffiliate && (
              <NavIcon active={activeTab === 'affiliate'} onClick={() => { setActiveTab('affiliate'); setIsSidebarOpen(false); }} icon={<ArrowUpRight size={20} />} />
            )}
            <NavIcon active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} icon={<User size={20} />} />
            {isAdmin && (
              <NavIcon active={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }} icon={<Shield size={20} className="text-red-600" />} />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center">
            {!isPremium && (
               <button 
                  onClick={() => setShowCheckout(true)}
                  className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 hover:scale-110 active:scale-95 transition-all group relative"
                  title="Upgrade to Premium"
               >
                  <Gem size={20} className="animate-pulse" />
                  <div className="absolute left-[110%] bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">UPGRADE</div>
               </button>
            )}
            <button onClick={handleLogout} className="text-white/40 hover:text-red-600 transition-colors">
                <LogOut size={20} />
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col overflow-y-auto no-scrollbar relative transition-opacity duration-300 ${isSidebarOpen ? 'opacity-20 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`}>
        {/* HUD Layer - Purely transparent floating icons anchored to viewport - Hidden on Movie Details */}
        {!selectedMovie && !playingMovie && activeTab !== 'admin' && (
          <div className="fixed top-0 right-0 p-6 md:p-12 flex items-center gap-6 z-[60] pointer-events-none">
              <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
                  <button 
                      onClick={() => setActiveTab('search')}
                      className="p-2 text-white/40 hover:text-white transition-all group"
                      title="Search Library"
                  >
                      <Search size={22} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <NotificationBell />
              </div>
          </div>
        )}

        {!dbStatus && (
            <div className="bg-red-600/10 border-b border-red-600/20 px-12 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">System Offline: {dbErrorMessage || 'Database in read-only mode.'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('profile')} className="text-[10px] font-bold uppercase tracking-widest text-white underline underline-offset-4 decoration-red-600/30 hover:decoration-red-600 transition-all">Configure Nexus</button>
                    <button onClick={checkDbStatus} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Retry Connection</button>
                </div>
            </div>
        )}
        {/* Global Notifications Overlay */}
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none w-full max-w-sm px-4">
            <AnimatePresence mode="wait">
            {globalNotify && (
                <motion.div 
                    key={globalNotify.text}
                    initial={{ opacity: 0, y: -40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className={`px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-2xl border flex items-center gap-4 pointer-events-auto border-white/10 ${
                        globalNotify.type === 'success' ? 'bg-green-500/10 text-green-500' : 
                        globalNotify.type === 'error' ? 'bg-red-500/10 text-red-500' : 
                        'bg-blue-500/10 text-blue-500'
                    }`}
                >
                    <div className={`p-2 rounded-2xl ${
                        globalNotify.type === 'success' ? 'bg-green-500/20' : 
                        globalNotify.type === 'error' ? 'bg-red-500/20' : 
                        'bg-blue-500/20'
                    }`}>
                        {globalNotify.type === 'success' ? <CheckCircle size={20} /> : 
                         globalNotify.type === 'error' ? <AlertCircle size={20} /> : 
                         <Info size={20} />}
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">System Alert</p>
                        <p className="text-xs font-bold tracking-tight leading-tight">{globalNotify.text}</p>
                    </div>
                    <button onClick={() => setGlobalNotify(null)} className="ml-auto p-1.5 hover:bg-white/5 rounded-xl transition-colors">
                        <X size={16} className="opacity-30 hover:opacity-100" />
                    </button>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

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
                      <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] uppercase tracking-[0.2em] font-bold text-white">Featured</span>
                      <span className="text-xs text-white/60 tracking-widest">{(trending[0].release_date || trending[0].first_air_date) ? new Date(trending[0].release_date || trending[0].first_air_date || '').getFullYear() : 'N/A'} • {trending[0].media_type?.toUpperCase()} • {trending[0].vote_average ? trending[0].vote_average.toFixed(1) : '0.0'} ★</span>
                    </div>
                    <h1 className="text-4xl md:text-9xl font-serif italic font-light tracking-tighter leading-none mb-6 text-white">
                      {trending[0].title || trending[0].name}
                    </h1>
                    <p className="text-[#E5E5E5]/70 text-lg md:text-xl max-w-2xl font-light leading-relaxed drop-shadow-sm line-clamp-3">
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
                {recentlyPlayed.length > 0 && (
                    <MovieRow 
                      title="Recently Played" 
                      items={recentlyPlayed.map(h => ({
                          id: Number(h.movie_id),
                          title: h.title,
                          poster_path: h.poster_path,
                          media_type: h.media_type,
                          progress_time: h.progress_time,
                          duration: h.duration,
                          overview: '',
                          backdrop_path: '',
                          vote_average: 0,
                          genre_ids: []
                      }))} 
                      onCardClick={openMovieDetails} 
                      onToggleWatchlist={toggleWatchlist} 
                      watchlist={watchlist} 
                    />
                )}

                {!isPremium && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative group cursor-pointer"
                    onClick={() => setShowCheckout(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                    <div className="relative bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                          <Gem size={120} />
                       </div>
                       <div className="space-y-3 relative z-10 text-center md:text-left">
                          <div className="flex items-center gap-2 justify-center md:justify-start">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Live Elevation</span>
                          </div>
                          <h2 className="text-3xl md:text-4xl font-serif italic font-light tracking-tighter uppercase italic">Unlock the Full Arsenal</h2>
                          <p className="text-white/40 text-xs font-medium max-w-md">Get 4K HDR, Offline Downloads, Ad-free browsing, and access to the Private Archive Overrides.</p>
                       </div>
                       <button className="px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-[0_20px_40px_rgba(220,38,38,0.3)] transition-all active:scale-95 whitespace-nowrap relative z-10">
                          Upgrade Now — ₦1,500
                       </button>
                    </div>
                  </motion.div>
                )}

                <AdPlacement placement="homepage" />
                {recs.length > 0 && (
                    <MovieRow title="Curated Recommendations" items={recs} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} isAI />
                )}
                <MovieRow title="Trending Now" items={trending.slice(1)} onCardClick={openMovieDetails} onToggleWatchlist={toggleWatchlist} watchlist={watchlist} />
                <AdPlacement placement="overlay" />
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
            <DownloadsScreen />
        )}

        {activeTab === 'profile' && user && (
            <ProfileScreen userEmail={user} onUpgrade={() => setShowCheckout(true)} onLogout={handleLogout} />
        )}

        {activeTab === 'affiliate' && (
            <AffiliateDashboard onBack={() => setActiveTab('home')} />
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
                 className="w-full bg-transparent border-b-2 border-white/10 py-10 pl-16 pr-24 text-3xl md:text-5xl focus:outline-none focus:border-red-600 transition-all font-serif italic tracking-tighter placeholder:text-white/5 uppercase text-white"
               />
               <button 
                 onClick={() => {
                   setSearchQuery('');
                   setSearchResults([]);
                   setActiveTab('home');
                 }}
                 className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-white/20 hover:text-white transition-all hover:scale-110 active:scale-95"
                 title="Cancel Search"
               >
                 <X size={32} />
               </button>
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
             ) : searchQuery.length === 0 && searchHistory.length > 0 ? (
                <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40">Recent Searches</h3>
                        <button 
                            onClick={clearSearchHistory}
                            className="text-[10px] uppercase font-bold tracking-[0.3em] text-red-600 hover:text-red-500 transition-colors"
                        >
                            Clear history
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {searchHistory.map((query, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSearch(query)}
                                className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 group rounded-sm text-white"
                            >
                                <History size={14} className="text-white/20 group-hover:text-red-600 transition-colors" />
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
             ) : (
                <div className="py-32 opacity-10 text-white">
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
               className="absolute inset-0 bg-white/90 bg-black/95 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-full h-full bg-[#0A0A0B] flex flex-col md:flex-row overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.1)] shadow-[0_0_100px_rgba(0,0,0,1)]"
            >
              <button 
                onClick={() => setSelectedMovie(null)}
                className="absolute right-8 top-8 z-50 p-3 bg-white/5 hover:bg-red-600 rounded-full transition-all hover:scale-110 text-white"
               >
                <X size={24} />
              </button>

              {/* Main Detail Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar pt-6 md:pt-0">
                <div className="h-[300px] md:h-[60vh] w-full relative">
                  <img src={BACKDROP_BASE + selectedMovie.backdrop_path} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-transparent to-transparent" />
                </div>
                
                <div className="px-6 md:px-20 -mt-20 md:-mt-32 relative space-y-10 md:space-y-20 pb-32">
                   <div className="space-y-6 md:space-y-10">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-gray-900/10 bg-white/10 rounded text-[8px] md:text-[10px] uppercase tracking-widest font-bold text-white">Details</span>
                            <span className="text-[10px] md:text-xs text-white/40">{(selectedMovie.release_date || selectedMovie.first_air_date) ? new Date(selectedMovie.release_date || selectedMovie.first_air_date || '').getFullYear() : 'N/A'} • {movieDetails?.runtime || '0'} MIN</span>
                        </div>
                        <h2 className="text-2xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tighter leading-tight lg:leading-[1] uppercase max-w-4xl text-white">
                            {selectedMovie.title || selectedMovie.name}
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-3 md:gap-8">
                            <button 
                                onClick={() => {
                                    setPlayingMovie(selectedMovie);
                                    setShowPlayerScreen(true);
                                }}
                                className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 bg-red-600 text-white font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs hover:bg-white hover:text-black transition-all active:scale-95 shadow-lg shadow-red-600/20"
                            >
                                Play Film
                            </button>
                            <button 
                                onClick={() => handleInAppDownload(selectedMovie)}
                                className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 bg-white/5 text-white font-bold uppercase tracking-[0.2em] text-[10px] md:text-[11px] flex items-center justify-center gap-2 md:gap-3 transition-all hover:bg-white/10 border border-white/10 active:scale-95"
                            >
                                <Download size={14} className="md:w-4 md:h-4" /> Offline Download
                            </button>
                            <button 
                                onClick={(e) => toggleWatchlist(e, selectedMovie)}
                                className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 border border-white/20 font-bold uppercase tracking-[0.2em] text-[10px] md:text-[11px] backdrop-blur-sm hover:bg-white/5 transition-all text-center text-white"
                            >
                                {watchlist.some(w => w.movie_id === selectedMovie?.id) ? 'Saved' : '+ List'}
                            </button>
                        </div>

                        <div className="grid md:grid-cols-12 gap-8 md:gap-12 pt-8 md:pt-10 border-t border-white/5">
                            <div className="md:col-span-8 space-y-6 md:space-y-8">
                                <p className="text-gray-600 text-[#E5E5E5]/70 text-sm md:text-base lg:text-lg font-light leading-relaxed font-serif">
                                    {selectedMovie.overview}
                                </p>
                                
                                <div className="space-y-6 md:space-y-8">
                                    <h3 className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold text-white/40">Cast</h3>
                                    <div className="flex flex-wrap gap-2 md:gap-4">
                                        {movieDetails?.credits?.cast?.slice(0, 6).map(c => (
                                            <div key={c.id} className="flex items-center gap-2 md:gap-3 bg-white/5 pr-3 md:pr-4 rounded-full border border-white/5">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200 bg-zinc-800">
                                                    {c.profile_path && <img src={IMAGE_BASE + c.profile_path} className="w-full h-full object-cover" />}
                                                </div>
                                                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white">{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-4 space-y-6 md:space-y-10 border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-12">
                                <div>
                                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-3 md:mb-4">Genre</div>
                                    <div className="flex flex-wrap gap-2">
                                        {movieDetails?.genres.map(g => (
                                            <span key={g.id} className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-white/5 px-2 md:px-3 py-1 rounded text-white">{g.name}</span>
                                        ))}
                                    </div>
                                </div>
                                {movieDetails?.production_countries[0] && (
                                    <div>
                                        <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/40 mb-2">Production</div>
                                        <div className="text-lg md:text-2xl font-serif font-light text-white">{movieDetails.production_countries[0].name}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TV Show Specific: Seasons and Episodes */}
                    {selectedMovie.media_type === 'tv' && movieDetails?.seasons && (
                        <div className="pt-20 space-y-12">
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm md:text-base uppercase tracking-[0.3em] font-bold text-white/40">Seasons</h3>
                                    <span className="text-[10px] text-white/20 uppercase tracking-widest">{movieDetails.seasons.length} Seasons</span>
                                </div>
                                <div className="flex flex-wrap gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2">
                                    {movieDetails.seasons.filter(s => s.season_number > 0).map(season => (
                                        <button 
                                            key={season.id}
                                            onClick={() => fetchSeason(selectedMovie.id, season.season_number)}
                                            className={`flex-none px-6 py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all border ${selectedSeason === season.season_number ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white'}`}
                                        >
                                            Season {season.season_number}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm md:text-base uppercase tracking-[0.3em] font-bold text-white/40">Episodes</h3>
                                    <span className="text-[10px] text-white/20 uppercase tracking-widest">{episodes.length} Episodes</span>
                                </div>
                                
                                {isSeasonLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                                        {[1,2,3,4,5,6].map(i => (
                                            <div key={i} className="h-40 bg-white/5 rounded-2xl border border-white/5" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {episodes.map(episode => (
                                            <motion.div 
                                                key={episode.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="group relative bg-[#121214] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer"
                                                onClick={() => {
                                                    const epMovie = { 
                                                        ...selectedMovie, 
                                                        title: `${selectedMovie.name || selectedMovie.title} - S${episode.season_number}E${episode.episode_number}: ${episode.name}`,
                                                        media_type: 'tv' as const
                                                    };
                                                    if (episode.video_url) {
                                                       setMovieDetails(prev => prev ? { ...prev, override_url: episode.video_url, intro_start: episode.intro_start, intro_end: episode.intro_end } : null);
                                                    } else {
                                                       // Reset overrides if episode doesn't have them
                                                       setMovieDetails(prev => prev ? { ...prev, override_url: undefined, intro_start: undefined, intro_end: undefined } : null);
                                                    }
                                                    setPlayingMovie(epMovie);
                                                    setShowPlayerScreen(true);
                                                }}
                                            >
                                                <div className="aspect-video w-full relative overflow-hidden">
                                                    {episode.still_path ? (
                                                        <img src={IMAGE_BASE + episode.still_path} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                            <Play size={32} className="text-white/10" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                                        <div className="space-y-1">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-red-500">Episode {episode.episode_number}</span>
                                                            <h4 className="text-[11px] md:text-sm font-bold text-white line-clamp-1">{episode.name}</h4>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                                            <Play size={14} fill="white" className="text-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                    {episode.has_admin_override && (
                                                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-[7px] font-black uppercase tracking-widest text-yellow-500 backdrop-blur-sm">Exclusive Source</div>
                                                    )}
                                                </div>
                                                <div className="p-4 space-y-2">
                                                    <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2 font-serif italic">{episode.overview || "No overview available for this episode."}</p>
                                                    <div className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'Unknown Air Date'}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                animate={{ opacity: showPlayerScreen ? 1 : 0 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[110] bg-black flex flex-col ${showPlayerScreen ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
                {showPlayerScreen && (
                    <div className="absolute top-6 left-6 z-50 flex items-center gap-6">
                        <button 
                            onClick={() => {
                                setShowPlayerScreen(false);
                                if (!isPiPActive) setPlayingMovie(null);
                            }}
                            className="p-3 bg-white/5 hover:bg-red-600 rounded-full text-white transition-all shadow-xl backdrop-blur-md"
                        >
                            <X size={24} />
                        </button>
                        <span className="font-serif italic text-2xl tracking-tighter text-white/90">{playingMovie.title || playingMovie.name}</span>
                    </div>
                )}
                
                <CustomVideoPlayer 
                  src={movieDetails?.override_url || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                  poster={BACKDROP_BASE + playingMovie.backdrop_path}
                  movieId={playingMovie.id}
                  mediaType={playingMovie.media_type || 'movie'}
                  title={playingMovie.title || playingMovie.name}
                  introStart={movieDetails?.intro_start}
                  introEnd={movieDetails?.intro_end}
                  onClose={() => {
                    setShowPlayerScreen(false);
                    if (!isPiPActive) setPlayingMovie(null);
                    fetchInitialData(); // Refresh history
                  }}
                  onPiPChange={setIsPiPActive}
                />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Screen */}
      <AnimatePresence>
        {showCheckout && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCheckout(false)}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm bg-[#0A0A0B] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] text-white">
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] italic font-serif">Premium Marketplace</h2>
                            <p className="text-[7px] text-white/20 font-black uppercase tracking-[0.3em] mt-0.5">Secure Transaction Portal</p>
                        </div>
                        <button 
                            onClick={() => setShowCheckout(false)}
                            className="p-1 px-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-red-500 transition-all flex items-center gap-1"
                        >
                            <span className="text-[8px] font-black uppercase tracking-widest">Close</span>
                            <X size={14} />
                        </button>
                    </div>
                    <div className="max-h-[85vh] overflow-y-auto no-scrollbar">
                        <CheckoutPage 
                            user={{ email: user! }} 
                            publicSettings={publicSettings}
                            onSuccess={() => {
                                setShowCheckout(false);
                                checkAdminStatus();
                            }} 
                            onBack={() => setShowCheckout(false)}
                        />
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Download App Modal */}
      <AnimatePresence>
        {showDownloadApp && (
            <DownloadAppModal onClose={() => setShowDownloadApp(false)} />
        )}
      </AnimatePresence>

      {/* Playback Mini-UI for PiP */}
      <AnimatePresence>
        {isPiPActive && !showPlayerScreen && (
            <motion.button 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                onClick={() => setShowPlayerScreen(true)}
                className="fixed bottom-24 right-8 z-[200] flex items-center gap-4 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all group"
            >
                <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Now Playing in PiP</span>
                    <span className="text-[10px] font-bold truncate max-w-[120px]">{playingMovie?.title || playingMovie?.name}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Maximize size={14} className="group-hover:scale-110 transition-transform" />
                </div>
            </motion.button>
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
        email: userEmail,
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
        className="relative w-full max-w-xl"
      >
        <button 
            onClick={onClose} 
            className="absolute -top-4 -right-4 md:-top-6 md:-right-6 p-4 bg-red-600 rounded-full text-white shadow-2xl shadow-red-600/40 hover:scale-110 transition-all active:scale-90 z-[130]"
        >
            <X size={24} />
        </button>

        <div className="bg-[#0D0D0E] border border-white/5 p-8 md:p-12 space-y-8 md:space-y-12 overflow-y-auto max-h-[90vh] no-scrollbar">
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
        </div>
      </motion.div>
    </div>
  );
}

function NavIcon({ active, onClick, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-all duration-300 relative group ${active ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-110' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      {active && <motion.div layoutId="nav-glow" className="absolute inset-x-0 -left-4 w-1 bg-red-600 h-8 top-1/2 -translate-y-1/2 rounded-r-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />}
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
    const progress = (movie.progress_time && movie.duration) ? (movie.progress_time / movie.duration) * 100 : 0;
  
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
          
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-red-600 transition-all" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          <button 
              onClick={(e) => onToggleWatchlist(e, movie)}
              className={`absolute top-4 right-4 p-2 rounded bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 ${isInWatchlist ? 'text-red-600 border-red-600/50' : ''}`}
          >
              {isInWatchlist ? <Bookmark size={16} className="fill-current" /> : <Plus size={16} />}
          </button>
  
          <div className="absolute bottom-4 left-0 right-0 p-4 bg-gradient-to-t from-black translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
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
                              value={comment || ''}
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

  function DownloadAppModal({ onClose }: { onClose: () => void }) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-[#0D0D0E] border border-white/5 p-12 space-y-10 text-center"
        >
          <div className="space-y-4">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-2xl shadow-red-600/40 mb-8">
                  <Download size={32} />
              </div>
              <h2 className="text-5xl font-serif italic font-light tracking-tighter uppercase italic">Offline Core</h2>
              <p className="text-white/40 text-sm font-light leading-relaxed">
                  High-bitrate cinematic downloads are exclusive to our mobile environment.
              </p>
          </div>

          <div className="space-y-6 pt-6">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">Available on iOS & Android</p>
              <a 
                  href="http://linkto.app" 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full bg-white text-black font-bold py-6 uppercase tracking-[0.2em] text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95"
              >
                  Download App
              </a>
              <button 
                  onClick={onClose}
                  className="text-[10px] uppercase tracking-widest font-bold text-white/20 hover:text-white transition-colors"
              >
                  Maybe Later
              </button>
          </div>
        </motion.div>
      </div>
    );
  }
