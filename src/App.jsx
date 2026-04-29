import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import PromptPanel from './components/PromptPanel';
import ImageCanvas from './components/ImageCanvas';
import ToolsPanel from './components/ToolsPanel';
import { generateImage } from './utils/gemini';
import { WATERMARKS } from './utils/watermarks';

export default function App() {
  /* ── Persistence ─────────────────────────────────────────────── */
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('svhn_api_key') || '');
  useEffect(() => { localStorage.setItem('svhn_api_key', apiKey); }, [apiKey]);

  /* ── Image state ─────────────────────────────────────────────── */
  const [displayImage, setDisplayImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

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

  /* ── Generate ────────────────────────────────────────────────── */
  const handleGenerate = async (prompt, inputImage) => {
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key in the top bar.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    setIsEraserActive(false);
    try {
      const result = await generateImage(apiKey, prompt, inputImage);
      setDisplayImage(result);
    } catch (err) {
      setError(err.message ?? 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Erase callbacks ─────────────────────────────────────────── */
  const handleApplyErase = () => {
    canvasRef.current?.applyErase();
  };

  const handleClearMask = () => {
    canvasRef.current?.clearMask();
    setHasMask(false);
  };

  const handleEraseApplied = (newDataUrl) => {
    setDisplayImage(newDataUrl);
    setHasMask(false);
    setIsEraserActive(false);
  };

  /* ── Download ────────────────────────────────────────────────── */
  const handleDownload = (format) => {
    canvasRef.current?.download(format);
  };

  /* ── Toggle eraser (auto-disable when switching panels) ─────── */
  const handleToggleEraser = () => {
    setIsEraserActive((v) => !v);
    if (isEraserActive) handleClearMask();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#08080e' }}>
      <Header apiKey={apiKey} onApiKeyChange={setApiKey} />

      <main className="flex flex-1 overflow-hidden">
        <PromptPanel
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          uploadedImage={uploadedImage}
          onImageUpload={setUploadedImage}
        />

        <ImageCanvas
          ref={canvasRef}
          displayImage={displayImage}
          isGenerating={isGenerating}
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
          hasMask={hasMask || canvasRef.current?.hasMask?.()}
          onApplyErase={handleApplyErase}
          onClearMask={handleClearMask}
          onDownload={handleDownload}
        />
      </main>
    </div>
  );
}
