import React, { useState, useEffect } from 'react';
import { movieApi } from '../lib/api';
import { Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Play, Trash2, Loader2, Search } from 'lucide-react';

const DownloadsScreen: React.FC = () => {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDownloads = async () => {
    try {
      setIsLoading(true);
      const data = await movieApi.getDownloads();
      setDownloads(data);
      setError(null);
    } catch (err) {
      setError('Failed to load local vault');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleRemove = async (id: number) => {
    try {
      await movieApi.removeFromDownloads(id);
      setDownloads(prev => prev.filter(d => d.movie_id !== id));
    } catch (err) {
      console.error('Remove failed', err);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-20 max-w-7xl mx-auto bg-transparent">
      <div className="space-y-4 mb-20">
        <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-white">
          Offline <span className="text-white/20">Vault</span>
        </h1>
        <p className="text-sm font-mono tracking-widest text-white/40 uppercase">
          Your curated library available anywhere, anytime.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-red-600" size={40} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Synchronizing Vault</p>
        </div>
      ) : error ? (
        <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-2xl text-center">
          <p className="text-red-500 font-bold uppercase text-[10px] tracking-widest">{error}</p>
          <button 
            onClick={fetchDownloads}
            className="mt-4 px-6 py-2 bg-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
          >
            Retry Connection
          </button>
        </div>
      ) : downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 gap-8 border border-white/5 bg-white/[0.02] rounded-3xl">
          <div className="p-8 bg-white/5 rounded-full">
            <Download size={60} className="text-white/10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-serif italic text-white">Your vault is empty</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Download titles to watch offline</p>
          </div>
          <button className="px-10 py-4 bg-white text-black font-bold uppercase text-[10px] tracking-widest rounded-full hover:scale-105 transition-all">
            Browse Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10">
          {downloads.map((movie) => (
            <motion.div 
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative"
            >
              <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/5 bg-white/5 relative">
                <img 
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 gap-4">
                  <button className="p-4 bg-white rounded-full text-black hover:scale-110 transition-all shadow-xl">
                    <Play fill="currentColor" size={24} />
                  </button>
                  <button 
                    onClick={() => handleRemove(movie.movie_id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 drop-shadow-md"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] font-bold uppercase tracking-widest text-white/80">
                   {movie.media_type}
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-xs font-bold truncate pr-10 text-white">{movie.title}</h3>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Downloaded</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadsScreen;
