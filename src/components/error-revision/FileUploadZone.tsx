/**
 * FileUploadZone Component
 * Drag & drop file upload zone with HTML5 API
 */

import { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  accept: string; // e.g., "image/jpeg,image/png,application/pdf"
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const FileUploadZone = ({
  value,
  onChange,
  accept,
  label,
  required = false,
  disabled = false,
  error,
}: FileUploadZoneProps) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        // Check if file type is accepted
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        if (acceptedTypes.some((type) => file.type.match(type))) {
          onChange(file);
        }
      }
    },
    [accept, disabled, onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onChange(files[0]);
      }
    },
    [onChange]
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const handleClick = () => {
    if (!disabled) {
      document.getElementById(`file-input-${label}`)?.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          !isDragActive && !value && 'border-gray-300 hover:border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          value && 'bg-green-50 border-green-300',
          error && 'border-red-300'
        )}
      >
        <input
          id={`file-input-${label}`}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        {!value ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Déposez le fichier ici'
                : 'Glissez-déposez ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-gray-500">
              {accept.split(',').map((t) => t.split('/')[1]?.toUpperCase()).join(', ')}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <File className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium truncate">{value.name}</span>
              <span className="text-xs text-gray-500">
                ({(value.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 hover:bg-red-100 rounded"
              disabled={disabled}
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
