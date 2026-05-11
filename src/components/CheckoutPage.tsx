import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Wallet, 
  Send, 
  CheckCircle, 
  Copy, 
  Upload, 
  ChevronRight, 
  ShieldCheck, 
  Clock,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieApi, setAuthEmail } from '../lib/api';
import { PaymentConfig } from '../types';

interface CheckoutPageProps {
  user: any;
  plan?: 'monthly' | 'yearly';
  onSuccess: () => void;
  onBack: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ user, plan: initialPlan, onSuccess, onBack }) => {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>(initialPlan || 'monthly');
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sender_name: '',
    transaction_reference: '',
    referral_code: '',
    tracking_answers: {} as any,
    proof_image_url: ''
  });

  const price = plan === 'monthly' ? 1500 : 15000;
  const planLabel = plan === 'monthly' ? 'Monthly' : 'Yearly';

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await movieApi.getCheckoutConfig();
        setConfig(data);
        if (data && data.tracking_questions) {
            try {
                let q = data.tracking_questions;
                // If it's a string, try to parse it (sometimes double encoded)
                if (typeof q === 'string' && q.trim() !== '') {
                    try {
                        q = JSON.parse(q);
                        if (typeof q === 'string') {
                            q = JSON.parse(q);
                        }
                    } catch (e) {
                         console.warn("Tracking questions skip: invalid format", q);
                         q = [];
                    }
                }
                
                if (Array.isArray(q)) {
                    const initialAnswers = {} as any;
                    q.forEach((question: string) => {
                        if (typeof question === 'string') {
                            initialAnswers[question] = '';
                        }
                    });
                    setFormData(prev => ({ ...prev, tracking_answers: initialAnswers }));
                }
            } catch (e) {
                console.error("Critical failure parsing tracking questions", e);
            }
        }
      } catch (err) {
        console.error("Failed to fetch payment config", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await movieApi.submitCheckout({
        user_email: user.email,
        plan,
        amount: price,
        ...formData
      });
      setStep(3); // Success step
    } catch (err: any) {
      alert(err.message || "Failed to submit payment proof. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0E]/50">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0B] flex flex-col items-center py-2 px-2 no-scrollbar">
      <div className="w-full max-w-[320px] space-y-4">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between relative px-6 max-w-[140px] mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2 z-0" />
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                step >= s ? 'bg-red-600 border-red-600 text-white' : 'bg-[#161618] border-white/10 text-white/40'
              }`}
            >
              {step > s ? <CheckCircle size={10} /> : <span className="font-black text-[8px]">{s}</span>}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              <div className="text-center space-y-1">
                <h1 className="text-base font-black tracking-tight uppercase italic font-serif leading-tight text-white">Elevate Access</h1>
                <p className="text-[7px] text-white/20 uppercase tracking-[0.4em] font-black">Select Deployment Tier</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div 
                  onClick={() => setPlan('monthly')}
                  className={`p-3 rounded-xl cursor-pointer border-2 transition-all group relative overflow-hidden ${
                    plan === 'monthly' ? 'bg-red-600/10 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.15)]' : 'bg-[#121214] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${plan === 'monthly' ? 'bg-red-600/20' : 'bg-white/5'}`}>
                      <Clock className={plan === 'monthly' ? 'text-red-500' : 'text-gray-500'} size={14} />
                    </div>
                  </div>
                  <h3 className="text-[10px] font-black mb-0.5 uppercase tracking-wider text-white/80">Monthly</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black italic font-serif text-white">₦1,500</span>
                  </div>
                </div>

                <div 
                  onClick={() => setPlan('yearly')}
                  className={`p-3 rounded-xl cursor-pointer border-2 transition-all relative group overflow-hidden ${
                    plan === 'yearly' ? 'bg-red-600/10 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.15)]' : 'bg-[#121214] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-600 text-[5px] font-black uppercase tracking-widest rounded-bl-md z-10 text-white">Best Value</div>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 ${plan === 'yearly' ? 'bg-red-600/20' : 'bg-white/5'}`}>
                      <ShieldCheck className={plan === 'yearly' ? 'text-red-500' : 'text-gray-500'} size={14} />
                    </div>
                  </div>
                  <h3 className="text-[10px] font-black mb-0.5 uppercase tracking-wider text-white/80">Imperial</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black italic font-serif text-white">₦15,000</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#121214] rounded-xl p-3 border border-white/5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[7px] text-white/30 font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={8} className="text-red-500" />
                        <span>4K HDR</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={8} className="text-red-500" />
                        <span>NO ADS</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={8} className="text-red-500" />
                        <span>OFFLINE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={8} className="text-red-500" />
                        <span>PRIORITY</span>
                    </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  Secure Activation
                  <ChevronRight size={14} />
                </button>
                <button 
                  onClick={onBack}
                  className="w-full py-3 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-white/20 font-black uppercase tracking-widest text-[8px] rounded-xl transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 pb-6"
                         <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setStep(1)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white">
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h1 className="text-sm font-black tracking-tight uppercase italic font-serif leading-tight text-white">Payment Verification</h1>
                  <p className="text-[8px] text-white/40 font-black uppercase tracking-widest leading-none mt-1">{planLabel} — ₦{price.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-red-600/5 border border-red-500/10 rounded-2xl p-4 flex gap-3">
                <Info className="text-red-500 shrink-0" size={14} />
                <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                  {config?.payment_note || "System activation requires verification proof. Complete the transfer below."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {config?.bank_name && (
                   <div className="bg-[#121214] rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
                     <div className="flex items-center gap-2">
                        <CreditCard className="text-red-500" size={14} />
                        <p className="font-black text-[10px] uppercase tracking-widest text-white">{config.bank_name}</p>
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center justify-between bg-white/[0.01] px-3 py-2 rounded-xl border border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest truncate max-w-[180px] text-white">{config.account_name}</p>
                          <button onClick={() => handleCopy(config.account_name, 'accName')} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all">
                            {copied === 'accName' ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-white/[0.02] px-4 py-3 rounded-xl border border-red-600/20 shadow-lg shadow-red-600/5">
                          <p className="text-sm font-black tracking-[0.2em] font-mono text-red-500">{config.account_number}</p>
                          <button onClick={() => handleCopy(config.account_number, 'accNum')} className="p-2 bg-red-600/10 hover:bg-red-600/20 rounded-lg text-red-500 transition-all">
                            {copied === 'accNum' ? <CheckCircle size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                     </div>
                   </div>
                )}

                {config?.crypto_address && (
                   <div className="bg-[#121214] rounded-2xl p-4 border border-white/5 flex items-center justify-between group">
                     <div className="flex items-center gap-3 overflow-hidden">
                        <Wallet className="text-red-500 shrink-0" size={14} />
                        <p className="text-[9px] font-mono truncate text-white/40 tracking-wider font-medium">{config.crypto_address}</p>
                     </div>
                     <button onClick={() => handleCopy(config.crypto_address, 'crypto')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all ml-1 shrink-0">
                        {copied === 'crypto' ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                     </button>
                   </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-[#121214] rounded-2xl p-5 border border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[7px] text-white/20 uppercase tracking-[0.3em] font-black ml-1">Account Name</label>
                      <input 
                        required type="text" value={formData.sender_name}
                        onChange={e => setFormData({ ...formData, sender_name: e.target.value })}
                        placeholder="NAME ON ACCOUNT"
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 text-[10px] focus:border-red-600 focus:outline-none transition-all uppercase font-black text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[7px] text-white/20 uppercase tracking-[0.3em] font-black ml-1">Reference ID</label>
                      <input 
                        required type="text" value={formData.transaction_reference}
                        onChange={e => setFormData({ ...formData, transaction_reference: e.target.value })}
                        placeholder="TRX-REF"
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 text-[10px] focus:border-red-600 focus:outline-none transition-all uppercase font-black text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[7px] text-white/20 uppercase tracking-[0.3em] font-black ml-1">Referral Code</label>
                      <input 
                        type="text" value={formData.referral_code}
                        onChange={e => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                        placeholder="OPTIONAL"
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 text-[10px] focus:border-red-600 focus:outline-none transition-all uppercase font-black text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[7px] text-white/20 uppercase tracking-[0.3em] font-black ml-1">Proof URL</label>
                      <div className="relative">
                        <input 
                          required type="url" value={formData.proof_image_url}
                          onChange={e => setFormData({ ...formData, proof_image_url: e.target.value })}
                          placeholder="PASTE LINK"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2.5 text-[9px] focus:border-red-600 focus:outline-none transition-all pr-8 text-white"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">
                          <Upload size={10} />
                        </div>
                      </div>
                    </div>
                  </div>  </div>

                  <button 
                    disabled={submitting}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] active:scale-95"
                  >
                    {submitting ? 'Authenticating...' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3 py-6 flex flex-col items-center justify-center min-h-[30vh]"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <div className="space-y-1">
                <h1 className="text-sm font-black tracking-tight uppercase italic font-serif leading-tight text-white">Submitted</h1>
                <p className="text-[6px] text-white/30 font-medium leading-normal max-w-[180px] mx-auto uppercase tracking-wider">
                  Verification usually takes 1-4 hours. Check notifications.
                </p>
              </div>
              <button 
                  onClick={onSuccess}
                  className="w-full max-w-[140px] py-2 bg-white/5 hover:bg-white/10 rounded-lg font-black transition-all border border-white/5 text-[7px] uppercase tracking-widest text-white/40"
              >
                  Close Panel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
