import { useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { uploadFile } from '../../lib/upload';
import { Button, cx } from '../ui';

/**
 * Uploads one image to ImageKit for a purpose and returns the verified asset
 * ({ id, url }) through onChange. `ratio` is the preview aspect ratio class.
 */
export default function ImageAssetPicker({ label, hint, purpose, value, onChange, ratio = 'aspect-[21/8]', required }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const asset = await uploadFile(file, purpose);
      onChange({ id: asset.id, url: asset.url });
    } catch (err) {
      setError(err.status === 503 ? 'Image uploads are not set up yet. Ask the administrator to configure ImageKit.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="t-label">{label}{required && <span className="text-danger"> *</span>}</span>
      <div className={cx('relative w-full rounded-md border border-dashed border-line bg-canvas overflow-hidden', ratio)}>
        {value?.url ? (
          <>
            <img src={value.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(null)} aria-label={`Remove ${label}`}
              className="absolute right-2 top-2 w-8 h-8 rounded-full bg-white/95 shadow-card flex items-center justify-center"><X className="w-4 h-4" /></button>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted hover:text-navy">
            <ImagePlus className="w-7 h-7" />
            <span className="t-small">Choose an image</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" icon={Upload} loading={busy} onClick={() => input.current?.click()}>{value?.url ? 'Replace' : 'Upload'}</Button>
        {hint && <span className="t-caption">{hint}</span>}
      </div>
      {error && <p className="t-caption !text-danger">{error}</p>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
    </div>
  );
}
