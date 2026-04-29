/**
 * Inpainting via wavefront propagation.
 * Fills masked pixels outward from unmasked boundary, then a distance-weighted
 * pass fills any remaining interior pixels.
 *
 * @param {ImageData} imageData  – source pixels
 * @param {Uint8Array} mask      – 1 = erase, 0 = keep  (length = width * height)
 * @returns {ImageData}
 */
export function applyMagicErase(imageData, mask) {
  const { width, height, data } = imageData;
  const result = new Uint8ClampedArray(data);
  const remaining = new Uint8Array(mask); // copy

  // ── Pass 1: wavefront fill (boundary → interior) ──────────────────────
  let changed = true;
  let pass = 0;
  const MAX_PASSES = Math.max(width, height);

  while (changed && pass < MAX_PASSES) {
    changed = false;
    pass++;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (!remaining[i]) continue;

        let r = 0, g = 0, b = 0, count = 0;
        // 4-connected + diagonals
        const neighbors = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
          [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const ni = ny * width + nx;
          if (remaining[ni]) continue;
          const pi = ni * 4;
          r += result[pi]; g += result[pi + 1]; b += result[pi + 2];
          count++;
        }

        if (count > 0) {
          const pi = i * 4;
          result[pi] = r / count;
          result[pi + 1] = g / count;
          result[pi + 2] = b / count;
          result[pi + 3] = 255;
          remaining[i] = 0;
          changed = true;
        }
      }
    }
  }

  // ── Pass 2: distance-weighted fill for any unreachable pixels ─────────
  const RADIUS = 30;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!remaining[y * width + x]) continue;

      let r = 0, g = 0, b = 0, w = 0;
      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (remaining[ny * width + nx]) continue;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > RADIUS) continue;
          const weight = 1 / (d + 0.5);
          const pi = (ny * width + nx) * 4;
          r += result[pi] * weight;
          g += result[pi + 1] * weight;
          b += result[pi + 2] * weight;
          w += weight;
        }
      }
      if (w > 0) {
        const pi = (y * width + x) * 4;
        result[pi] = r / w;
        result[pi + 1] = g / w;
        result[pi + 2] = b / w;
        result[pi + 3] = 255;
      }
    }
  }

  return new ImageData(result, width, height);
}

/** Build a boolean mask from an overlay canvas (painted red strokes). */
export function buildMaskFromOverlay(overlayCtx, width, height) {
  const overlayData = overlayCtx.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = overlayData[i * 4 + 3] > 30 ? 1 : 0;
  }
  return mask;
}
