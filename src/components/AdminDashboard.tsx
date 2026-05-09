import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Settings, 
  Film, 
  Database, 
  Trash2, 
  UserPlus, 
  ChevronRight,
  Save,
  Plus,
  RefreshCw,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { movieApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'content' | 'settings'>('stats');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Form states
  const [newOverride, setNewOverride] = useState<any>({
    tmdb_id: '',
    media_type: 'movie',
    season_number: '',
    episode_number: '',
    video_url: '',
    intro_start: '',
    intro_end: '',
    custom_title: '',
    custom_overview: ''
  });

  const [newSetting, setNewSetting] = useState({ key: '', value: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const data = await movieApi.getAdminStats();
        setStats(data);
      } else if (activeTab === 'users') {
        const data = await movieApi.getAdminUsers();
        setUsers(data);
      } else if (activeTab === 'content') {
        const data = await movieApi.getAdminOverrides();
        setOverrides(data);
      } else if (activeTab === 'settings') {
        const data = await movieApi.getAdminSettings();
        setSettings(data);
      }
    } catch (err: any) {
      showMsg('error', err.response?.data?.error || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePromote = async (email: string, currentStatus: boolean) => {
    try {
      await movieApi.promoteUser(email, !currentStatus);
      showMsg('success', 'User status updated');
      fetchData();
    } catch (err) {
      showMsg('error', 'Update failed');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;
    try {
      await movieApi.deleteUser(email);
      showMsg('success', 'User deleted');
      fetchData();
    } catch (err) {
      showMsg('error', 'Delete failed');
    }
  };

  const handleSaveOverride = async () => {
    try {
      await movieApi.saveAdminOverride(newOverride);
      showMsg('success', 'Override saved');
      setNewOverride({ 
        tmdb_id: '', 
        media_type: 'movie', 
        season_number: '', 
        episode_number: '', 
        video_url: '', 
        intro_start: '',
        intro_end: '',
        custom_title: '', 
        custom_overview: '' 
      });
      fetchData();
    } catch (err) {
      showMsg('error', 'Save failed');
    }
  };

  const handleDeleteOverride = async (id: number) => {
    try {
      await movieApi.deleteAdminOverride(id);
      showMsg('success', 'Override deleted');
      fetchData();
    } catch (err) {
      showMsg('error', 'Delete failed');
    }
  };

  const handleSaveSetting = async () => {
    try {
      await movieApi.saveAdminSetting(newSetting.key, newSetting.value);
      showMsg('success', 'Setting saved');
      setNewSetting({ key: '', value: '' });
      fetchData();
    } catch (err) {
      showMsg('error', 'Save failed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0D0D0E]">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-600 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium">God Mode Activated</p>
          </div>
        </div>
        
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
            >
              {message.type === 'success' ? <Check size={14} /> : <X size={14} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar / Mobile Nav */}
        <div className="flex md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-x-visible border-b md:border-b-0 md:border-r border-white/5 p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 no-scrollbar bg-[#0D0D0E]/50 md:bg-transparent">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-red-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            <Database size={18} /> <span className="hidden md:inline">Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-red-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            <Users size={18} /> <span className="hidden md:inline">Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all ${activeTab === 'content' ? 'bg-red-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            <Film size={18} /> <span className="hidden md:inline">Vault</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-red-600 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings size={18} /> <span className="hidden md:inline">Config</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {loading && (
            <div className="absolute inset-0 bg-[#0A0A0B]/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <RefreshCw className="animate-spin text-red-600" size={32} />
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="p-6 md:p-8 bg-[#0D0D0E] border border-white/5 rounded-2xl space-y-4">
                <Users className="text-red-500" size={28} />
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Total Users</h3>
                <p className="text-4xl md:text-5xl font-serif italic">{stats.users}</p>
              </div>
              <div className="p-6 md:p-8 bg-[#0D0D0E] border border-white/5 rounded-2xl space-y-4">
                <ShieldCheck className="text-blue-500" size={28} />
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Active Overrides</h3>
                <p className="text-4xl md:text-5xl font-serif italic">{stats.overrides}</p>
              </div>
              <div className="p-6 md:p-8 bg-[#0D0D0E] border border-white/5 rounded-2xl space-y-4">
                <RefreshCw className="text-green-500" size={28} />
                <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">User Reviews</h3>
                <p className="text-4xl md:text-5xl font-serif italic">{stats.reviews}</p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-serif italic">User Directory</h2>
              </div>
              <div className="bg-[#0D0D0E] border border-white/5 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <th className="px-4 md:px-6 py-4">User</th>
                      <th className="px-4 md:px-6 py-4">Status</th>
                      <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.email} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.email}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-tighter">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.is_admin ? 'bg-red-600/10 text-red-500' : 'bg-white/5 text-white/40'}`}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right flex justify-end gap-1">
                          <button 
                            onClick={() => handlePromote(user.email, user.is_admin)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                            title={user.is_admin ? "Demote" : "Promote"}
                          >
                            <ShieldCheck size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.email)}
                            className="p-2 hover:bg-red-600/20 rounded-lg text-white/40 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-8 md:space-y-12">
              <div className="space-y-6 bg-[#0D0D0E] p-6 md:p-8 border border-white/5 rounded-2xl">
                <h2 className="text-xl font-serif italic">Global Overrides</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">TMDB ID</label>
                    <input 
                      type="number" 
                      value={newOverride.tmdb_id}
                      onChange={(e) => setNewOverride({...newOverride, tmdb_id: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                      placeholder="e.g. 550"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Type</label>
                    <select 
                      value={newOverride.media_type}
                      onChange={(e) => setNewOverride({...newOverride, media_type: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                    >
                      <option value="movie">Movie</option>
                      <option value="tv">TV Show</option>
                    </select>
                  </div>
                  {newOverride.media_type === 'tv' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Season</label>
                        <input 
                          type="number" 
                          value={newOverride.season_number}
                          onChange={(e) => setNewOverride({...newOverride, season_number: e.target.value})}
                          className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Episode</label>
                        <input 
                          type="number" 
                          value={newOverride.episode_number}
                          onChange={(e) => setNewOverride({...newOverride, episode_number: e.target.value})}
                          className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                        />
                      </div>
                    </>
                  )}
                  <div className="col-span-2 md:col-span-4 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Source Video URL</label>
                    <input 
                      type="text" 
                      value={newOverride.video_url}
                      onChange={(e) => setNewOverride({...newOverride, video_url: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Intro Start (s)</label>
                    <input 
                      type="number" 
                      value={newOverride.intro_start}
                      onChange={(e) => setNewOverride({...newOverride, intro_start: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Intro End (s)</label>
                    <input 
                      type="number" 
                      value={newOverride.intro_end}
                      onChange={(e) => setNewOverride({...newOverride, intro_end: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                      placeholder="85"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveOverride}
                  className="w-full md:w-auto px-8 py-3 bg-red-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  <Plus size={18} /> Update Content
                </button>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-serif italic uppercase">Active Vault</h2>
                <div className="grid grid-cols-1 gap-4">
                  {overrides.map(ov => (
                    <div key={ov.id} className="p-4 md:p-6 bg-[#0D0D0E] border border-white/5 rounded-xl flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-white/5 rounded-lg flex items-center justify-center text-white/20">
                        <Film size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-0.5">
                          {ov.media_type} {ov.season_number && `S${ov.season_number}`} {ov.episode_number && `E${ov.episode_number}`}
                        </p>
                        <h4 className="text-sm font-bold truncate">TMDB {ov.tmdb_id}</h4>
                        <p className="text-[10px] text-white/40 font-mono truncate">{ov.video_url}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteOverride(ov.id)}
                        className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 md:space-y-12">
              <div className="space-y-6 bg-[#0D0D0E] p-6 md:p-8 border border-white/5 rounded-2xl">
                <h2 className="text-xl font-serif italic font-light">Global Registry</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-[#E5E5E5]/40 font-bold">Fast Config</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                        <span className="text-xs uppercase tracking-widest font-bold">Premium Price</span>
                        <input 
                          type="text" 
                          placeholder="9.99"
                          className="bg-transparent text-right border-b border-white/10 outline-none focus:border-red-600 transition-all text-red-500 font-bold"
                          onChange={(e) => setNewSetting({ key: 'premium_price_monthly', value: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <span className="text-xs uppercase tracking-widest font-bold">Payment Info</span>
                        <textarea 
                          placeholder="PayPal: admin@example.com"
                          className="bg-transparent border-b border-white/10 outline-none focus:border-red-600 transition-all text-white/60 text-sm h-20"
                          onChange={(e) => setNewSetting({ key: 'payment_info', value: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-[#E5E5E5]/40 font-bold">Custom Entry</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Key</label>
                        <input 
                          type="text" 
                          value={newSetting.key}
                          onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                          className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm"
                          placeholder="TMDB_API_KEY"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Value</label>
                        <textarea 
                          value={newSetting.value}
                          onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                          className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm h-24"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSaveSetting}
                  className="w-full md:w-auto px-8 py-3 bg-white text-black rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-xl"
                >
                  <Save size={18} /> Persist Config
                </button>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-serif italic uppercase">Current Config</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {settings.map(s => (
                    <div key={s.setting_key} className="p-4 md:p-6 bg-[#0D0D0E] border border-white/5 rounded-xl group relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Key</p>
                        <h4 className="font-mono text-xs md:text-sm text-red-500 truncate">{s.setting_key}</h4>
                        <p className="text-[10px] text-white/20 mt-2">v{new Date(s.updated_at).getTime()}</p>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-green-500/10 text-green-500 rounded text-[10px] font-bold uppercase hidden md:block">
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
