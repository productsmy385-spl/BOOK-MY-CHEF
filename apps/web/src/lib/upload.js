import { api } from '../services/api';

/**
 * Uploads a file directly to ImageKit with short-lived parameters signed by our API.
 *
 * With a `purpose` (e.g. PROVIDER_BANNER), the upload goes to that purpose's folder and is
 * then verified and recorded by the server; the result includes the media asset `id`.
 * Without a purpose (legacy link fields: documents, videos), only the URL is returned.
 * Throws an ApiError with status 503 when uploads are not configured.
 */
export async function uploadFile(file, purpose) {
  const auth = await api.media.uploadAuth(purpose);
  if (!auth.allowedTypes.includes(file.type)) {
    throw new Error(purpose ? 'Use a JPEG, PNG or WebP image.' : 'This file type is not supported.');
  }
  if (file.size > auth.maxSizeBytes) throw new Error(`Files must be under ${Math.round(auth.maxSizeBytes / 1024 / 1024)} MB.`);

  const body = new FormData();
  body.append('file', file);
  body.append('fileName', file.name.replace(/[^\w.-]/g, '_'));
  body.append('publicKey', auth.publicKey);
  body.append('signature', auth.signature);
  body.append('expire', String(auth.expire));
  body.append('token', auth.token);
  body.append('folder', auth.folder);
  body.append('useUniqueFileName', 'true');

  const res = await fetch(auth.uploadUrl || 'https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Upload failed. Please try again.');
  if (!auth.register) return { url: json.url, name: file.name, type: file.type };
  return api.media.register(json.fileId, purpose); // { id, url, width, height, ... }
}
