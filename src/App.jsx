import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import PromptPanel from './components/PromptPanel';
import ImageCanvas from './components/ImageCanvas';
import ToolsPanel from './components/ToolsPanel';
import { generateImage, getRateLimitInfo } from './utils/huggingface';
import { WATERMARKS } from './utils/watermarks';

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function App() {
  /* ── Token ───────────────────────────────────────────────────── */
  const [token, setToken] = useState(() => localStorage.getItem('svhn_hf_token') || '');
  useEffect(() => { localStorage.setItem('svhn_hf_token', token); }, [token]);

  /* ── Image state ─────────────────────────────────────────────── */
  const [displayImage, setDisplayImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState('Generating…');
  const [error, setError] = useState(null);

  /* ── Rate limit / quota state ────────────────────────────────── */
  const [rateLimitResetAt, setRateLimitResetAt] = useState(null);
  const [countdown, setCountdown] = useState('');
  const isRateLimited = rateLimitResetAt !== null && rateLimitResetAt > Date.now();

  useEffect(() => {
    const rl = getRateLimitInfo();
    if (rl.limited) setRateLimitResetAt(rl.resetAt);
  }, []);

  useEffect(() => {
    if (!rateLimitResetAt) return;
    const tick = () => {
      const ms = rateLimitResetAt - Date.now();
      if (ms <= 0) { setRateLimitResetAt(null); setCountdown(''); setError(null); }
      else setCountdown(formatTime(ms));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rateLimitResetAt]);

  /* ── Watermark state ─────────────────────────────────────────── */
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermark, setWatermark] = useState(WATERMARKS[0]);
  const [wmPosition, setWmPosition] = useState('bottomRight');
  const [wmOpacity, setWmOpacity] = useState(0.85);
  const [wmSize, setWmSize] = useState(64);

  /* ── Eraser state ────────────────────────────────────────────── */
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [eraserSize, setEraserSize] = useState(30);
  const [hasMask, setHasMask] = useState(false);

  const canvasRef = useRef(null);
  const retryTimer = useRef(null);

  /* ── Generate with auto-retry on model loading ───────────────── */
  const handleGenerate = useCallback(async (prompt, inputImage, model, isRetry = false) => {
    if (!isRetry) {
      setError(null);
      setIsGenerating(true);
      setIsEraserActive(false);
      setGeneratingMsg('Generating…');
    }

    const fullPrompt = inputImage
      ? `${prompt}. Style and composition inspired by the reference image.`
      : prompt;

    try {
      const result = await generateImage(token, fullPrompt, model);
      setDisplayImage(result);
      setIsGenerating(false);
    } catch (err) {
      if (err.type === 'MODEL_LOADING') {
        const waitSec = err.waitSec ?? 25;
        setGeneratingMsg(`Model warming up — retrying in ${waitSec}s…`);
        retryTimer.current = setTimeout(() => {
          handleGenerate(prompt, inputImage, model, true);
        }, waitSec * 1000);
        return;
      }

      if (err.type === 'RATE_LIMIT') {
        setRateLimitResetAt(err.resetAt);
        setError(`Free quota reached. Generations resume in ${formatTime(err.waitMs)}.`);
      } else if (err.type === 'NO_TOKEN') {
        setError('Enter your free Hugging Face token in the top bar to start generating.');
      } else if (err.type === 'AUTH') {
        setError('Invalid token. Please check your Hugging Face API token.');
      } else if (err.type === 'ACCESS_DENIED' || err.type === 'CORS_OR_NETWORK') {
        if (err.gated) {
          setError(
            `Access denied — this model requires accepting its license. ` +
            `Visit huggingface.co/${err.hfModel} → click "Agree and access", then retry. ` +
            `Or switch to SDXL or SD 1.5 which have no gate.`
          );
        } else {
          setError('Request blocked. Check your Hugging Face token has Read access, then try again.');
        }
      } else {
        setError(err.message ?? 'Generation failed. Please try again.');
      }
      setIsGenerating(false);
    }
  }, [token]);

  // Cleanup pending retry on unmount
  useEffect(() => () => clearTimeout(retryTimer.current), []);

  /* ── Erase ───────────────────────────────────────────────────── */
  const handleApplyErase = () => canvasRef.current?.applyErase();
  const handleClearMask = () => { canvasRef.current?.clearMask(); setHasMask(false); };
  const handleEraseApplied = (url) => { setDisplayImage(url); setHasMask(false); setIsEraserActive(false); };
  const handleToggleEraser = () => {
    setIsEraserActive((v) => { if (v) handleClearMask(); return !v; });
  };

  /* ── Download ────────────────────────────────────────────────── */
  const handleDownload = (format) => canvasRef.current?.download(format);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#08080e' }}>
      <Header token={token} onTokenChange={setToken} />

      {/* Rate limit banner */}
      {isRateLimited && !isGenerating && (
        <div className="flex items-center justify-center gap-2 px-6 py-2 text-xs shrink-0"
          style={{ background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
          <span className="text-red-400">Free generation limit reached.</span>
          <span className="text-red-300/60">
            New generations available in&nbsp;
            <span className="font-bold tabular-nums text-red-300">{countdown}</span>
          </span>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <PromptPanel
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isRateLimited={isRateLimited}
          uploadedImage={uploadedImage}
          onImageUpload={setUploadedImage}
          generatingMsg={generatingMsg}
        />

        <ImageCanvas
          ref={canvasRef}
          displayImage={displayImage}
          isGenerating={isGenerating}
          generatingMsg={generatingMsg}
          error={error}
          watermark={watermark}
          showWatermark={showWatermark}
          wmPosition={wmPosition}
          wmOpacity={wmOpacity}
          wmSize={wmSize}
          isEraserActive={isEraserActive}
          eraserSize={eraserSize}
          onEraseApplied={handleEraseApplied}
        />

        <ToolsPanel
          hasImage={!!displayImage}
          showWatermark={showWatermark}
          onToggleWatermark={() => setShowWatermark((v) => !v)}
          watermark={watermark}
          onWatermarkSelect={setWatermark}
          wmPosition={wmPosition}
          onPositionChange={setWmPosition}
          wmOpacity={wmOpacity}
          onOpacityChange={setWmOpacity}
          wmSize={wmSize}
          onSizeChange={setWmSize}
          isEraserActive={isEraserActive}
          onToggleEraser={handleToggleEraser}
          eraserSize={eraserSize}
          onEraserSizeChange={setEraserSize}
          hasMask={hasMask || !!canvasRef.current?.hasMask?.()}
          onApplyErase={handleApplyErase}
          onClearMask={handleClearMask}
          onDownload={handleDownload}
        />
      </main>
    </div>
  );
}
