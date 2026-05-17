import React, { useState, useEffect } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, AlertCircle, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieApi } from '../lib/api';
import { Notification } from '../types';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const fetchNotifications = async () => {
    try {
      const data = await movieApi.getNotifications();
      if (Array.isArray(data)) {
        const newUnread = data.filter((n: Notification) => !n.is_read);
        if (newUnread.length > unreadCount) {
            // New items arrived
            const latest = newUnread[0];
            window.dispatchEvent(new CustomEvent('app-notify', { 
                detail: { type: 'info', text: `New Signal: ${latest.title}` } 
            }));
        }
        setNotifications(data);
        setUnreadCount(newUnread.length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      // Fail silently or handle offline
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await movieApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read");
    }
  };

  const markAllRead = async () => {
    try {
      await movieApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
      case 'error': return <AlertCircle className="text-red-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-white/40 hover:text-white transition-all group pointer-events-auto"
        title="Notifications"
      >
        <Bell size={22} className={unreadCount > 0 ? "text-red-500 animate-pulse" : "group-hover:scale-110 transition-transform"} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#0A0A0B] shadow-[0_0_10px_rgba(220,38,38,0.5)]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0D0D0F] border border-white/5 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[10001] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-white/40 mb-1">Central Intelligence</h3>
                  <h2 className="text-xl font-serif italic text-white/90">Archive Signals</h2>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20"
                    >
                      Clear Log
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[60vh]">
                {notifications.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto border border-white/5">
                      <Bell size={32} className="text-white/10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/20">Vacuum State</p>
                      <p className="text-[8px] uppercase font-bold tracking-widest text-white/10">No incoming signals detected</p>
                    </div>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-6 border-b border-white/[0.02] hover:bg-white/[0.03] transition-all cursor-pointer relative group ${!notif.is_read ? 'bg-white/[0.01]' : ''}`}
                      onClick={() => {
                        markAsRead(notif.id);
                        setSelectedNotification(notif);
                      }}
                    >
                      {!notif.is_read && (
                        <div className="absolute top-8 right-8 w-2 h-2 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                      )}
                      <div className="flex gap-6">
                        <div className={`mt-0.5 p-3 rounded-2xl border transition-all ${!notif.is_read ? 'bg-red-600/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                          {getTypeIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black leading-tight uppercase tracking-widest transition-colors ${!notif.is_read ? 'text-white' : 'text-white/30'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-white/30 mt-2 leading-relaxed font-medium line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-4 opacity-30">
                            <span className="w-6 h-[1px] bg-white"></span>
                            <p className="text-[8px] text-white font-black uppercase tracking-widest">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-white/[0.01] border-t border-white/5">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all active:scale-95"
                  >Close Signal Log</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#121214] border border-white/5 rounded-3xl shadow-2xl z-[1101] overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-600/10 rounded-2xl border border-red-500/20">
                    {getTypeIcon(selectedNotification.type)}
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-[0.25em] italic font-serif text-white/90">Signal Intercept</h3>
                    <p className="text-[7px] text-white/20 font-black uppercase tracking-[0.3em] mt-0.5">PRIORITY: {selectedNotification.type.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-white/10 rounded-xl text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#0D0D0F]">
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-serif italic font-light tracking-tighter uppercase text-white">
                    {selectedNotification.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                      {new Date(selectedNotification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(selectedNotification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="w-full h-px bg-white/5" />
                
                <p className="text-sm text-white/60 leading-relaxed font-light whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="p-6 bg-white/[0.03] border-t border-white/5">
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="w-full py-4 bg-white text-black hover:bg-red-600 hover:text-white transition-all font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl active:scale-95 shadow-xl"
                >
                  Confirm Awareness
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
