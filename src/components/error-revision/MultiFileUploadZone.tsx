/**
 * MultiFileUploadZone Component
 * Drag & drop file upload zone for multiple files with HTML5 API
 */

import { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiFileUploadZoneProps {
  value?: File[];
  onChange: (files: File[] | undefined) => void;
  accept: string; // e.g., "image/jpeg,image/png,application/pdf"
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const MultiFileUploadZone = ({
  value = [],
  onChange,
  accept,
  label,
  required = false,
  disabled = false,
  error,
}: MultiFileUploadZoneProps) => {
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

      const droppedFiles = Array.from(e.dataTransfer.files);
      const acceptedTypes = accept.split(',').map((t) => t.trim());

      // Filter files by accepted types
      const validFiles = droppedFiles.filter((file) =>
        acceptedTypes.some((type) => file.type.match(type))
      );

      if (validFiles.length > 0) {
        onChange([...(value || []), ...validFiles]);
      }
    },
    [accept, disabled, onChange, value]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        const newFiles = Array.from(selectedFiles);
        onChange([...(value || []), ...newFiles]);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    },
    [onChange, value]
  );

  const handleRemove = (indexToRemove: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = value?.filter((_, index) => index !== indexToRemove);
    onChange(newFiles && newFiles.length > 0 ? newFiles : undefined);
  };

  const handleClick = () => {
    if (!disabled) {
      document.getElementById(`file-input-${label}`)?.click();
    }
  };

  const totalSize = value?.reduce((acc, file) => acc + file.size, 0) || 0;

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
          !isDragActive && (!value || value.length === 0) && 'border-gray-300 hover:border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          value && value.length > 0 && 'bg-green-50 border-green-300',
          error && 'border-red-300'
        )}
      >
        <input
          id={`file-input-${label}`}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          multiple
          className="hidden"
        />

        {!value || value.length === 0 ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Déposez les fichiers ici'
                : 'Glissez-déposez ou cliquez pour sélectionner des fichiers'}
            </p>
            <p className="text-xs text-gray-500">
              {accept.split(',').map((t) => t.split('/')[1]?.toUpperCase()).join(', ')}
            </p>
            <p className="text-xs text-blue-600 font-medium">
              Vous pouvez ajouter plusieurs fichiers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {value.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <File className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemove(index)}
                  className="p-1 hover:bg-red-100 rounded ml-2 flex-shrink-0"
                  disabled={disabled}
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-green-200">
              <p className="text-xs text-gray-600">
                {value.length} fichier{value.length > 1 ? 's' : ''} sélectionné{value.length > 1 ? 's' : ''}
                {' '}({(totalSize / 1024 / 1024).toFixed(2)} MB au total)
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                disabled={disabled}
              >
                + Ajouter d'autres fichiers
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
