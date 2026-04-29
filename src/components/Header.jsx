import { useState } from 'react';
import { Sparkles, Key, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ apiKey, onApiKeyChange }) {
  const [show, setShow] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0"
      style={{ background: 'rgba(8,8,14,0.95)', backdropFilter: 'blur(20px)' }}>

      {/* Logo */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}>
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-bold gradient-text">SVHN</span>
          <span className="text-lg font-light text-white/60 ml-1.5">AI Studio</span>
        </div>
        <span className="hidden sm:block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider text-violet-300 border border-violet-500/30"
          style={{ background: 'rgba(124,58,237,0.12)' }}>
          BETA
        </span>
      </motion.div>

      {/* API Key input */}
      <motion.div
        className="flex items-center gap-2 glow-focus rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          minWidth: '280px',
          maxWidth: '340px',
        }}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}>
        <Key size={14} className="text-white/30 ml-3 shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          placeholder="Gemini API key…"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="flex-1 bg-transparent py-2.5 text-sm text-white/80 placeholder-white/20 outline-none"
        />
        <button
          className="px-3 text-white/30 hover:text-white/60 transition-colors"
          onClick={() => setShow((s) => !s)}
          type="button"
          title={show ? 'Hide key' : 'Show key'}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </motion.div>
    </header>
  );
}
