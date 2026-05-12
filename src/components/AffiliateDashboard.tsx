import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Copy, 
  CheckCircle, 
  CreditCard, 
  Clock,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieApi } from '../lib/api';

interface AffiliateDashboardProps {
  onBack: () => void;
}

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'earnings'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await movieApi.getAffiliateDashboard();
        setData(res);
      } catch (err) {
        console.error("Failed to fetch affiliate dash:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = () => {
    if (data?.affiliate?.referral_code) {
      navigator.clipboard.writeText(data.affiliate.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0E]/50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 pb-32">
        <div className="p-4 bg-red-600/10 rounded-full mb-6">
            <Users size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-white">Not an Affiliate</h2>
        <p className="text-white/40 max-w-sm mb-8">
          Only approved users can access the affiliate program. Please contact the administrator.
        </p>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full font-bold transition-all border border-white/5 text-white"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const { stats, affiliate, referrals, earnings } = data;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0B] pb-24">
      <div className="w-full max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-red-600 text-[9px] font-black uppercase tracking-[0.2em] rounded text-white">Partner</span>
                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Affiliate Dashboard</p>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Welcome, {affiliate.user_email.split('@')[0]}</h1>
          </div>

          <div className="bg-[#161618] px-6 py-4 rounded-3xl border border-white/5 flex items-center gap-6 shadow-2xl">
            <div>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Your Referral Code</p>
              <p className="text-2xl font-black tracking-[0.2em] text-red-500">{affiliate.referral_code}</p>
            </div>
            <button 
              onClick={handleCopy}
              className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/40'}`}
            >
              {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Referrals', value: stats.total_referrals, icon: Users, color: 'blue' },
            { label: 'Paid Users', value: stats.paid_referrals, icon: ArrowUpRight, color: 'green' },
            { label: 'Earnings', value: `₦${stats.total_earnings.toLocaleString()}`, icon: DollarSign, color: 'red' },
            { label: 'Pending', value: `₦${stats.pending_earnings.toLocaleString()}`, icon: Clock, color: 'yellow' },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-50 bg-[#161618] p-6 rounded-3xl border border-gray-200 border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-${stat.color}-500/10 rounded-xl`}>
                    <stat.icon className={`text-${stat.color}-500`} size={20} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 p-1.5 bg-gray-100 bg-[#161618] rounded-2xl w-fit mb-8 border border-gray-200 border-white/5">
            {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'referrals', label: 'Referrals', icon: Users },
                { id: 'earnings', label: 'Earnings', icon: DollarSign }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:text-white'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>

        <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
                <motion.div 
                   key="overview"
                   initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                   className="space-y-8"
                >
                    <div className="bg-gray-50 bg-[#161618] rounded-3xl border border-gray-200 border-white/5 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-lg text-white">Partner Program Strategy</h3>
                            <span className="text-xs text-red-500 font-bold uppercase tracking-widest">Earning Rules</span>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                                    <Send size={18} className="text-red-500" />
                                </div>
                                <h4 className="font-bold text-white">Share Your Code</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Send your unique code <span className="text-white font-mono">{affiliate.referral_code}</span> to friends and family.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                    <ArrowUpRight size={18} className="text-blue-500" />
                                </div>
                                <h4 className="font-bold text-white">They Upgrade</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    When they use your code during upgrade and their payment is approved, you earn!
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="w-10 h-10 bg-green-600/10 rounded-xl flex items-center justify-center">
                                    <DollarSign size={18} className="text-green-500" />
                                </div>
                                <h4 className="font-bold text-white">Earn 20% commission</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Every approved subscription nets you a 20% instant partner earning. More users, more wealth!
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'referrals' && (
               <motion.div 
                    key="referrals"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                >
                    <div className="bg-gray-50 bg-[#161618] rounded-3xl border border-gray-200 border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 border-b border-gray-200 border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 font-black uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-[#E1E1E1]">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            No referrals yet. Start sharing your code!
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.map((ref: any, idx: number) => (
                                        <tr key={idx} className="border-b border-gray-200 border-white/5 hover:bg-gray-100 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 font-bold text-white">{ref.referred_user_email}</td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    ref.is_premium ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500'
                                                }`}>
                                                    {ref.is_premium ? 'Paid' : 'Free'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
               </motion.div>
            )}

            {activeTab === 'earnings' && (
               <motion.div 
                    key="earnings"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                >
                    <div className="bg-gray-50 bg-[#161618] rounded-3xl border border-gray-200 border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 border-b border-gray-200 border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Sale Amount</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Commission (20%)</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 font-black uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-[#E1E1E1]">
                                {earnings.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            Earnings appear here once your referrals' payments are approved.
                                        </td>
                                    </tr>
                                ) : (
                                    earnings.map((earn: any) => (
                                        <tr key={earn.id} className="border-b border-gray-200 border-white/5 hover:bg-gray-100 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4 text-gray-500">{new Date(earn.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-white/40">₦{Number(earn.total_amount || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-black text-white">₦{Number(earn.amount).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    earn.status === 'paid' ? 'bg-blue-500/20 text-blue-500' : 'bg-yellow-500/20 text-yellow-500'
                                                }`}>
                                                    {earn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};
