import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  SkipForward,
  FastForward,
  Rewind,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  introStart?: number;
  introEnd?: number;
  onClose: () => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ 
  src, 
  poster, 
  title, 
  introStart, 
  introEnd,
  onClose 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const controlsTimeout = useRef<any>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current && !isNaN(time)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 10, duration);
      videoRef.current.currentTime = newTime;
    }
  };

  const rewind = () => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
    }
  };

  const skipIntro = () => {
    if (videoRef.current && introEnd) {
      videoRef.current.currentTime = introEnd;
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const showSkipIntro = introStart !== undefined && introEnd !== undefined && 
                     currentTime >= introStart && currentTime <= introEnd;

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden flex items-center justify-center">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onClick={togglePlay}
        playsInline
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="relative">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-20 h-20 border-4 border-white/10 border-t-red-600 rounded-full"
                />
                <Loader2 className="absolute inset-0 m-auto text-white animate-pulse" size={32} />
            </div>
            <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-[10px] font-bold uppercase tracking-[0.4em] text-white/60"
            >
                Optimizing Stream
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-gradient-to-t from-black/80 via-transparent to-black/60 flex flex-col justify-between"
          >
            {/* Top Bar */}
            <div className="p-6 md:p-10 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-xl md:text-3xl font-serif italic font-light tracking-tighter text-white/90">{title || 'Cinode Feature'}</h2>
                <div className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-bold uppercase rounded">4K HDR</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Digital Master</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-red-600 rounded-full transition-all"
              >
                <RotateCcw size={20} className="-scale-x-100" />
              </button>
            </div>

            {/* Middle: Skip Intro Button */}
            <div className="flex-1 flex items-center justify-center pointer-events-none">
              <AnimatePresence>
                {showSkipIntro && (
                  <motion.button
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    onClick={skipIntro}
                    className="pointer-events-auto absolute right-12 bottom-32 px-10 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-red-600 hover:border-red-600 transition-all active:scale-95 flex items-center gap-3"
                  >
                    Skip Intro <SkipForward size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Bar */}
            <div className="p-6 md:p-10 space-y-6">
              {/* Progress Slider */}
              <div className="relative group/seeker">
                <input 
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-red-600"
                />
                <div 
                    className="absolute top-0 left-0 h-1 bg-red-600 rounded-full pointer-events-none transition-all" 
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                  </button>
                  
                  <div className="flex items-center gap-6">
                    <button onClick={rewind} className="text-white/60 hover:text-white transition-colors">
                        <Rewind size={20} />
                    </button>
                    <button onClick={skipForward} className="text-white/60 hover:text-white transition-colors">
                        <FastForward size={20} />
                    </button>
                  </div>

                  <div className="text-[10px] font-mono tracking-widest text-white/60">
                    <span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 group/volume">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white">
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            setVolume(v);
                            if (videoRef.current) videoRef.current.volume = v;
                            setIsMuted(v === 0);
                        }}
                        className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 accent-red-600 appearance-none bg-white/20 rounded-full"
                    />
                  </div>
                  <button onClick={toggleFullscreen} className="text-white/60 hover:text-white">
                    <Maximize size={20} />
                  </button>
                  <button className="text-white/60 hover:text-white">
                    <Settings size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
