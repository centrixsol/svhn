const BASE = 'https://image.pollinations.ai/prompt';
const RL_KEY = 'svhn_rate_limit';
const MAX_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

/* ── Rate limit helpers ─────────────────────────────────────── */
function getState() {
  try { return JSON.parse(localStorage.getItem(RL_KEY)) || { requests: [] }; }
  catch { return { requests: [] }; }
}

function saveState(s) {
  localStorage.setItem(RL_KEY, JSON.stringify(s));
}

export function getRateLimitInfo() {
  const now = Date.now();
  const recent = getState().requests.filter((t) => now - t < HOUR_MS);
  if (recent.length >= MAX_PER_HOUR) {
    const resetAt = recent[0] + HOUR_MS;
    const waitMs = Math.max(0, resetAt - now);
    return {
      limited: true,
      used: recent.length,
      max: MAX_PER_HOUR,
      resetAt,
      waitMs,
    };
  }
  return { limited: false, used: recent.length, max: MAX_PER_HOUR, resetAt: null, waitMs: 0 };
}

function recordRequest() {
  const now = Date.now();
  const recent = getState().requests.filter((t) => now - t < HOUR_MS);
  recent.push(now);
  saveState({ requests: recent });
}

/* ── Image generation ───────────────────────────────────────── */
const MODELS = {
  flux: 'flux',
  turbo: 'turbo',
  realism: 'flux-realism',
};

export async function generateImage(prompt, { model = 'flux', width = 1024, height = 1024, seed } = {}) {
  // Client-side gate
  const rl = getRateLimitInfo();
  if (rl.limited) {
    const err = new Error('RATE_LIMIT');
    err.type = 'RATE_LIMIT';
    err.resetAt = rl.resetAt;
    err.waitMs = rl.waitMs;
    throw err;
  }

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model: MODELS[model] ?? model,
    nologo: 'true',
    ...(seed != null && { seed: String(seed) }),
  });

  const url = `${BASE}/${encodeURIComponent(prompt.trim())}?${params}`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    const err = new Error('Network error. Check your internet connection.');
    err.type = 'NETWORK';
    throw err;
  }

  if (response.status === 403) {
    throw new Error('Prompt blocked by content filters. Try rephrasing your prompt.');
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') || 60);
    const err = new Error('RATE_LIMIT');
    err.type = 'RATE_LIMIT';
    err.resetAt = Date.now() + retryAfter * 1000;
    err.waitMs = retryAfter * 1000;
    throw err;
  }

  if (!response.ok) {
    throw new Error(`Generation failed (${response.status}). Please try again.`);
  }

  recordRequest();

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export { MODELS };
