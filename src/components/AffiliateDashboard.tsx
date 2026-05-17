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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (data?.affiliate?.referral_code) {
      const link = `${window.location.host === 'localhost:3000' || window.location.host.includes('ai.studio') ? window.location.origin : 'https://' + window.location.host}?ref=${data.affiliate.referral_code}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
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
      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-10">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-red-600 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] rounded text-white italic">Partner</span>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Affiliate Node</p>
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white truncate max-w-[280px] md:max-w-none px-1">
              {affiliate.user_email.split('@')[0].toUpperCase()}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="bg-[#121214] px-4 py-2.5 rounded-2xl border border-white/5 flex items-center justify-between gap-3 w-full sm:w-[220px] shadow-xl">
                <div className="min-w-0">
                  <p className="text-[8px] text-white/20 font-black uppercase tracking-widest leading-none mb-1">Affiliate Link</p>
                  <p className="text-[10px] font-mono text-white/40 truncate">{window.location.origin}?ref={affiliate.referral_code}</p>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className={`p-2 rounded-xl transition-all shrink-0 ${copiedLink ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/40'}`}
                >
                  {copiedLink ? <CheckCircle size={14} /> : <ExternalLink size={14} />}
                </button>
            </div>

            <div className="bg-[#121214] px-4 py-2.5 rounded-2xl border border-white/5 flex items-center justify-between gap-3 w-full sm:w-[150px] shadow-xl">
                <div className="min-w-0">
                  <p className="text-[8px] text-white/20 font-black uppercase tracking-widest leading-none mb-1">Ref Code</p>
                  <p className="text-sm font-black tracking-[0.1em] text-red-500 leading-none">{affiliate.referral_code}</p>
                </div>
                <button 
                  onClick={handleCopyCode}
                  className={`p-2 rounded-xl transition-all shrink-0 ${copiedCode ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/40'}`}
                >
                  {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />}
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
        )}        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 md:mb-12">
          {[
            { label: 'Total Referrals', value: stats.total_referrals, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Paid Users', value: stats.paid_referrals, icon: ArrowUpRight, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Total Earnings', value: `₦${stats.total_earnings.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Owed Earnings', value: `₦${stats.pending_earnings.toLocaleString()}`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Payout Requests', value: `₦${stats.requested_earnings.toLocaleString()}`, icon: Send, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#161618] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-center"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 ${stat.bg} rounded-xl`}>
                    <stat.icon className={stat.color} size={18} />
                </div>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mb-1 truncate">{stat.label}</p>
              <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-[#161618] rounded-2xl w-fit mb-8 border border-white/5 max-w-full">
            {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'referrals', label: 'Referrals', icon: Users },
                { id: 'earnings', label: 'Earnings', icon: DollarSign }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:text-white'
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
                    <div className="bg-[#161618] rounded-2xl md:rounded-3xl border border-white/5 p-5 md:p-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
                            <h3 className="font-black text-lg md:text-xl text-white uppercase tracking-tight">Partner Optimization</h3>
                            <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em] bg-red-500/10 px-4 py-1 rounded-full">Protocol Rules</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            <div className="space-y-3 md:space-y-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-red-500/10">
                                    <Send size={20} className="text-red-500" />
                                </div>
                                <h4 className="font-black text-white uppercase tracking-widest text-[10px] md:text-xs">Dispatch Code</h4>
                                <p className="text-[10px] md:text-xs text-white/40 leading-relaxed font-medium">
                                    Broadcast your unique identifier <span className="text-red-500 font-mono font-bold">{affiliate.referral_code}</span> across your networks.
                                </p>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-blue-500/10">
                                    <ArrowUpRight size={20} className="text-blue-500" />
                                </div>
                                <h4 className="font-black text-white uppercase tracking-widest text-[10px] md:text-xs">Node Activation</h4>
                                <p className="text-[10px] md:text-xs text-white/40 leading-relaxed font-medium">
                                    When nodes (users) upgrade using your link/code, they link permanently to your account.
                                </p>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-emerald-500/10">
                                    <DollarSign size={20} className="text-emerald-500" />
                                </div>
                                <h4 className="font-black text-white uppercase tracking-widest text-[10px] md:text-xs">Credit Liquidation</h4>
                                <p className="text-[10px] md:text-xs text-white/40 leading-relaxed font-medium">
                                    Accumulate bounty for every successful deployment. Liquidate earnings once thresholds are met.
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
                    <div className="bg-[#161618] rounded-3xl border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
                        <table className="w-full text-left text-sm min-w-[500px]">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest">Identified User</th>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest">Linked Since</th>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest text-right">Clearance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {referrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">
                                            Zero signals captured. Distribute your code.
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.map((ref: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-white tracking-tight">{ref.referred_user_email}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs text-white/40 font-medium">{new Date(ref.created_at).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    ref.is_premium ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-white/20 border border-white/5'
                                                }`}>
                                                    {ref.is_premium ? 'VIP ELITE' : 'FREE USER'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) || []}
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
                    <div className="bg-[#161618] rounded-3xl border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest">Transaction Date</th>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest">Inflow Volume</th>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest">Commission Yield</th>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest">Payer Detail</th>
                                    <th className="px-8 py-6 text-[10px] text-white/20 font-black uppercase tracking-widest text-right">Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {earnings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">
                                            Ledger is empty. Awaiting approved payments.
                                        </td>
                                    </tr>
                                ) : (
                                    earnings.map((earn: any) => (
                                        <tr key={earn.id} className="hover:bg-white/[0.01] transition-colors text-white">
                                            <td className="px-8 py-6 text-xs text-white/40 font-medium">
                                                {new Date(earn.created_at).toLocaleDateString()}
                                                <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">Ref: {earn.id}</p>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-white/40 font-medium">₦{Number(earn.total_amount || 0).toLocaleString()}</td>
                                            <td className="px-8 py-6 font-black text-red-500 tracking-tight">₦{Number(earn.amount).toLocaleString()}</td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-white/60 truncate max-w-[150px]">{earn.payer_email}</p>
                                                <p className="text-[9px] text-white/20 uppercase tracking-widest">{earn.plan} PLAN</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    earn.status === 'paid' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                                                    earn.status === 'requested' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                                                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                }`}>
                                                    {earn.status === 'paid' ? 'SETTLED' : earn.status === 'requested' ? 'IN REVIEW' : 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) || []}
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
