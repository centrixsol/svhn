import { useState } from 'react';
import {
  Eraser, Download, Layers, ToggleLeft, ToggleRight,
  MapPin, Check, Trash2, FileImage, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WATERMARKS } from '../utils/watermarks';

const POSITIONS = [
  { id: 'topLeft',     label: '↖' },
  { id: 'topRight',    label: '↗' },
  { id: 'center',      label: '⊙' },
  { id: 'bottomLeft',  label: '↙' },
  { id: 'bottomRight', label: '↘' },
];

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon size={13} className="text-violet-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-white/40">{title}</span>
        </div>
        <ChevronDown size={12} className={`text-white/25 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden">
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-white/35">{label}</span>
        <span className="text-xs text-white/55 tabular-nums">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function ToolsPanel({
  hasImage,
  showWatermark, onToggleWatermark,
  watermark, onWatermarkSelect,
  wmPosition, onPositionChange,
  wmOpacity, onOpacityChange,
  wmSize, onSizeChange,
  isEraserActive, onToggleEraser,
  eraserSize, onEraserSizeChange,
  hasMask,
  onApplyErase, onClearMask,
  onDownload,
}) {
  const [downloadFormat, setDownloadFormat] = useState('png');

  return (
    <aside className="w-72 shrink-0 flex flex-col overflow-y-auto border-l border-white/5"
      style={{ background: '#0b0b17' }}>

      {/* ── Watermark ─────────────────────────────── */}
      <Section title="Watermark" icon={Layers}>
        {/* Toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-white/55">Show watermark</span>
          <button onClick={onToggleWatermark} className="text-violet-400 hover:text-violet-300 transition-colors">
            {showWatermark ? <ToggleRight size={22} /> : <ToggleLeft size={22} className="text-white/25" />}
          </button>
        </div>

        {/* Watermark grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {WATERMARKS.map((wm) => (
            <button
              key={wm.id}
              onClick={() => onWatermarkSelect(wm)}
              className={`relative flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all ${
                watermark?.id === wm.id
                  ? 'bg-violet-500/20 ring-1 ring-violet-500/50'
                  : 'bg-white/[0.03] hover:bg-white/[0.06]'
              }`}>
              <img src={wm.dataUrl} alt={wm.name} className="w-8 h-8 object-contain" />
              <span className="text-[10px] text-white/40">{wm.name}</span>
              {watermark?.id === wm.id && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check size={9} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Position */}
        <div className="mb-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2">Position</p>
          <div className="grid grid-cols-5 gap-1">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => onPositionChange(p.id)}
                className={`py-2 rounded-lg text-sm transition-all ${
                  wmPosition === p.id
                    ? 'bg-violet-500/30 text-violet-300 ring-1 ring-violet-500/40'
                    : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Slider label="Opacity" value={Math.round(wmOpacity * 100)} min={10} max={100}
            onChange={(v) => onOpacityChange(v / 100)} />
          <Slider label="Size (px)" value={wmSize} min={24} max={160}
            onChange={onSizeChange} />
        </div>
      </Section>

      {/* ── Magic Eraser ──────────────────────────── */}
      <Section title="Magic Eraser" icon={Eraser}>
        <p className="text-xs text-white/30 leading-relaxed mb-4">
          Paint over a watermark or artifact to remove it using surrounding pixel content.
        </p>

        <button
          onClick={onToggleEraser}
          disabled={!hasImage}
          className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all mb-3 ${
            isEraserActive
              ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
              : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed'
          }`}>
          <Eraser size={14} />
          {isEraserActive ? 'Eraser Active — Click to Stop' : 'Activate Eraser'}
        </button>

        <Slider label="Brush size" value={eraserSize} min={10} max={120}
          onChange={onEraserSizeChange} />

        <div className="flex gap-2 mt-4">
          <button
            onClick={onApplyErase}
            disabled={!hasMask || !hasImage}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all btn-primary disabled:opacity-30 disabled:cursor-not-allowed">
            <Check size={14} /> Apply
          </button>
          <button
            onClick={onClearMask}
            disabled={!hasMask}
            className="px-3.5 py-2.5 rounded-xl text-white/40 hover:text-white/70 bg-white/[0.05] hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <Trash2 size={14} />
          </button>
        </div>
      </Section>

      {/* ── Download ──────────────────────────────── */}
      <Section title="Export" icon={Download} defaultOpen={true}>
        <p className="text-xs text-white/30 mb-3 leading-relaxed">
          Downloads the full-resolution image with your watermark applied.
        </p>

        {/* Format picker */}
        <div className="flex gap-2 mb-4">
          {['png', 'jpg'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setDownloadFormat(fmt)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                downloadFormat === fmt
                  ? 'bg-violet-500/25 text-violet-300 ring-1 ring-violet-500/40'
                  : 'bg-white/[0.04] text-white/35 hover:bg-white/[0.07]'
              }`}>
              <FileImage size={11} className="inline mr-1.5" />
              {fmt}
            </button>
          ))}
        </div>

        <motion.button
          onClick={() => onDownload(downloadFormat)}
          disabled={!hasImage}
          className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}>
          <Download size={15} />
          Download HD Image
        </motion.button>

        {hasImage && (
          <p className="text-[10px] text-white/20 text-center mt-2">
            Saved at original Gemini resolution
          </p>
        )}
      </Section>

      {/* ── Position indicator ────────────────────── */}
      <div className="mt-auto p-5">
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <p className="text-[10px] text-violet-300/60 leading-relaxed">
            <MapPin size={10} className="inline mr-1" />
            Images are generated locally — no data is stored
          </p>
        </div>
      </div>
    </aside>
  );
}
