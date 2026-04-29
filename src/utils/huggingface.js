const MODEL = 'black-forest-labs/FLUX.1-schnell';
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

const RL_KEY = 'svhn_rate_limit';
const MAX_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

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
export async function generateImage(token, prompt, { width = 1024, height = 1024 } = {}) {
  if (!token?.trim()) {
    const err = new Error('NO_TOKEN');
    err.type = 'NO_TOKEN';
    throw err;
  }

  // Client-side gate
  const rl = getRateLimitInfo();
  if (rl.limited) {
    const err = new Error('RATE_LIMIT');
    err.type = 'RATE_LIMIT';
    err.resetAt = rl.resetAt;
    err.waitMs = rl.waitMs;
    throw err;
  }

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { width, height, num_inference_steps: 4 },
      }),
    });
  } catch {
    const err = new Error('Network error. Check your internet connection.');
    err.type = 'NETWORK';
    throw err;
  }

  // Model is warming up — tell the caller how long to wait
  if (response.status === 503) {
    let waitSec = 20;
    try {
      const body = await response.json();
      waitSec = Math.ceil(body.estimated_time ?? 20);
    } catch { /* ignore */ }
    const err = new Error('MODEL_LOADING');
    err.type = 'MODEL_LOADING';
    err.waitSec = waitSec;
    throw err;
  }

  if (response.status === 401) {
    const err = new Error('Invalid API token. Please check your Hugging Face token.');
    err.type = 'AUTH';
    throw err;
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('X-RateLimit-Reset') || response.headers.get('Retry-After') || 3600);
    const waitMs = retryAfter > 10000 ? retryAfter - Date.now() : retryAfter * 1000;
    const err = new Error('RATE_LIMIT');
    err.type = 'RATE_LIMIT';
    err.resetAt = Date.now() + waitMs;
    err.waitMs = waitMs;
    throw err;
  }

  if (!response.ok) {
    let msg = `Generation failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body.error) msg = body.error;
    } catch { /* ignore */ }
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
