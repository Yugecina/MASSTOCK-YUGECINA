import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../../hooks/useFileUpload';
import type { ChangeEvent } from 'react';

describe('useFileUpload hook', () => {
  // Mock URL.createObjectURL and URL.revokeObjectURL
  const mockCreateObjectURL = vi.fn();
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    mockRevokeObjectURL.mockClear();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  const createMockFile = (name: string, size: number, type: string): File => {
    const blob = new Blob(['a'.repeat(size)], { type });
    return new File([blob], name, { type });
  };

  const createMockFileChangeEvent = (files: File[]): ChangeEvent<HTMLInputElement> => {
    const input = document.createElement('input');
    input.type = 'file';

    // Mock FileList
    const fileList: FileList = {
      length: files.length,
      item: (index: number) => files[index] || null,
      ...files
    } as unknown as FileList;

    Object.defineProperty(input, 'files', {
      value: fileList,
      writable: true
    });

    return { target: input } as ChangeEvent<HTMLInputElement>;
  };

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useFileUpload({ maxFiles: 10 }));

      expect(result.current.files).toEqual([]);
      expect(result.current.previews).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('handleFileChange', () => {
    it('should add files successfully', () => {
      const { result } = renderHook(() => useFileUpload({
        maxFiles: 10,
        maxFileSize: 10 * 1024 * 1024
      }));

      const files = [
        createMockFile('image1.jpg', 1024, 'image/jpeg'),
        createMockFile('image2.png', 2048, 'image/png')
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.previews).toHaveLength(2);
      expect(result.current.error).toBeNull();
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
    });

    it('should reject files exceeding max count', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useFileUpload({
        maxFiles: 2,
        onError
      }));

      const files = [
        createMockFile('image1.jpg', 1024, 'image/jpeg'),
        createMockFile('image2.png', 2048, 'image/png'),
        createMockFile('image3.png', 2048, 'image/png')
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.error).toContain('Maximum 2 files allowed');
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Maximum 2 files allowed'));
    });

    it('should reject files exceeding max size', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useFileUpload({
        maxFiles: 10,
        maxFileSize: 1024, // 1KB
        onError
      }));

      const files = [
        createMockFile('large.jpg', 2048, 'image/jpeg') // 2KB > 1KB
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.error).toContain('exceed');
      expect(onError).toHaveBeenCalled();
    });

    it('should reject files with invalid types', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useFileUpload({
        maxFiles: 10,
        acceptedTypes: ['image/jpeg', 'image/png'],
        onError
      }));

      const files = [
        createMockFile('document.pdf', 1024, 'application/pdf')
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.error).toContain('Only');
      expect(onError).toHaveBeenCalled();
    });

    it('should accept files with valid types', () => {
      const { result } = renderHook(() => useFileUpload({
        maxFiles: 10,
        acceptedTypes: ['image/jpeg', 'image/png']
      }));

      const files = [
        createMockFile('image.jpg', 1024, 'image/jpeg')
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should append files to existing files', () => {
      const { result } = renderHook(() => useFileUpload({ maxFiles: 10 }));

      // Add first batch
      const files1 = [createMockFile('image1.jpg', 1024, 'image/jpeg')];
      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files1));
      });

      expect(result.current.files).toHaveLength(1);

      // Add second batch
      const files2 = [createMockFile('image2.jpg', 1024, 'image/jpeg')];
      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files2));
      });

      expect(result.current.files).toHaveLength(2);
    });
  });

  describe('removeFile', () => {
    it('should remove file at specified index', () => {
      const { result } = renderHook(() => useFileUpload({ maxFiles: 10 }));

      const files = [
        createMockFile('image1.jpg', 1024, 'image/jpeg'),
        createMockFile('image2.png', 2048, 'image/png')
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(2);

      act(() => {
        result.current.removeFile(0);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('image2.png');
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('should revoke object URL when removing file', () => {
      const { result } = renderHook(() => useFileUpload({ maxFiles: 10 }));

      const files = [createMockFile('image.jpg', 1024, 'image/jpeg')];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      act(() => {
        result.current.removeFile(0);
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('clearFiles', () => {
    it('should clear all files and previews', () => {
      const { result } = renderHook(() => useFileUpload({ maxFiles: 10 }));

      const files = [
        createMockFile('image1.jpg', 1024, 'image/jpeg'),
        createMockFile('image2.png', 2048, 'image/png')
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(2);

      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.previews).toHaveLength(0);
      expect(result.current.error).toBeNull();
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe('default options', () => {
    it('should use default maxFileSize of 10MB', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useFileUpload({
        maxFiles: 10,
        onError
      }));

      const files = [
        createMockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg') // 11MB
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.error).toContain('10MB');
    });

    it('should accept all image types by default', () => {
      const { result } = renderHook(() => useFileUpload({ maxFiles: 10 }));

      const files = [
        createMockFile('image.webp', 1024, 'image/webp')
      ];

      act(() => {
        result.current.handleFileChange(createMockFileChangeEvent(files));
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });
});
