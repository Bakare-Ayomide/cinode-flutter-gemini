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
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
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
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-[#0D0D0E]/80 backdrop-blur-md rounded-xl border border-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all hover:scale-105 active:scale-95 shadow-lg group"
        title="Notifications"
      >
        <Bell size={22} className={unreadCount > 0 ? "text-red-500" : "group-hover:scale-110 transition-transform"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#121214] border border-gray-200 border-white/5 rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-[0.25em] italic font-serif text-white/90">Archive Terminal</h3>
                  <p className="text-[7px] text-white/20 font-black uppercase tracking-[0.3em] mt-0.5">{unreadCount} UNREAD ENTRIES</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-md transition-all"
                    >
                      Purge Unread
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="max-h-[50vh] overflow-y-auto no-scrollbar bg-[#0D0D0F]">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center space-y-4">
                    <div className="w-14 h-14 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto border border-white/5">
                      <Bell size={24} className="text-white/10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase font-black tracking-[0.3em] text-white/20 leading-tight">Zero Activity</p>
                      <p className="text-[7px] uppercase font-bold tracking-widest text-white/10">System logs are clear</p>
                    </div>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-5 border-b border-white/[0.02] hover:bg-white/[0.03] transition-all cursor-pointer relative group ${!notif.is_read ? 'bg-white/[0.02]' : ''}`}
                      onClick={() => {
                        markAsRead(notif.id);
                        setSelectedNotification(notif);
                      }}
                    >
                      {!notif.is_read && (
                        <div className="absolute top-6 right-5 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.8)]" />
                      )}
                      <div className="flex gap-4">
                        <div className={`mt-0.5 p-2 rounded-xl border border-white/5 transition-colors ${!notif.is_read ? 'bg-red-600/10 border-red-500/20' : 'bg-white/5'}`}>
                          {getTypeIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-black leading-tight uppercase tracking-wide transition-colors ${!notif.is_read ? 'text-white' : 'text-white/30'}`}>
                            {notif.title}
                          </p>
                          <p className="text-[10px] text-white/20 mt-1.5 leading-relaxed font-medium">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="w-4 h-[1px] bg-white/10"></span>
                            <p className="text-[7px] text-white/10 font-black uppercase tracking-widest">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-white/[0.03] border-t border-white/5 text-center">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white transition-all active:scale-95"
                  >Dismiss System Log</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
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
    </div>
  );
};
