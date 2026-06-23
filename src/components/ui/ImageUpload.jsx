import { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn, fileToBase64 } from '../../lib/utils';

export default function ImageUpload({
  value,
  onChange,
  label,
  className,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) return;

    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch {
      // Silently handle conversion errors
    }

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group w-fit">
          <img
            src={value}
            alt="Upload preview"
            className={cn(
              'max-w-full max-h-48 rounded-lg border border-border',
              'object-contain bg-bg'
            )}
          />
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'absolute -top-2 -right-2',
              'flex items-center justify-center w-6 h-6 rounded-full',
              'bg-error text-white shadow-elevated',
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-150',
              'hover:bg-error/90'
            )}
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'w-full h-32 rounded-lg',
            'border-2 border-dashed border-border',
            'bg-surface hover:bg-surface-hover hover:border-border-light',
            'text-text-dim hover:text-text-secondary',
            'transition-all duration-200 cursor-pointer'
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-active">
            <ImageIcon size={20} />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Upload size={14} />
            <span>Upload Image</span>
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
