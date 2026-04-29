import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { applyMagicErase, buildMaskFromOverlay } from '../utils/magicEraser';

const ImageCanvas = forwardRef(function ImageCanvas(
  {
    displayImage,
    isGenerating,
    generatingMsg = 'Generating…',
    error,
    watermark,
    showWatermark,
    wmPosition,
    wmOpacity,
    wmSize,
    isEraserActive,
    eraserSize,
    onEraseApplied,
  },
  ref
) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const isDrawing = useRef(false);
  const [hasMask, setHasMask] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ── Draw composite (image + watermark) to canvas ──────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displayImage) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Sync overlay size
      if (overlayRef.current) {
        overlayRef.current.width = img.naturalWidth;
        overlayRef.current.height = img.naturalHeight;
        overlayRef.current.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasMask(false);

      ctx.drawImage(img, 0, 0);

      if (showWatermark && watermark) {
        const wm = new Image();
        wm.onload = () => {
          const size = wmSize;
          const pad = 18;
          const cw = canvas.width, ch = canvas.height;
          const positions = {
            topLeft: [pad, pad],
            topRight: [cw - size - pad, pad],
            bottomLeft: [pad, ch - size - pad],
            bottomRight: [cw - size - pad, ch - size - pad],
            center: [(cw - size) / 2, (ch - size) / 2],
          };
          const [wx, wy] = positions[wmPosition] ?? positions.bottomRight;
          ctx.globalAlpha = wmOpacity;
          ctx.drawImage(wm, wx, wy, size, size);
          ctx.globalAlpha = 1;
        };
        wm.src = watermark.dataUrl;
      }
    };

    img.src = displayImage;
  }, [displayImage, showWatermark, watermark, wmPosition, wmOpacity, wmSize]);

  /* ── Erase brush ────────────────────────────────────────────────── */
  const getCanvasCoords = (e) => {
    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
  };

  const paintBrush = (e) => {
    if (!isDrawing.current || !isEraserActive) return;
    const overlay = overlayRef.current;
    const ctx = overlay.getContext('2d');
    const [x, y] = getCanvasCoords(e);
    const scale = overlay.width / overlayRef.current.getBoundingClientRect().width;
    const radius = (eraserSize / 2) * scale;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(239,68,68,0.75)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    setHasMask(true);
  };

  /* ── Apply / clear exposed via ref ─────────────────────────────── */
  useImperativeHandle(ref, () => ({
    applyErase() {
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay || !hasMask) return;

      setIsProcessing(true);
      setTimeout(() => {
        const ctx = canvas.getContext('2d');
        const overlayCtx = overlay.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const mask = buildMaskFromOverlay(overlayCtx, canvas.width, canvas.height);
        const result = applyMagicErase(imageData, mask);
        ctx.putImageData(result, 0, 0);
        overlayCtx.clearRect(0, 0, canvas.width, canvas.height);
        setHasMask(false);
        setIsProcessing(false);
        onEraseApplied(canvas.toDataURL('image/png'));
      }, 30);
    },
    clearMask() {
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
        setHasMask(false);
      }
    },
    download(format = 'png') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? 0.95 : 1.0;
      const link = document.createElement('a');
      link.download = `svhn-studio-${Date.now()}.${format}`;
      link.href = canvas.toDataURL(mime, quality);
      link.click();
    },
    hasMask: () => hasMask,
  }));

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-w-0 overflow-hidden relative">
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-start gap-3 px-4 py-3 rounded-xl text-sm max-w-sm w-full"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
            }}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}>
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <span className="leading-snug">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty / loading state */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            {/* Animated skeleton */}
            <div className="rounded-2xl overflow-hidden" style={{ width: 480, aspectRatio: '1' }}>
              <div className="w-full h-full shimmer" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-violet-500"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-sm text-white/40">{generatingMsg}</p>
            </div>
          </motion.div>
        ) : !displayImage ? (
          <motion.div
            key="empty"
            className="flex flex-col items-center gap-5 select-none"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}>
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(124,58,237,0.25), rgba(99,102,241,0.08))',
                border: '1px solid rgba(124,58,237,0.2)',
              }}>
              <Sparkles size={38} className="text-violet-400/70" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white/50">Your canvas awaits</p>
              <p className="text-sm text-white/25 mt-1">Describe an image in the prompt panel to get started</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Canvas area */}
      {displayImage && !isGenerating && (
        <motion.div
          key="canvas"
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 180px)' }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}>
          {/* Main canvas */}
          <canvas
            ref={canvasRef}
            className="block max-w-full max-h-[calc(100vh-180px)] object-contain"
          />

          {/* Eraser overlay */}
          <canvas
            ref={overlayRef}
            className={`absolute inset-0 w-full h-full ${isEraserActive ? 'eraser-cursor' : 'pointer-events-none'}`}
            style={{ opacity: 0.7 }}
            onMouseDown={(e) => { isDrawing.current = true; paintBrush(e); }}
            onMouseMove={paintBrush}
            onMouseUp={() => { isDrawing.current = false; }}
            onMouseLeave={() => { isDrawing.current = false; }}
            onTouchStart={(e) => { isDrawing.current = true; paintBrush(e); e.preventDefault(); }}
            onTouchMove={(e) => { paintBrush(e); e.preventDefault(); }}
            onTouchEnd={() => { isDrawing.current = false; }}
          />

          {/* Eraser hint */}
          {isEraserActive && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs text-white font-medium pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
              Paint over the area you want to remove
            </div>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(8,8,14,0.7)', backdropFilter: 'blur(4px)' }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                <p className="text-sm text-white/60">Applying magic erase…</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
});

export default ImageCanvas;
