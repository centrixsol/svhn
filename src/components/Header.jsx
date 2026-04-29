import { useEffect, useState } from 'react';
import { Sparkles, Key, Eye, EyeOff, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRateLimitInfo } from '../utils/huggingface';

function formatCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function Header({ token, onTokenChange }) {
  const [show, setShow] = useState(false);
  const [rl, setRl] = useState(() => getRateLimitInfo());

  useEffect(() => {
    const interval = setInterval(() => setRl(getRateLimitInfo()), rl.limited ? 1000 : 5000);
    return () => clearInterval(interval);
  }, [rl.limited]);

  const pct = Math.min(100, Math.round((rl.used / rl.max) * 100));
  const barColor = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e';

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 shrink-0 gap-4"
      style={{ background: 'rgba(8,8,14,0.97)', backdropFilter: 'blur(20px)' }}>

      {/* Logo */}
      <motion.div className="flex items-center gap-3 shrink-0"
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <span className="text-lg font-bold gradient-text">SVHN</span>
          <span className="text-lg font-light text-white/50 ml-1.5">AI Studio</span>
        </div>
      </motion.div>

      {/* HF Token input */}
      <motion.div className="flex-1 max-w-sm"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="relative flex items-center rounded-xl overflow-hidden glow-focus"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Key size={13} className="text-white/25 ml-3 shrink-0" />
          <input
            type={show ? 'text' : 'password'}
            placeholder="Hugging Face API token  (hf_…)"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            className="flex-1 bg-transparent px-2.5 py-2.5 text-sm text-white/75 placeholder-white/20 outline-none"
          />
          <button onClick={() => setShow((s) => !s)} type="button"
            className="px-3 text-white/25 hover:text-white/55 transition-colors">
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-1 pl-1">
          <span className="text-[10px] text-white/20">Free token at</span>
          <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer"
            className="flex items-center gap-0.5 text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors">
            huggingface.co/settings/tokens <ExternalLink size={8} />
          </a>
        </div>
      </motion.div>

      {/* Usage widget */}
      <motion.div className="shrink-0"
        initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <AnimatePresence mode="wait">
          {rl.limited ? (
            <motion.div key="limited"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Clock size={12} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-300">
                Resets in&nbsp;<span className="font-bold tabular-nums">{formatCountdown(rl.resetAt - Date.now())}</span>
              </span>
            </motion.div>
          ) : (
            <motion.div key="normal"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-[11px] text-white/35">Free generations</span>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: barColor }}>
                    {rl.used} / {rl.max}
                  </span>
                </div>
                <div className="w-28 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <motion.div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
