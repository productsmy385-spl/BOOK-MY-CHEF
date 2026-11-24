/**
 * Optimised delivery URL for an ImageKit image: resized, auto format (WebP/AVIF) and
 * compressed. Non-ImageKit URLs are returned unchanged.
 */
export function ikUrl(url, { w, h, q = 80 } = {}) {
  if (!url || !/^https:\/\/ik\.imagekit\.io\//.test(url)) return url;
  const tr = [w && `w-${w}`, h && `h-${h}`, `q-${q}`, 'f-auto'].filter(Boolean).join(',');
  return `${url}${url.includes('?') ? '&' : '?'}tr=${tr}`;
}

/** srcSet for responsive widths. */
export function ikSrcSet(url, widths = [480, 768, 1200, 1600]) {
  if (!url || !/^https:\/\/ik\.imagekit\.io\//.test(url)) return undefined;
  return widths.map((w) => `${ikUrl(url, { w })} ${w}w`).join(', ');
}
