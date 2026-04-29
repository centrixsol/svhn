const HF_API = 'https://api-inference.huggingface.co/models';

const RL_KEY = 'svhn_rate_limit';
const MAX_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

/* ── Available models ───────────────────────────────────────── */
export const MODELS = [
  {
    id: 'sdxl',
    name: 'SDXL',
    label: 'Stable Diffusion XL',
    hfModel: 'stabilityai/stable-diffusion-xl-base-1.0',
    gated: false,
    steps: 20,
  },
  {
    id: 'sd15',
    name: 'SD 1.5',
    label: 'Stable Diffusion 1.5',
    hfModel: 'runwayml/stable-diffusion-v1-5',
    gated: false,
    steps: 20,
  },
  {
    id: 'flux',
    name: 'FLUX',
    label: 'FLUX.1-schnell',
    hfModel: 'black-forest-labs/FLUX.1-schnell',
    gated: true, // requires accepting license at huggingface.co/black-forest-labs/FLUX.1-schnell
    steps: 4,
  },
];

/* ── Rate limit helpers ─────────────────────────────────────── */
function getState() {
  try { return JSON.parse(localStorage.getItem(RL_KEY)) || { requests: [] }; }
  catch { return { requests: [] }; }
}
function saveState(s) { localStorage.setItem(RL_KEY, JSON.stringify(s)); }

export function getRateLimitInfo() {
  const now = Date.now();
  const recent = getState().requests.filter((t) => now - t < HOUR_MS);
  if (recent.length >= MAX_PER_HOUR) {
    const resetAt = recent[0] + HOUR_MS;
    return { limited: true, used: recent.length, max: MAX_PER_HOUR, resetAt, waitMs: Math.max(0, resetAt - now) };
  }
  return { limited: false, used: recent.length, max: MAX_PER_HOUR, resetAt: null, waitMs: 0 };
}

function recordRequest() {
  const now = Date.now();
  const recent = getState().requests.filter((t) => now - t < HOUR_MS);
  saveState({ requests: [...recent, now] });
}

/* ── Image generation ───────────────────────────────────────── */
export async function generateImage(token, prompt, modelId = 'sdxl') {
  if (!token?.trim()) {
    const err = new Error('NO_TOKEN');
    err.type = 'NO_TOKEN';
    throw err;
  }

  const rl = getRateLimitInfo();
  if (rl.limited) {
    const err = new Error('RATE_LIMIT');
    err.type = 'RATE_LIMIT';
    err.resetAt = rl.resetAt;
    err.waitMs = rl.waitMs;
    throw err;
  }

  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  const url = `${HF_API}/${model.hfModel}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: model.steps },
      }),
    });
  } catch {
    /* fetch() throws TypeError on CORS block or network failure */
    const err = new Error('CORS_OR_NETWORK');
    err.type = 'CORS_OR_NETWORK';
    err.gated = model.gated;
    err.hfModel = model.hfModel;
    throw err;
  }

  if (response.status === 503) {
    let waitSec = 25;
    try { const b = await response.json(); waitSec = Math.ceil(b.estimated_time ?? 25); } catch { /* */ }
    const err = new Error('MODEL_LOADING');
    err.type = 'MODEL_LOADING';
    err.waitSec = waitSec;
    throw err;
  }

  if (response.status === 401) {
    const err = new Error('Invalid Hugging Face token. Please check it and try again.');
    err.type = 'AUTH';
    throw err;
  }

  if (response.status === 403) {
    const err = new Error('ACCESS_DENIED');
    err.type = 'ACCESS_DENIED';
    err.gated = model.gated;
    err.hfModel = model.hfModel;
    throw err;
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') || 3600);
    const waitMs = retryAfter > 10000 ? retryAfter - Date.now() : retryAfter * 1000;
    const err = new Error('RATE_LIMIT');
    err.type = 'RATE_LIMIT';
    err.resetAt = Date.now() + waitMs;
    err.waitMs = waitMs;
    throw err;
  }

  if (!response.ok) {
    let msg = `Generation failed (${response.status}). Try again.`;
    try { const b = await response.json(); if (b.error) msg = b.error; } catch { /* */ }
    throw new Error(msg);
  }

  recordRequest();

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
