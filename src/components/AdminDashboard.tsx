import React, { useEffect, useState } from 'react';
import { 
  Search,
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
  Menu,
  ShieldCheck,
  Check,
  X,
  Copy,
  CreditCard,
  DollarSign,
  Rocket,
  Megaphone,
  Bell,
  Eye,
  ExternalLink,
  Ban,
  CheckCircle2,
  Send,
  ArrowUpRight
} from 'lucide-react';
import { movieApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Ad, Affiliate, Notification, PaymentConfig, PaymentSubmission } from '../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [payConfig, setPayConfig] = useState<PaymentConfig | null>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'content' | 'settings' | 'payments' | 'payconfig' | 'affiliates' | 'ads' | 'notifications'>('stats');
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number | string, email: string} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vaultTab, setVaultTab] = useState<'all' | 'movie' | 'tv' | 'episode'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Form states
  const [newOverride, setNewOverride] = useState<any>({
    id: null,
    tmdb_id: '',
    media_type: 'movie',
    season_number: '',
    episode_number: '',
    video_url: '',
    intro_start: '',
    intro_end: '',
    custom_title: '',
    custom_overview: '',
    title: ''
  });

  const [newSetting, setNewSetting] = useState({ key: '', value: '' });

  const [reviewPayment, setReviewPayment] = useState<{id: number, status: 'approved' | 'rejected', admin_notes: string} | null>(null);
  const [newAd, setNewAd] = useState<Partial<Ad>>({
    name: '', type: 'image', media_url: '', click_url: '', placement: 'homepage', priority: 0, is_active: true
  });
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info', target_type: 'all', target_user_email: '' });
  const [newAffiliate, setNewAffiliate] = useState({ email: '', referral_code: '' });
  const [newPayConfig, setNewPayConfig] = useState<any>({
    bank_name: '', account_name: '', account_number: '', crypto_address: '', other_method: '', payment_note: '', tracking_questions: '[]'
  });

  const GRANT_DURATIONS = [
    { label: '2 Weeks', value: '2w' },
    { label: '1 Month', value: '1m' },
    { label: '3 Months', value: '3m' },
    { label: '4 Months', value: '4m' },
    { label: '5 Months', value: '5m' },
    { label: '6 Months', value: '6m' },
    { label: '1 Year', value: '1y' },
  ];

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
      } else if (activeTab === 'payments') {
        const data = await movieApi.getAdminPayments();
        setPayments(data);
      } else if (activeTab === 'payconfig') {
        const data = await movieApi.getAdminPaymentConfig();
        setNewPayConfig(data);
        setPayConfig(data);
      } else if (activeTab === 'affiliates') {
        const data = await movieApi.getAdminAffiliates();
        setAffiliates(data);
        const earn = await movieApi.getAdminEarnings();
        setEarnings(earn);
      } else if (activeTab === 'ads') {
        const data = await movieApi.getAdminAds();
        setAds(data);
      } else if (activeTab === 'notifications') {
        const data = await movieApi.getAdminNotifications();
        setNotifications(data);
      }
    } catch (err: any) {
      showMsg('error', err.response?.data?.error || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => {
    window.dispatchEvent(new CustomEvent('app-notify', { detail: { type, text } }));
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

  const handleDeleteUser = async (id: number | string, email: string) => {
    try {
      setLoading(true);
      await movieApi.deleteUser(id);
      showMsg('success', `Entity ${email} has been purged from reality`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      showMsg('error', `Purge failed: ${err.message || 'Access Denied'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPremium = async (email: string, duration: string) => {
    try {
      await movieApi.grantPremium(email, duration);
      showMsg('success', 'Premium status granted');
      fetchData();
    } catch (err) {
      showMsg('error', 'Grant failed');
    }
  };

  const handleRevokePremium = async (email: string) => {
    try {
      await movieApi.revokePremium(email);
      showMsg('success', 'Premium status revoked');
      fetchData();
    } catch (err) {
      showMsg('error', 'Revoke failed');
    }
  };

  const handleSaveOverride = async () => {
    try {
      await movieApi.saveAdminOverride(newOverride);
      showMsg('success', newOverride.id ? 'Override updated' : 'Override saved');
      setNewOverride({ 
        id: null,
        tmdb_id: '', 
        media_type: 'movie', 
        season_number: '', 
        episode_number: '', 
        video_url: '', 
        intro_start: '',
        intro_end: '',
        custom_title: '', 
        custom_overview: '',
        title: ''
      });
      fetchData();
    } catch (err) {
      showMsg('error', 'Save failed');
    }
  };

  const handleEditOverride = (ov: any) => {
    setNewOverride({
      id: ov.id,
      tmdb_id: ov.tmdb_id,
      media_type: ov.media_type,
      season_number: ov.season_number || '',
      episode_number: ov.episode_number || '',
      video_url: ov.video_url,
      intro_start: ov.intro_start || '',
      intro_end: ov.intro_end || '',
      custom_title: ov.custom_title || '',
      custom_overview: ov.custom_overview || '',
      title: ov.title || ''
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateOverride = async (ov: any) => {
    try {
      const copy = {
        ...ov,
        id: null,
        title: ov.title ? `${ov.title} (Copy)` : `TMDB ${ov.tmdb_id} (Copy)`,
        updated_at: new Date().toISOString()
      };
      await movieApi.saveAdminOverride(copy);
      showMsg('success', 'Override duplicated successfully');
      fetchData(); // Refresh the list
    } catch (err) {
      showMsg('error', 'Duplication failed');
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

  const handleSaveConfig = async (key: string, value: any) => {
    try {
      await movieApi.saveAdminSetting(key, value);
      showMsg('success', `${key} updated`);
      fetchData();
    } catch (err) {
      showMsg('error', `Failed to update ${key}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] text-white relative">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="max-w-md w-full bg-[#121214] border border-red-600/30 rounded-[3rem] p-10 space-y-8 shadow-[0_0_100px_rgba(220,38,38,0.15)] relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-20 -mr-10 -mt-10 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                  
                  <div className="relative z-10 text-center space-y-6">
                      <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto border border-red-600/20 shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                          <Trash2 size={40} className="text-red-500" />
                      </div>
                      <div className="space-y-3">
                          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic font-serif">Critical Purge</h2>
                          <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-[0.3em] font-black italic">
                              You are about to permanently erase <span className="text-red-500 font-serif lowercase italic text-base px-1">{deleteConfirm.email}</span> from the system archives.
                          </p>
                      </div>
                  </div>

                  <div className="relative z-10 flex flex-col gap-4">
                      <button 
                          onClick={() => handleDeleteUser(deleteConfirm.id, deleteConfirm.email)}
                          disabled={loading}
                          className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-[1.5rem] transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={16} />}
                          {loading ? 'Purging Archive...' : 'Confirm Absolute Purge'}
                      </button>
                      <button 
                          onClick={() => setDeleteConfirm(null)}
                          disabled={loading}
                          className="w-full py-5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-[1.5rem] transition-all active:scale-95 border border-white/10"
                      >
                          Abort Signal
                      </button>
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tab Navigation moved to a subheader pattern */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        {/* Mobile Top Menu Reverted */}
        <div className="md:hidden flex flex-col bg-[#0D0D0E] border-b border-white/5 w-full shrink-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Rocket className="text-red-500" size={20} />
              <h1 className="text-sm font-black uppercase tracking-tighter italic font-serif">Admin Command</h1>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="text-[10px] font-black uppercase tracking-widest text-white/20"
            >
              Exit
            </button>
          </div>
          <div className="flex overflow-x-auto no-scrollbar p-2 gap-2 border-t border-white/5">
             {[
               { id: 'stats', label: 'Stats' },
               { id: 'users', label: 'Users' },
               { id: 'content', label: 'Vault' },
               { id: 'notifications', label: 'Notifs' },
               { id: 'payments', label: 'Sales' },
               { id: 'payconfig', label: 'Config' },
               { id: 'affiliates', label: 'Affiliates' },
               { id: 'ads', label: 'Ads' },
               { id: 'settings', label: 'Registry' }
             ].map(t => (
               <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40'}`}
               >
                 {t.label}
               </button>
             ))}
          </div>
        </div>

        {/* Sidebar / Desktop Nav */}
        <div className="hidden md:flex flex-col md:w-64 flex-shrink-0 w-full md:h-full border-r border-white/5 bg-[#0D0D0E]/30 backdrop-blur-md relative z-[50]">
          <div className="flex flex-col p-4 gap-2 w-full h-full">
            <div className="space-y-1">
              <p className="px-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Command Center</p>
              
              <button 
                  onClick={() => { setActiveTab('stats'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'stats' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <Database size={18} className={activeTab === 'stats' ? 'text-white' : 'text-red-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Overview</span>
              </button>
              
              <button 
                  onClick={() => { setActiveTab('users'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'users' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <Users size={18} className={activeTab === 'users' ? 'text-white' : 'text-blue-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">User Base</span>
              </button>
              
              <button 
                  onClick={() => { setActiveTab('content'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'content' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <Film size={18} className={activeTab === 'content' ? 'text-white' : 'text-purple-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Content Vault</span>
              </button>

              <button 
                  onClick={() => { setActiveTab('notifications'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'notifications' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <Bell size={18} className={activeTab === 'notifications' ? 'text-white' : 'text-yellow-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Announcements</span>
              </button>
            </div>

            <div className="mt-8 space-y-1">
              <p className="px-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Operations</p>
              
              <button 
                  onClick={() => { setActiveTab('payments'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative ${activeTab === 'payments' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <CreditCard size={18} className={activeTab === 'payments' ? 'text-white' : 'text-green-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Transactions</span>
                  {stats?.pending_payments > 0 && <span className="ml-auto bg-white/10 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black text-white">{stats.pending_payments}</span>}
              </button>

              <button 
                  onClick={() => { setActiveTab('payconfig'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'payconfig' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <DollarSign size={18} className={activeTab === 'payconfig' ? 'text-white' : 'text-emerald-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Currency UI</span>
              </button>

              <button 
                  onClick={() => { setActiveTab('settings'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'settings' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <Settings size={18} className={activeTab === 'settings' ? 'text-white' : 'text-gray-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Registry</span>
              </button>
            </div>

            <div className="mt-8 space-y-1">
              <p className="px-3 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Growth</p>
              
              <button 
                  onClick={() => { setActiveTab('affiliates'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'affiliates' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <ArrowUpRight size={18} className={activeTab === 'affiliates' ? 'text-white' : 'text-blue-400 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Affiliates</span>
              </button>

              <button 
                  onClick={() => { setActiveTab('ads'); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group ${activeTab === 'ads' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                  <Megaphone size={18} className={activeTab === 'ads' ? 'text-white' : 'text-orange-500 group-hover:scale-110 transition-transform'} /> 
                  <span className="tracking-tight">Ad Platform</span>
              </button>
            </div>
            
            <button 
                onClick={() => window.location.href = '/'}
                className="mt-auto w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white/20 hover:text-white transition-all border border-white/5"
            >
                <ChevronRight size={16} /> Exit Admin
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 bg-[#0A0A0B]/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <RefreshCw className="animate-spin text-red-600" size={32} />
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="p-6 md:p-8 bg-[#0D0D0E] border border-white/5 rounded-2xl space-y-4 shadow-sm">
                  <Users className="text-red-500" size={28} />
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Total Users</h3>
                  <p className="text-4xl md:text-5xl font-serif italic text-white">{stats.users}</p>
                </div>
                <div className="p-6 md:p-8 bg-[#0D0D0E] border border-white/5 rounded-2xl space-y-4 shadow-sm">
                  <ShieldCheck className="text-blue-500" size={28} />
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Active Overrides</h3>
                  <p className="text-4xl md:text-5xl font-serif italic text-white">{stats.overrides}</p>
                </div>
                <div className="p-6 md:p-8 bg-[#0D0D0E] border border-white/5 rounded-2xl space-y-4 shadow-sm">
                  <CreditCard className="text-yellow-500" size={28} />
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Pending Payments</h3>
                  <p className="text-4xl md:text-5xl font-serif italic text-white">{stats.pending_payments}</p>
                </div>
                <div className="p-6 md:p-8 bg-[#0D0D0E] border border-white/5 rounded-2xl space-y-4 shadow-sm">
                  <RefreshCw className="text-green-500" size={28} />
                  <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">User Reviews</h3>
                  <p className="text-4xl md:text-5xl font-serif italic text-white">{stats.reviews}</p>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="bg-[#0D0D0E] p-8 border border-white/5 rounded-3xl space-y-6">
                 <div>
                    <h3 className="text-lg font-serif italic text-white">Maintenance & Recovery</h3>
                    <p className="text-xs text-white/40">Critical operations to maintain system integrity and restore data.</p>
                 </div>
                 <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={async () => {
                        if (!confirm("Are you sure you want to restore data from database.json? This might overwrite some existing settings.")) return;
                        setLoading(true);
                        try {
                          const res = await movieApi.restoreFromJson();
                          showMsg('success', res.message);
                          fetchData();
                        } catch (err: any) {
                          showMsg('error', err.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all group"
                    >
                      <Database className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Restore from JSON</p>
                        <p className="text-[9px] text-white/40">Import local database.json into SQL</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => fetchData()}
                      className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all group"
                    >
                      <RefreshCw className="text-green-500 group-hover:rotate-180 transition-transform duration-500" size={20} />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Sync Status</p>
                        <p className="text-[9px] text-white/40">Refresh all dashboard statistics</p>
                      </div>
                    </button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-serif italic text-white">Payment Submissions</h2>
                <div className="grid grid-cols-1 gap-4">
                    {payments.map(p => (
                        <div key={p.id} className="bg-[#0D0D0E] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-sm">
                           <div className="w-full md:w-48 h-64 md:h-48 shrink-0 bg-white/5 rounded-xl overflow-hidden relative group">
                                <img src={p.proof_image_url} alt="Proof" className="w-full h-full object-cover" />
                                <a href={p.proof_image_url} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye size={24} />
                                </a>
                           </div>
                           <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">{p.plan} Plan — ₦{p.amount.toLocaleString()}</p>
                                        <h3 className="text-xl font-bold text-white">{p.user_email}</h3>
                                        <p className="text-xs text-white/40">{new Date(p.created_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        p.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                                        p.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                        {p.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Sender Name</p>
                                        <p className="text-sm font-medium text-gray-700 text-[#E5E5E5]">{p.sender_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Transaction Ref</p>
                                        <p className="text-sm font-medium text-gray-700 text-[#E5E5E5]">{p.transaction_reference}</p>
                                    </div>
                                    {p.referral_code && (
                                        <div>
                                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Referral Code</p>
                                            <p className="text-sm font-bold text-red-500">{p.referral_code}</p>
                                        </div>
                                    )}
                                </div>

                                {p.status === 'pending' && (
                                    <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                                        <textarea 
                                            placeholder="Admin notes (reason for rejection etc)"
                                            className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-red-600 outline-none text-white"
                                            onChange={(e) => setReviewPayment({ id: p.id, status: 'approved', admin_notes: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await movieApi.reviewPayment({ id: p.id, status: 'approved', admin_notes: reviewPayment?.admin_notes || '' });
                                                        showMsg('success', 'Payment Approved');
                                                        fetchData();
                                                    } catch (err) { showMsg('error', 'Review failed'); }
                                                }}
                                                className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold text-sm transition-all text-white"
                                            >
                                                Approve Payment
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await movieApi.reviewPayment({ id: p.id, status: 'rejected', admin_notes: reviewPayment?.admin_notes || '' });
                                                        showMsg('success', 'Payment Rejected');
                                                        fetchData();
                                                    } catch (err) { showMsg('error', 'Review failed'); }
                                                }}
                                                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 py-3 rounded-xl font-bold text-sm transition-all border border-red-500/20"
                                            >
                                                Reject Submission
                                            </button>
                                        </div>
                                    </div>
                                )}
                           </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'payconfig' && (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl md:text-2xl font-serif italic text-white">Checkout Configuration</h2>
                    <button 
                        onClick={async () => {
                            try {
                                await movieApi.saveAdminPaymentConfig(newPayConfig);
                                showMsg('success', 'Payment Config Saved');
                                fetchData();
                            } catch (err) { showMsg('error', 'Save failed'); }
                        }}
                        className="px-6 py-2 bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 text-white"
                    >
                        <Save size={16} /> Save Changes
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-[#0D0D0E] p-8 border border-white/5 rounded-3xl space-y-6 shadow-sm">
                        <h3 className="text-xs uppercase tracking-widest text-white/40 font-black">Bank Transfer</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-300 text-white/20 font-black uppercase tracking-widest ml-2">Bank Name</label>
                                <input 
                                    type="text" value={newPayConfig.bank_name}
                                    onChange={e => setNewPayConfig({...newPayConfig, bank_name: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-300 text-white/20 font-black uppercase tracking-widest ml-2">Account Name</label>
                                <input 
                                    type="text" value={newPayConfig.account_name}
                                    onChange={e => setNewPayConfig({...newPayConfig, account_name: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-300 text-white/20 font-black uppercase tracking-widest ml-2">Account Number</label>
                                <input 
                                    type="text" value={newPayConfig.account_number}
                                    onChange={e => setNewPayConfig({...newPayConfig, account_number: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0D0D0E] p-8 border border-white/5 rounded-3xl space-y-6 shadow-sm">
                        <h3 className="text-xs uppercase tracking-widest text-white/40 font-black">Alternative Methods</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-300 text-white/20 font-black uppercase tracking-widest ml-2">Crypto Address (USDT BEP20)</label>
                                <input 
                                    type="text" value={newPayConfig.crypto_address}
                                    onChange={e => setNewPayConfig({...newPayConfig, crypto_address: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-300 text-white/20 font-black uppercase tracking-widest ml-2">Other Method (Mobile Money etc)</label>
                                <textarea 
                                    value={newPayConfig.other_method || ''}
                                    onChange={e => setNewPayConfig({...newPayConfig, other_method: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm h-28 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-[#0D0D0E] p-8 border border-white/5 rounded-3xl space-y-6 shadow-sm">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs uppercase tracking-widest text-white/40 font-black">Checkout Page Config</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-300 text-white/20 font-black uppercase tracking-widest ml-2">Payment Note (Banner at top)</label>
                                <textarea 
                                    value={newPayConfig.payment_note || ''}
                                    onChange={e => setNewPayConfig({...newPayConfig, payment_note: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm h-32 text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-300 text-white/20 font-black uppercase tracking-widest ml-2">Tracking Questions (JSON Array of strings)</label>
                                <textarea 
                                    value={newPayConfig.tracking_questions || ''}
                                    onChange={e => setNewPayConfig({...newPayConfig, tracking_questions: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono h-32 text-white"
                                    placeholder='["What device do you use?"]'
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'affiliates' && (
            <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Create Affiliate */}
                    <div className="bg-[#0D0D0E] p-8 border border-white/5 rounded-3xl space-y-6 shadow-sm">
                        <h2 className="text-xl font-serif italic text-white">Promote Affiliate</h2>
                        <div className="space-y-4">
                            <input 
                                type="email" placeholder="user@example.com"
                                value={newAffiliate.email}
                                onChange={e => setNewAffiliate({...newAffiliate, email: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="text" placeholder="REFCODE100"
                                    value={newAffiliate.referral_code}
                                    onChange={e => setNewAffiliate({...newAffiliate, referral_code: e.target.value.toUpperCase()})}
                                    className="flex-1 bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest text-white"
                                />
                                <button 
                                    onClick={async () => {
                                        try {
                                            await movieApi.createAffiliate(newAffiliate);
                                            showMsg('success', 'Affiliate Created');
                                            setNewAffiliate({ email: '', referral_code: '' });
                                            fetchData();
                                        } catch (err: any) { showMsg('error', err.response?.data?.error || 'Failed to create'); }
                                    }}
                                    className="px-6 bg-red-600 rounded-xl font-black uppercase tracking-widest text-xs text-white"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0D0D0E] p-6 border border-white/5 rounded-3xl shadow-sm">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Total Payouts Done</p>
                            <p className="text-3xl font-serif italic text-blue-500">
                                ₦{earnings.filter(e => e.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-[#0D0D0E] p-6 border border-white/5 rounded-3xl shadow-sm">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Owed Commissions</p>
                            <p className="text-3xl font-serif italic text-red-500">
                                ₦{earnings.filter(e => e.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl md:text-2xl font-serif italic text-white">Affiliate Network</h2>
                    <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl overflow-x-auto shadow-sm no-scrollbar">
                        <table className="w-full text-left text-sm min-w-[700px]">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest">Affiliate</th>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest">Code</th>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest">Stats</th>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-[#E1E1E1]">
                                {affiliates.map(aff => (
                                    <tr key={aff.id} className="border-b border-white/5 hover:bg-gray-200/50 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 font-medium">{aff.user_email}</td>
                                        <td className="px-6 py-4 font-black tracking-widest text-red-500">{aff.referral_code}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-white">
                                                    <span className="font-black tracking-tight text-sm">₦{Number(aff.total_earnings || 0).toLocaleString()}</span>
                                                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-black">Total</span>
                                                </div>
                                                <div className="flex gap-2 text-[9px] uppercase tracking-widest font-black">
                                                    <span className="text-red-500">₦{Number(aff.pending_earnings || 0).toLocaleString()} Owed</span>
                                                    <span className="text-blue-500">₦{Number((aff.total_earnings || 0) - (aff.pending_earnings || 0)).toLocaleString()} Paid</span>
                                                </div>
                                                <p className="text-[9px] text-white/20 mt-1">{aff.referral_count} referrals • {aff.paid_referral_count || 0} paid</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await movieApi.toggleAffiliate({ id: aff.id, is_active: !aff.is_active });
                                                        showMsg('success', 'Affiliate status updated');
                                                        fetchData();
                                                    } catch (err) { showMsg('error', 'Toggle failed'); }
                                                }}
                                                className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    aff.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}
                                            >
                                                {aff.is_active ? 'Active' : 'Banned'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl md:text-2xl font-serif italic text-white">Pending Payouts</h2>
                        <button 
                             onClick={async () => {
                                const pendings = earnings.filter(e => e.status === 'pending').map(e => e.id);
                                if (pendings.length === 0) return;
                                try {
                                    await movieApi.payoutEarnings(pendings);
                                    showMsg('success', 'All earnings marked as paid');
                                    fetchData();
                                } catch (err) { showMsg('error', 'Payout failed'); }
                             }}
                             className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-gray-600 text-white/70"
                        > Mark All as Paid </button>
                    </div>
                    <div className="bg-[#0D0D0E] border border-white/5 rounded-2xl overflow-x-auto shadow-sm no-scrollbar">
                        <table className="w-full text-left text-sm min-w-[700px]">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest">Recipient</th>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest">Commission</th>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest">Pricing Flow</th>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest">Payer Detail</th>
                                    <th className="px-6 py-4 text-[10px] text-white/20 font-black uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-[#E1E1E1]">
                                {earnings.filter(e => e.status === 'pending').length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No pending payouts. Everything is cleared!</td></tr>
                                ) : (
                                    earnings.filter(e => e.status === 'pending').map(earn => (
                                        <tr key={earn.id} className="border-b border-white/5 hover:bg-gray-200/50 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 font-medium">{earn.affiliate_email}</td>
                                            <td className="px-6 py-4 font-black text-red-500">₦{earn.amount}</td>
                                            <td className="px-6 py-4 text-xs font-mono text-white/40">₦{Number(earn.total_amount || 0).toLocaleString()} <span className="text-[9px] uppercase">Entry</span></td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-white">{earn.payer_email}</p>
                                                <p className="text-[10px] text-white/20 font-black uppercase">{earn.plan}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            await movieApi.payoutEarnings([earn.id]);
                                                            showMsg('success', 'Earning marked as paid');
                                                            fetchData();
                                                        } catch (err) { showMsg('error', 'Payout failed'); }
                                                    }}
                                                    className="p-2 hover:bg-green-600/20 text-green-500 rounded-lg transition-all"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'ads' && (
            <div className="space-y-8">
                <div className="bg-[#0D0D0E] p-8 border border-white/5 rounded-3xl space-y-6 shadow-sm">
                    <h2 className="text-xl font-serif italic text-white">{newAd.id ? 'Edit Campaign' : 'Create Ad Campaign'}</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Internal Name</label>
                            <input 
                                type="text" placeholder="October Promo"
                                value={newAd.name}
                                onChange={e => setNewAd({...newAd, name: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Placement Slot</label>
                            <select 
                                value={newAd.placement}
                                onChange={e => setNewAd({...newAd, placement: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                            >
                                <option value="homepage">Homepage Banner</option>
                                <option value="pre-roll">Pre-roll Video</option>
                                <option value="mid-roll">Mid-roll Video</option>
                                <option value="post-roll">Post-roll Video</option>
                                <option value="overlay">Search Overlay</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Ad Type</label>
                            <div className="flex gap-2">
                                {['image', 'video', 'html'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setNewAd({...newAd, type: t as any})}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            newAd.type === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-gray-200 border-white/5 text-white/40'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Click-through Link</label>
                            <input 
                                type="url" placeholder="https://..."
                                value={newAd.click_url}
                                onChange={e => setNewAd({...newAd, click_url: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">
                                {newAd.type === 'html' ? 'HTML Content' : 'Media URL (S3 / Imgur / Direct)'}
                            </label>
                            <textarea 
                                value={(newAd.type === 'html' ? newAd.html_content : newAd.media_url) || ''}
                                onChange={e => newAd.type === 'html' ? setNewAd({...newAd, html_content: e.target.value}) : setNewAd({...newAd, media_url: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm h-24 font-mono text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Priority (Higher = Wins)</label>
                                <input 
                                    type="number" value={newAd.priority}
                                    onChange={e => setNewAd({...newAd, priority: Number(e.target.value)})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <button 
                                    onClick={() => setNewAd({...newAd, is_active: !newAd.is_active})}
                                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                        newAd.is_active ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500'
                                    }`}
                                >
                                    {newAd.is_active ? 'Campaign Active' : 'Campaign Paused'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={async () => {
                                try {
                                    await movieApi.saveAdminAd(newAd);
                                    showMsg('success', 'Campaign Persisted');
                                    setNewAd({ name: '', type: 'image', media_url: '', click_url: '', placement: 'homepage', priority: 0, is_active: true });
                                    fetchData();
                                } catch (err) { showMsg('error', 'Save failed'); }
                            }}
                            className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all shadow-2xl"
                        >
                            Persist Ad Campaign
                        </button>
                        {newAd.id && (
                            <button 
                                onClick={() => setNewAd({ name: '', type: 'image', media_url: '', click_url: '', placement: 'homepage', priority: 0, is_active: true })}
                                className="bg-white/5 border border-white/10 scale-90 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white/40 hover:text-gray-900 hover:text-white"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl md:text-2xl font-serif italic text-white">Active Campaigns</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ads.map(item => (
                            <div key={item.id} className="bg-[#0D0D0E] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 shadow-sm">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl shrink-0 flex items-center justify-center relative overflow-hidden mx-auto sm:mx-0">
                                    {item.type === 'image' && <img src={item.media_url} className="w-full h-full object-cover" />}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Megaphone size={20} className="text-white/40" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-0.5">{item.placement}</p>
                                            <h4 className="font-bold truncate text-white">{item.name}</h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {item.is_active ? 'Live' : 'Paused'}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 mt-3">
                                        <div>
                                            <p className="text-[9px] text-white/20 font-black uppercase mb-0.5">Impressions</p>
                                            <p className="text-xs font-bold text-gray-600 text-white">{item.impressions.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-white/20 font-black uppercase mb-0.5">Clicks</p>
                                            <p className="text-xs font-bold text-gray-600 text-white">{item.clicks.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 text-white/40">
                                    <button 
                                        onClick={() => {
                                            setNewAd(item);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="p-2 hover:bg-white/10 hover:text-gray-900 hover:text-white rounded-lg transition-all"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await movieApi.deleteAdminAd(item.id);
                                                showMsg('success', 'Ad deleted');
                                                fetchData();
                                            } catch (err) { showMsg('error', 'Delete failed'); }
                                        }}
                                        className="p-2 hover:bg-red-600/20 hover:text-red-500 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
                <div className="bg-[#0D0D0E] p-8 border border-white/5 rounded-3xl space-y-6 shadow-sm">
                    <h2 className="text-xl font-serif italic text-white">Compose Notification</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Title</label>
                            <input 
                                type="text" placeholder="Update Available"
                                value={newNotif.title}
                                onChange={e => setNewNotif({...newNotif, title: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Visual Tone</label>
                            <select 
                                value={newNotif.type}
                                onChange={e => setNewNotif({...newNotif, type: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                            >
                                <option value="info">Info (Blue)</option>
                                <option value="success">Success (Green)</option>
                                <option value="warning">Warning (Yellow)</option>
                                <option value="error">Critical (Red)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Message Body</label>
                            <textarea 
                                value={newNotif.message || ''}
                                onChange={e => setNewNotif({...newNotif, message: e.target.value})}
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm h-24 text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Audience</label>
                            <div className="flex gap-2">
                                {['all', 'user'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setNewNotif({...newNotif, target_type: t as any})}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            newNotif.target_type === t ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-gray-200 border-white/5 text-white/40'
                                        }`}
                                    >
                                        {t === 'all' ? 'Everyone' : 'Single User'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {newNotif.target_type === 'user' && (
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/20 font-black uppercase tracking-widest ml-2">Target User Email</label>
                                <input 
                                    type="email" placeholder="user@example.com"
                                    value={newNotif.target_user_email}
                                    onChange={e => setNewNotif({...newNotif, target_user_email: e.target.value})}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                                />
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={async () => {
                            try {
                                await movieApi.sendNotification(newNotif);
                                showMsg('success', 'Notification Dispatched');
                                setNewNotif({ title: '', message: '', type: 'info', target_type: 'all', target_user_email: '' });
                                fetchData();
                            } catch (err) { showMsg('error', 'Send failed'); }
                        }}
                        className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all shadow-2xl flex items-center gap-2"
                    >
                        <Send size={16} /> Dispatch Message
                    </button>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl md:text-2xl font-serif italic text-white">Notification History</h2>
                    <div className="space-y-4">
                        {notifications.map((n, idx) => (
                            <div 
                              key={n.id} 
                              onClick={() => setSelectedNotification(n)}
                              className="bg-[#0D0D0E] border border-white/5 p-6 rounded-2xl flex items-center gap-6 shadow-sm hover:border-white/10 transition-all cursor-pointer group"
                            >
                                <div className="p-3 rounded-2xl bg-white/5 shadow-inner">
                                    <Bell size={24} className="text-white/40" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${
                                            n.type === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                            n.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                                            n.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                        }`}>
                                            {n.type}
                                        </span>
                                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                    <h4 className="font-bold text-white">{n.title}</h4>
                                    <p className="text-xs text-white/60 line-clamp-1">{n.message}</p>
                                    <p className="text-[10px] text-white/20 font-black uppercase mt-1 tracking-widest">
                                        Audience: {n.target_type} {n.target_user_email && `(${n.target_user_email})`}
                                    </p>
                                </div>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await movieApi.deleteAdminNotification(n.id);
                                            showMsg('success', 'Notification deleted');
                                            fetchData();
                                        } catch (err) { showMsg('error', 'Delete failed'); }
                                    }}
                                    className="p-3 hover:bg-red-600/20 text-white/40 hover:text-red-500 rounded-xl transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-serif italic text-white">User Directory</h2>
              </div>
              <div className="bg-[#0D0D0E] border border-white/5 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <th className="px-4 md:px-6 py-4">User</th>
                      <th className="px-4 md:px-6 py-4">Status</th>
                      <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-[#E1E1E1]">
                    {users.filter(u => u.email.toLowerCase().includes(searchFilter.toLowerCase())).map((user) => (
                      <tr key={user.email} className="border-b border-white/5 hover:bg-gray-200/50 hover:bg-white/[0.02]">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{user.email}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-tighter">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.is_admin ? 'bg-red-600/10 text-red-500' : 'bg-white/5 text-white/40'}`}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </span>
                            {user.is_premium ? (
                              <div className="flex flex-col">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-600 text-yellow-500 w-fit">
                                  Premium VIP
                                </span>
                                {user.premium_expiry && (
                                  <span className="text-[9px] text-white/20 font-medium uppercase tracking-tight mt-0.5">
                                    Expires {new Date(user.premium_expiry).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200/50 bg-white/5 text-gray-300 text-white/20 opacity-50">
                                Standard
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right flex justify-end items-center gap-4">
                          {user.is_premium ? (
                            <button 
                              onClick={() => handleRevokePremium(user.email)}
                              className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/5 group flex items-center gap-2"
                            >
                              <X size={14} className="group-hover:rotate-90 transition-transform" />
                              Revoke
                            </button>
                          ) : (
                            <div className="flex items-center bg-red-600/10 rounded-lg border border-red-500/20 group hover:border-red-500/40 transition-colors">
                               <div className="pl-3 pr-1 text-red-500 group-hover:text-red-400 transition-colors">
                                 <Plus size={12} />
                               </div>
                               <select 
                                  onChange={(e) => {
                                    if (e.target.value) {
                                        handleGrantPremium(user.email, e.target.value);
                                        e.target.value = '';
                                    }
                                  }}
                                  className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-red-500/80 focus:text-red-500 focus:outline-none py-2 pr-3 cursor-pointer appearance-none outline-none"
                               >
                                  <option value="" className="bg-[#111113] text-red-500">Grant VIP</option>
                                  {GRANT_DURATIONS.map(d => (
                                      <option key={d.value} value={d.value} className="bg-[#111113] text-white font-sans">{d.label}</option>
                                  ))}
                               </select>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-white/40">
                            <button 
                              onClick={() => handlePromote(user.email, user.is_admin)}
                              className="p-2 hover:bg-white/10 hover:text-gray-900 hover:text-white rounded-lg transition-all"
                              title={user.is_admin ? "Demote" : "Promote"}
                            >
                               <ShieldCheck size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm({id: user.id, email: user.email})}
                              className="p-2 hover:bg-red-600/20 rounded-lg transition-all hover:text-red-500"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
              <div className="space-y-6 bg-[#0D0D0E] p-6 md:p-8 border border-white/5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-serif italic text-white">{newOverride.id ? 'Edit Override' : 'Global Overrides'}</h2>
                  {newOverride.id && (
                    <button 
                      onClick={() => setNewOverride({
                        id: null,
                        tmdb_id: '',
                        media_type: 'movie',
                        season_number: '',
                        episode_number: '',
                        video_url: '',
                        intro_start: '',
                        intro_end: '',
                        custom_title: '',
                        custom_overview: '',
                        title: ''
                      })}
                      className="text-[10px] text-white/40 hover:text-gray-900 hover:text-white uppercase tracking-widest font-bold"
                    >
                      Clear / New
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Title (Optional)</label>
                    <input 
                      type="text" 
                      value={newOverride.title || ''}
                      onChange={(e) => setNewOverride({...newOverride, title: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
                      placeholder="Display Title Override"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">TMDB ID</label>
                    <input 
                      type="number" 
                      value={newOverride.tmdb_id}
                      onChange={(e) => setNewOverride({...newOverride, tmdb_id: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
                      placeholder="e.g. 550"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Type</label>
                    <select 
                      value={newOverride.media_type}
                      onChange={(e) => setNewOverride({...newOverride, media_type: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
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
                          className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Episode</label>
                        <input 
                          type="number" 
                          value={newOverride.episode_number}
                          onChange={(e) => setNewOverride({...newOverride, episode_number: e.target.value})}
                          className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
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
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Intro Start (s)</label>
                    <input 
                      type="number" 
                      value={newOverride.intro_start}
                      onChange={(e) => setNewOverride({...newOverride, intro_start: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Intro End (s)</label>
                    <input 
                      type="number" 
                      value={newOverride.intro_end}
                      onChange={(e) => setNewOverride({...newOverride, intro_end: e.target.value})}
                      className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-2.5 md:py-3 rounded-lg focus:border-red-600 outline-none text-xs md:text-sm text-white"
                      placeholder="85"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveOverride}
                  className="w-full md:w-auto px-8 py-3 bg-red-600 rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all text-white"
                >
                  <Plus size={18} /> {newOverride.id ? 'Update Content' : 'Save Content'}
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-serif italic uppercase text-white">Active Vault</h2>
                  <div className="flex bg-[#0A0A0B] p-1 rounded-xl border border-white/5 no-scrollbar overflow-x-auto w-full md:w-auto">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'movie', label: 'Movies' },
                      { id: 'tv', label: 'Series' },
                      { id: 'episode', label: 'Episodes' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setVaultTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${vaultTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {overrides.filter(ov => {
                    const matchesSearch = ov.title?.toLowerCase().includes(searchFilter.toLowerCase()) || ov.tmdb_id.toString().includes(searchFilter);
                    const matchesTab = vaultTab === 'all' || 
                      (vaultTab === 'movie' && ov.media_type === 'movie') || 
                      (vaultTab === 'tv' && ov.media_type === 'tv' && !ov.episode_number) ||
                      (vaultTab === 'episode' && ov.media_type === 'tv' && ov.episode_number);
                    return matchesSearch && matchesTab;
                  }).map(ov => (
                    <div key={ov.id} className="p-4 md:p-6 bg-[#0D0D0E] border border-white/5 rounded-xl flex items-center gap-4 shadow-sm">
                      <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-white/5 rounded-lg flex items-center justify-center text-white/20">
                        <Film size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-0.5">
                          {ov.media_type} {ov.season_number && `S${ov.season_number}`} {ov.episode_number && `E${ov.episode_number}`}
                        </p>
                        <h4 className="text-sm font-bold truncate text-white">{ov.title || `TMDB ${ov.tmdb_id}`}</h4>
                        <p className="text-[10px] text-white/40 font-mono truncate">{ov.video_url}</p>
                      </div>
                      <div className="flex gap-1 text-white/40">
                        <button 
                          onClick={() => handleDuplicateOverride(ov)}
                          className="p-2 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                          title="Duplicate"
                        >
                          <Copy size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditOverride(ov)}
                          className="p-2 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteOverride(ov.id)}
                          className="p-2 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 md:space-y-12">
               <div className="space-y-8">
                   <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-serif italic text-white/90">Global Registry</h2>
                     <div className="px-3 py-1 bg-red-600/10 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-red-500">Live Config</div>
                   </div>

                   {/* Registry Groups */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Group 1: TMDB */}
                       <div className="bg-[#0D0D0E] border border-white/5 rounded-3xl p-6 space-y-6 shadow-sm">
                           <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                               <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                                   <Settings size={18} />
                               </div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">API Credentials</h4>
                           </div>
                           <div className="space-y-4">
                               <div className="space-y-2">
                                   <label className="text-[8px] font-black uppercase tracking-widest text-white/20">TMDB API Key</label>
                                   <div className="flex gap-2">
                                       <input 
                                           id="config-TMDB_API_KEY"
                                           placeholder="TMDB API Key"
                                           className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-red-600 focus:outline-none"
                                       />
                                       <button 
                                           onClick={() => handleSaveConfig('TMDB_API_KEY', (document.getElementById('config-TMDB_API_KEY') as any).value)}
                                           className="px-6 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-xl"
                                       >Save</button>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Group 2: Operations */}
                       <div className="bg-[#0D0D0E] border border-white/5 rounded-3xl p-6 space-y-6 shadow-sm">
                           <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                               <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                                   <Rocket size={18} />
                               </div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Operational Logic</h4>
                           </div>
                           <div className="space-y-4">
                               <div className="space-y-2">
                                   <label className="text-[8px] font-black uppercase tracking-widest text-white/20">Allow Downloads</label>
                                   <div className="flex gap-2">
                                       <select 
                                           id="config-allow_downloads"
                                           className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-red-600 focus:outline-none"
                                       >
                                           <option value="true">Enable Protocol</option>
                                           <option value="false">Disable Protocol</option>
                                       </select>
                                       <button 
                                           onClick={() => handleSaveConfig('allow_downloads', (document.getElementById('config-allow_downloads') as any).value)}
                                           className="px-6 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-xl"
                                       >Save</button>
                                   </div>
                               </div>
                               <div className="space-y-2">
                                   <label className="text-[8px] font-black uppercase tracking-widest text-white/20">Payment Notice</label>
                                   <div className="flex gap-2">
                                       <textarea 
                                           id="config-payment_info"
                                           placeholder="Payment Instructions"
                                           className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-red-600 focus:outline-none min-h-[100px]"
                                       />
                                       <button 
                                           onClick={() => handleSaveConfig('payment_info', (document.getElementById('config-payment_info') as any).value)}
                                           className="px-6 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-xl self-end"
                                       >Save</button>
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Group 3: Pricing (Full Width) */}
                       <div className="md:col-span-2 bg-[#0D0D0E] border border-white/5 rounded-3xl p-6 space-y-6 shadow-sm">
                           <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                               <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                                   <DollarSign size={18} />
                               </div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Tier Economics (Premium Plans)</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="space-y-4">
                                   <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Naira Thresholds</p>
                                   <div className="space-y-4">
                                       <div className="flex gap-2 items-end">
                                           <div className="flex-1 space-y-2">
                                               <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Monthly (₦)</label>
                                               <input id="config-premium_price_naira_monthly" placeholder="1500" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                           </div>
                                           <button 
                                               onClick={() => handleSaveConfig('premium_price_naira_monthly', (document.getElementById('config-premium_price_naira_monthly') as any).value)}
                                               className="py-3 px-6 bg-white/5 hover:bg-red-600 hover:text-white border border-white/10 rounded-xl text-[10px] font-black transition-all text-white"
                                           >Set</button>
                                       </div>
                                       <div className="flex gap-2 items-end">
                                           <div className="flex-1 space-y-2">
                                               <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Yearly (₦)</label>
                                               <input id="config-premium_price_naira_yearly" placeholder="15000" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                           </div>
                                           <button 
                                               onClick={() => handleSaveConfig('premium_price_naira_yearly', (document.getElementById('config-premium_price_naira_yearly') as any).value)}
                                               className="py-3 px-6 bg-white/5 hover:bg-red-600 hover:text-white border border-white/10 rounded-xl text-[10px] font-black transition-all text-white"
                                           >Set</button>
                                       </div>
                                       <div className="flex gap-2 items-end">
                                           <div className="flex-1 space-y-2">
                                               <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Affiliate Pay (₦)</label>
                                               <input id="config-affiliate_commission_naira" placeholder="100" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                           </div>
                                           <button 
                                               onClick={() => handleSaveConfig('affiliate_commission_naira', (document.getElementById('config-affiliate_commission_naira') as any).value)}
                                               className="py-3 px-6 bg-white/5 hover:bg-red-600 hover:text-white border border-white/10 rounded-xl text-[10px] font-black transition-all text-white"
                                           >Set</button>
                                       </div>
                                   </div>
                               </div>
                               <div className="space-y-4">
                                   <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Dollar Thresholds</p>
                                   <div className="space-y-4">
                                       <div className="flex gap-2 items-end">
                                           <div className="flex-1 space-y-2">
                                               <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Monthly ($)</label>
                                               <input id="config-premium_price_dollar_monthly" placeholder="9.99" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                           </div>
                                           <button 
                                               onClick={() => handleSaveConfig('premium_price_dollar_monthly', (document.getElementById('config-premium_price_dollar_monthly') as any).value)}
                                               className="py-3 px-6 bg-white/5 hover:bg-red-600 hover:text-white border border-white/10 rounded-xl text-[10px] font-black transition-all text-white"
                                           >Set</button>
                                       </div>
                                       <div className="flex gap-2 items-end">
                                           <div className="flex-1 space-y-2">
                                               <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Yearly ($)</label>
                                               <input id="config-premium_price_dollar_yearly" placeholder="99.99" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                           </div>
                                           <button 
                                               onClick={() => handleSaveConfig('premium_price_dollar_yearly', (document.getElementById('config-premium_price_dollar_yearly') as any).value)}
                                               className="py-3 px-6 bg-white/5 hover:bg-red-600 hover:text-white border border-white/10 rounded-xl text-[10px] font-black transition-all text-white"
                                           >Set</button>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>

                   <div className="bg-[#161618] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                     <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                       <ExternalLink size={14} className="text-white/20" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Configuration Signals</h4>
                     </div>
                     <div className="divide-y divide-white/[0.02]">
                       {settings.length === 0 ? (
                         <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/10">Zero configs deployed.</div>
                       ) : (
                         settings.map((s: any) => (
                           <div key={s.setting_key} className="p-4 hover:bg-white/[0.01] transition-all flex flex-col md:flex-row justify-between md:items-center group gap-4">
                             <div>
                               <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">{s.setting_key}</p>
                               <p className="text-xs text-white/60 font-mono truncate max-w-sm">{s.setting_value}</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">{new Date(s.updated_at).toLocaleDateString()}</p>
                                <button
                                    onClick={() => {
                                        const newValue = prompt(`Edit ${s.setting_key}`, s.setting_value);
                                        if (newValue !== null) handleSaveConfig(s.setting_key, newValue);
                                    }}
                                    className="px-4 py-2 bg-white/5 hover:bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all font-sans"
                                >Edit Signal</button>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="max-w-xl w-full bg-[#121214] border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-8 shadow-2xl relative"
             >
                <button onClick={() => setSelectedNotification(null)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors">
                  <X size={24} />
                </button>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        selectedNotification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                        selectedNotification.type === 'error' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {selectedNotification.type.toUpperCase()} SIGNAL
                      </span>
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                         {new Date(selectedNotification.created_at).toLocaleString()}
                      </p>
                   </div>
                   <h2 className="text-3xl font-serif italic text-white leading-tight">{selectedNotification.title}</h2>
                </div>
                <div className="w-full h-px bg-white/5" />
                <p className="text-base text-white/60 leading-relaxed font-medium whitespace-pre-wrap">
                   {selectedNotification.message}
                </p>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="w-full py-5 bg-white text-black hover:bg-red-600 hover:text-white transition-all font-black uppercase tracking-[0.4em] text-[11px] rounded-[1.5rem] shadow-xl"
                >
                  Terminate View
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
