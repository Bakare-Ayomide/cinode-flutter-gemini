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
  Send,
  Wallet,
  X
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
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank');

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

  const handleCopyCode = () => {
    if (data?.affiliate?.referral_code) {
      navigator.clipboard.writeText(data.affiliate.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (data?.affiliate?.referral_code) {
      const link = `${window.location.origin}?ref=${data.affiliate.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePayoutRequest = async () => {
    try {
      await movieApi.requestPayout();
      alert("Payout request submitted successfully. Our finance team will review it within 24 hours.");
      setShowPayoutModal(false);
      // Refresh data
      const res = await movieApi.getAffiliateDashboard();
      setData(res);
    } catch (err) {
      console.error("Payout request failed:", err);
      alert("Failed to submit payout request. Please try again later.");
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

          <div className="flex flex-wrap gap-4">
            <div className="bg-[#161618] px-6 py-4 rounded-3xl border border-white/5 flex items-center gap-6 shadow-2xl">
                <div>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Referral Link</p>
                <p className="text-xs font-mono text-white/40 truncate max-w-[200px]">{window.location.origin}?ref={affiliate.referral_code}</p>
                </div>
                <button 
                onClick={handleCopyLink}
                className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/40'}`}
                title="Copy Link"
                >
                {copied ? <CheckCircle size={20} /> : <ExternalLink size={20} />}
                </button>
            </div>

            <div className="bg-[#161618] px-6 py-4 rounded-3xl border border-white/5 flex items-center gap-6 shadow-2xl">
                <div>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Your Code</p>
                <p className="text-xl font-black tracking-[0.2em] text-red-500">{affiliate.referral_code}</p>
                </div>
                <button 
                onClick={handleCopyCode}
                className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/40'}`}
                title="Copy Code"
                >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                </button>
            </div>
          </div>
        </div>

        {/* Payout Banner */}
        {stats.pending_earnings >= 1000 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-gradient-to-r from-red-600/20 to-red-600/5 border border-red-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                <Wallet size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Withdrawal Ready</h3>
                <p className="text-xs text-white/40">You have ₦{stats.pending_earnings.toLocaleString()} available for payout.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPayoutModal(true)}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
            >
              Request Payout
            </button>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Referrals', value: stats.total_referrals, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Paid Users', value: stats.paid_referrals, icon: ArrowUpRight, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Earnings', value: `₦${stats.total_earnings.toLocaleString()}`, icon: DollarSign, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Pending', value: `₦${stats.pending_earnings.toLocaleString()}`, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Requested', value: `₦${stats.requested_earnings.toLocaleString()}`, icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#161618] p-6 rounded-3xl border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 ${stat.bg} rounded-xl`}>
                    <stat.icon className={stat.color} size={20} />
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
                                                    earn.status === 'paid' ? 'bg-green-500/20 text-green-500' : 
                                                    earn.status === 'requested' ? 'bg-blue-500/20 text-blue-500' : 
                                                    'bg-yellow-500/20 text-yellow-500'
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

        {/* Payout Modal */}
        <AnimatePresence>
          {showPayoutModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPayoutModal(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md bg-[#161618] border border-white/5 p-10 rounded-[2.5rem] space-y-8"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white">Request Payout</h2>
                    <p className="text-[10px] uppercase tracking-widest text-white/20 font-black">Minimum amount: ₦1,000</p>
                  </div>
                  <button onClick={() => setShowPayoutModal(false)} className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Amount to Withdraw</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black">₦</span>
                      <input 
                        type="number" 
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-10 pr-6 text-xl font-black text-white focus:outline-none focus:border-red-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['bank', 'crypto'].map(method => (
                        <button 
                          key={method}
                          onClick={() => setWithdrawalMethod(method)}
                          className={`py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                            withdrawalMethod === method ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/5 text-white/20 hover:text-white'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                       <span className="text-white/20">Available</span>
                       <span className="text-white font-mono">₦{stats.pending_earnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-white/20">Processing fee</span>
                       <span className="text-white font-mono">₦0 (Covered)</span>
                    </div>
                  </div>

                  <button 
                    disabled={!payoutAmount || Number(payoutAmount) < 1000 || Number(payoutAmount) > stats.pending_earnings}
                    onClick={handlePayoutRequest}
                    className="w-full bg-white text-black font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    Confirm Withdrawal
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
