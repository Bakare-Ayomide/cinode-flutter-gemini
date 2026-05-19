import React, { useState, useEffect } from 'react';
import { movieApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Star, Settings, Bell, Lock, HelpCircle, Info, ChevronRight, LogOut } from 'lucide-react';

const ProfileScreen: React.FC<{ userEmail: string; onUpgrade: () => void; onLogout: () => void }> = ({ userEmail, onUpgrade, onLogout }) => {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    Notifications: { enabled: true, advanced: false },
    Privacy: { enabled: true, advanced: false },
    Playback: { enabled: true, advanced: false },
    Audio: { enabled: true, advanced: false },
    Support: { enabled: true, advanced: false }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await movieApi.getUserMe();
        setUserData(data);
        if (data.settings) {
          setSettings((prev: any) => ({ ...prev, ...data.settings }));
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await movieApi.updateUserSettings(settings);
      setActiveDetail(null);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (category: string, field: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isPremium = userData?.is_premium || userData?.is_admin;

  const preferences = [
    { icon: <Bell size={18} />, label: 'Notifications', desc: 'Manage alerts and push messages' },
    { icon: <Lock size={18} />, label: 'Privacy', desc: 'Control your visibility and data' },
    { icon: <Settings size={18} />, label: 'Playback', desc: 'Adjust streaming quality and speed' },
    { icon: <Info size={18} />, label: 'Audio', desc: 'Sound effects and language settings' },
    { icon: <HelpCircle size={18} />, label: 'Support', desc: 'Get help and report issues' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 md:py-20 px-4 md:px-6 space-y-8 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AnimatePresence>
        {activeDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#111113] border border-white/10 rounded-3xl p-8 md:p-12 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-serif italic text-white uppercase">{activeDetail}</h3>
                  <p className="text-[10px] font-mono text-white/30 tracking-widest mt-1">CONFIGURATION MODULE</p>
                </div>
                <button 
                  onClick={() => setActiveDetail(null)}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-white/80">Enable {activeDetail} Engine</p>
                        <p className="text-[10px] text-white/30 mt-1">Activate system-level optimization</p>
                    </div>
                    <button 
                      onClick={() => activeDetail && toggleSetting(activeDetail, 'enabled')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${activeDetail && settings[activeDetail]?.enabled ? 'bg-red-600' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${activeDetail && settings[activeDetail]?.enabled ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-white/80">Advanced Mode</p>
                        <p className="text-[10px] text-white/30 mt-1">Unlock scrupulous overrides</p>
                    </div>
                    <button 
                      onClick={() => activeDetail && toggleSetting(activeDetail, 'advanced')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${activeDetail && settings[activeDetail]?.advanced ? 'bg-red-600' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${activeDetail && settings[activeDetail]?.advanced ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Synchronizing...' : 'Sync Changes'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 md:space-y-4">
        <h1 className="text-4xl md:text-8xl font-serif font-semibold tracking-tighter text-white">
          The <span className="text-white/20">Identity</span>
        </h1>
        <p className="text-[8px] md:text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase font-bold">Account Intelligence & Configuration</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 bg-white/[0.02] border border-white/5 p-6 md:p-10 rounded-2xl md:rounded-3xl backdrop-blur-3xl">
        <div className="relative group">
          <div className="w-24 h-24 md:w-40 md:h-40 bg-zinc-900 rounded-full flex items-center justify-center border-2 border-white/10 group-hover:border-red-600/50 transition-all overflow-hidden">
            <User size={48} className="text-white/10 group-hover:text-red-600/20 transition-all md:scale-125" />
          </div>
          {isPremium && (
            <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 p-1.5 md:p-2 bg-yellow-500 rounded-full text-black shadow-xl">
               <Star size={12} className="md:w-4 md:h-4" fill="currentColor" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-3 md:space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl font-serif font-medium text-white truncate max-w-[280px] md:max-w-none">{userEmail}</h2>
            <p className="text-[8px] md:text-[10px] font-mono tracking-widest text-white/40 uppercase">User Index: #{userData?.id || '0000'}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
             <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest border ${isPremium ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
               {isPremium ? 'Premium Archive Member' : 'Free Access Account'}
             </span>
             {userData?.is_admin && (
               <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-red-600/10 border border-red-600/20 text-red-600">
                 System Administrator
               </span>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6 md:space-y-8">
           <h3 className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Preferences</h3>
           <div className="space-y-3 md:space-y-4">
              {preferences.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveDetail(item.label)}
                  className="w-full flex items-center justify-between p-4 md:p-5 bg-white/[0.02] border border-white/5 rounded-xl md:rounded-2xl hover:bg-white/[0.05] transition-all group"
                >
                   <div className="flex items-center gap-3 md:gap-4 text-gray-600 text-white/60 group-hover:text-gray-900 group-hover:text-white transition-colors">
                      {item.icon}
                      <div className="text-left">
                        <span className="block text-xs md:text-sm font-medium">{item.label}</span>
                        <span className="block text-[8px] md:text-[10px] text-white/20 group-hover:text-gray-500 group-hover:text-white/40 transition-colors uppercase tracking-widest">{item.desc}</span>
                      </div>
                   </div>
                   <ChevronRight size={14} className="text-gray-300 text-white/10 group-hover:text-gray-500 group-hover:text-white/40 translate-x-0 group-hover:translate-x-1 transition-all md:w-4 md:h-4" />
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-6 md:space-y-8">
           <h3 className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">System</h3>
           <div className="space-y-3 md:space-y-4">
              <div className="p-6 md:p-8 bg-gradient-to-br from-red-600/10 to-transparent border border-red-600/20 rounded-2xl md:rounded-3xl space-y-4 md:space-y-6">
                 <div className="space-y-1 md:space-y-2">
                    <p className="text-red-500 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Cinema License</p>
                    <h4 className="text-lg md:text-xl font-serif font-medium text-white">Cinode Ultimate</h4>
                    <p className="text-[10px] md:text-xs text-white/40 leading-relaxed max-w-[240px] md:max-w-none">Your license grants access to 4K Master Streams, Unlimited Vault Storage, and Priority CDN access.</p>
                 </div>
                 <button 
                    onClick={onUpgrade}
                    className="w-full py-3 md:py-4 bg-red-600 text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-white hover:text-black transition-all shadow-lg shadow-red-600/20"
                 >
                    Manage Subscription
                 </button>
              </div>

              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 md:gap-3 p-4 md:p-5 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 rounded-xl md:rounded-2xl transition-all font-bold uppercase tracking-widest text-[8px] md:text-[10px]"
              >
                 <LogOut size={14} className="md:w-4 md:h-4" /> LOGOUT
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
