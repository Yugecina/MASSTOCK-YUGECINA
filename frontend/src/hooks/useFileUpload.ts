import { useState, ChangeEvent } from 'react';

/**
 * Image preview structure
 */
export interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: number;
}

/**
 * Configuration options for useFileUpload hook
 */
export interface UseFileUploadOptions {
  maxFiles: number;                    // Maximum number of files allowed
  maxFileSize?: number;                // Maximum file size in bytes (default: 10MB)
  acceptedTypes?: string[];            // Accepted MIME types (default: all images)
  onError?: (message: string) => void; // Error callback
}

/**
 * Return type for useFileUpload hook
 */
export interface UseFileUploadReturn {
  files: File[];
  previews: ImagePreview[];
  error: string | null;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
}

/**
 * Hook for handling file uploads with validation and previews
 *
 * @param options - Configuration options
 * @returns File management functions and state
 *
 * @example
 * ```ts
 * const { files, previews, error, handleFileChange, removeFile } = useFileUpload({
 *   maxFiles: 14,
 *   maxFileSize: 10 * 1024 * 1024,
 *   acceptedTypes: ['image/jpeg', 'image/png'],
 *   onError: (msg) => console.error(msg)
 * });
 * ```
 */
export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const {
    maxFiles,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onError
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle file input change event
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newFiles = Array.from(e.target.files || []);
    const currentCount = files.length;
    const totalCount = currentCount + newFiles.length;

    // Validate: max files count
    if (totalCount > maxFiles) {
      const errorMsg = `Maximum ${maxFiles} files allowed (currently ${currentCount})`;
      setError(errorMsg);
      onError?.(errorMsg);
      e.target.value = '';
      return;
    }

    // Validate: file size
    const oversizedFiles = newFiles.filter(f => f.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      const errorMsg = `Some files exceed ${Math.round(maxFileSize / 1024 / 1024)}MB limit`;
      setError(errorMsg);
      onError?.(errorMsg);
      e.target.value = '';
      return;
    }

    // Validate: file types (if specified)
    if (acceptedTypes.length > 0) {
      const invalidFiles = newFiles.filter(f => !acceptedTypes.includes(f.type));
      if (invalidFiles.length > 0) {
        const types = acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
        const errorMsg = `Only ${types} files are allowed`;
        setError(errorMsg);
        onError?.(errorMsg);
        e.target.value = '';
        return;
      }
    }

    // Create preview URLs for new files
    const newPreviews: ImagePreview[] = newFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    // Update state
    setError(null);
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);

    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  /**
   * Remove file at specified index
   */
  const removeFile = (index: number): void => {
    // Revoke the object URL to free memory
    if (previews[index]) {
      URL.revokeObjectURL(previews[index].url);
    }

    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Clear all files and previews
   */
  const clearFiles = (): void => {
    // Revoke all object URLs to free memory
    previews.forEach(preview => URL.revokeObjectURL(preview.url));

    setFiles([]);
    setPreviews([]);
    setError(null);
  };

  return {
    files,
    previews,
    error,
    handleFileChange,
    removeFile,
    clearFiles
  };
}
