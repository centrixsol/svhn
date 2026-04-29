const encode = (svg) =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

export const WATERMARKS = [
  {
    id: 'spark',
    name: 'Spark',
    dataUrl: encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)" opacity="0.95"/>
      <path d="M32 12 L35.5 27.5 L51 28 L38.5 36.5 L43 52 L32 44 L21 52 L25.5 36.5 L13 28 L28.5 27.5 Z"
        fill="white"/>
    </svg>`),
  },
  {
    id: 'crown',
    name: 'Crown',
    dataUrl: encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)" opacity="0.95"/>
      <path d="M14 42 L18 22 L26 32 L32 16 L38 32 L46 22 L50 42 Z" fill="white"/>
      <rect x="14" y="43" width="36" height="5" rx="2" fill="white"/>
    </svg>`),
  },
  {
    id: 'shield',
    name: 'Shield',
    dataUrl: encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)" opacity="0.95"/>
      <path d="M32 14 L48 20 L48 32 C48 42 32 52 32 52 C32 52 16 42 16 32 L16 20 Z" fill="white"/>
      <path d="M27 32 L30 35 L38 27" stroke="#10b981" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`),
  },
  {
    id: 'diamond',
    name: 'Diamond',
    dataUrl: encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)" opacity="0.95"/>
      <path d="M32 14 L50 28 L32 50 L14 28 Z" fill="white" opacity="0.95"/>
      <path d="M14 28 L32 22 L50 28" stroke="rgba(2,132,199,0.5)" stroke-width="1" fill="none"/>
    </svg>`),
  },
  {
    id: 'eye',
    name: 'Vision',
    dataUrl: encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g)" opacity="0.95"/>
      <path d="M12 32 C18 20 46 20 52 32 C46 44 18 44 12 32 Z" fill="white"/>
      <circle cx="32" cy="32" r="8" fill="#ec4899"/>
      <circle cx="32" cy="32" r="4" fill="white"/>
    </svg>`),
  },
  {
    id: 'svhn',
    name: 'SVHN',
    dataUrl: encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#6366f1"/>
        </linearGradient>
      </defs>
      <rect width="80" height="40" rx="8" fill="url(#g)" opacity="0.9"/>
      <text x="40" y="27" text-anchor="middle" fill="white"
        font-family="Inter,system-ui,sans-serif" font-size="16" font-weight="800"
        letter-spacing="2">SVHN</text>
    </svg>`),
  },
];
