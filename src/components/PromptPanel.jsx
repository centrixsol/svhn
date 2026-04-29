import { useRef, useState } from 'react';
import { Wand2, Upload, X, ImageIcon, Loader2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_CHARS = 1000;

export default function PromptPanel({ onGenerate, isGenerating, uploadedImage, onImageUpload }) {
  const [prompt, setPrompt] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const fileRef = useRef(null);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    if (!history.includes(prompt.trim())) {
      setHistory((h) => [prompt.trim(), ...h].slice(0, 8));
    }
    onGenerate(prompt.trim(), uploadedImage);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageUpload({ dataUrl: e.target.result, base64: e.target.result.split(',')[1], mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <aside className="w-80 shrink-0 flex flex-col overflow-y-auto border-r border-white/5"
      style={{ background: '#0b0b17' }}>

      <div className="p-5 flex flex-col gap-4">
        {/* Section title */}
        <div className="flex items-center gap-2">
          <Wand2 size={15} className="text-violet-400" />
          <span className="text-xs font-semibold tracking-widest text-white/40 uppercase">Imagine</span>
        </div>

        {/* Prompt textarea */}
        <div className="relative rounded-xl overflow-hidden glow-focus"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
            placeholder="Describe the image you want to create…&#10;&#10;E.g. A cinematic photo of a neon-lit Tokyo alley at night, rain-soaked streets, film grain"
            rows={7}
            className="w-full bg-transparent p-4 text-sm text-white/80 placeholder-white/20 resize-none outline-none leading-relaxed"
          />
          <div className="absolute bottom-2 right-3 text-[10px] text-white/20 tabular-nums">
            {prompt.length}/{MAX_CHARS}
          </div>
        </div>

        {/* Image upload */}
        <div>
          <p className="text-[11px] text-white/30 font-medium mb-2 uppercase tracking-wider">
            Reference image (optional)
          </p>

          {uploadedImage ? (
            <div className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: '16/9' }}>
              <img src={uploadedImage.dataUrl} alt="Reference" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => onImageUpload(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-medium hover:bg-red-500 transition-colors">
                  <X size={12} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 py-7 cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-violet-500/60 bg-violet-500/10'
                  : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
              }`}>
              <ImageIcon size={22} className={dragOver ? 'text-violet-400' : 'text-white/20'} />
              <p className="text-xs text-white/30 text-center px-4 leading-relaxed">
                Drop an image here, or <span className="text-violet-400">browse</span>
              </p>
              <p className="text-[10px] text-white/15">PNG, JPG, WebP</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {/* Generate button */}
        <motion.button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="btn-primary w-full rounded-xl py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2.5"
          whileTap={{ scale: 0.97 }}>
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Generate Image
            </>
          )}
        </motion.button>

        <p className="text-[10px] text-white/20 text-center">⌘ Enter to generate</p>

        {/* Prompt history */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1">
              <div className="flex items-center gap-2 mb-2">
                <History size={12} className="text-white/25" />
                <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium">Recent prompts</span>
              </div>
              <div className="flex flex-col gap-1">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(h)}
                    className="text-left text-xs text-white/35 hover:text-white/65 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all truncate">
                    {h}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
