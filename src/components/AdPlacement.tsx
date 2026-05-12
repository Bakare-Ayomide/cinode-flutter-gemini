import React, { useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieApi } from '../lib/api';
import { Ad } from '../types';

interface AdPlacementProps {
  placement: string;
  className?: string;
  isPremium?: boolean;
  onClose?: () => void;
  onSkip?: () => void;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({ 
  placement, 
  className = "", 
  isPremium = false,
  onClose,
  onSkip 
}) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isPremium) return;

    const fetchAd = async () => {
      try {
        const ads = await movieApi.getActiveAds();
        if (Array.isArray(ads)) {
            const filtered = ads.filter((a: Ad) => a.placement === placement);
            if (filtered.length > 0) {
            // Weighted random or just highest priority
            setAd(filtered[0]);
            movieApi.trackAd(filtered[0].id, 'impression').catch(() => {});
            }
        }
      } catch (err) {
        // Ads are optional, fail silently
      }
    };

    fetchAd();
  }, [placement, isPremium]);

  if (isPremium || !ad || !isVisible) return null;

  const handleClick = () => {
    movieApi.trackAd(ad.id, 'click');
    if (ad.click_url) {
      window.open(ad.click_url, '_blank');
    }
  };

  const renderContent = () => {
    switch (ad.type) {
      case 'image':
        return (
          <img 
            src={ad.media_url} 
            alt={ad.name} 
            className="w-full h-full object-cover rounded-xl cursor-pointer"
            onClick={handleClick}
          />
        );
      case 'video':
        return (
          <video 
            src={ad.media_url} 
            autoPlay 
            muted 
            loop 
            className="w-full h-full object-cover rounded-xl cursor-pointer"
            onClick={handleClick}
          />
        );
      case 'html':
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: ad.html_content || '' }} 
            className="w-full h-full overflow-auto cursor-pointer"
            onClick={handleClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group ${className}`}
    >
      {onClose && (
        <button 
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="absolute -top-2 -right-2 z-10 p-1 bg-black/80 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
      
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
        {renderContent()}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] uppercase font-black tracking-wider text-white">
                Ad
            </span>
            {ad.click_url && (
                <button 
                    onClick={handleClick}
                    className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                    <ExternalLink size={12} />
                </button>
            )}
        </div>
      </div>
    </motion.div>
  );
};
