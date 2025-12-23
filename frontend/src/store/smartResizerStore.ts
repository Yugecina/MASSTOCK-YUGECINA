/**
 * Smart Resizer Store
 *
 * Zustand store for managing Smart Resizer state
 */

import { create } from 'zustand';

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  customFormats?: string[]; // Override global formats for this image
}

export interface GeneratedResult {
  id: string;
  formatName: string;
  platform: string;
  width: number;
  height: number;
  resultUrl: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface JobProgress {
  jobId: string;
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  results: GeneratedResult[];
}

interface SmartResizerState {
  // Step tracking
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Image upload
  uploadedImages: UploadedImage[];
  addImage: (file: File) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setCustomFormats: (imageId: string, formats: string[]) => void;

  // Format selection
  globalFormats: string[];
  setGlobalFormats: (formats: string[]) => void;
  toggleGlobalFormat: (format: string) => void;

  // Generation
  jobs: JobProgress[];
  isGenerating: boolean;
  startGeneration: () => void;
  addJob: (job: JobProgress) => void;
  updateJobProgress: (jobId: string, progress: Partial<JobProgress>) => void;
  completeGeneration: () => void;

  // Results
  selectedResult: GeneratedResult | null;
  setSelectedResult: (result: GeneratedResult | null) => void;

  // Reset
  reset: () => void;
}

export const useSmartResizerStore = create<SmartResizerState>((set, get) => ({
  // Step tracking
  currentStep: 0,
  setCurrentStep: (step) => set({ currentStep: step }),

  // Image upload
  uploadedImages: [],
  addImage: (file) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const preview = URL.createObjectURL(file);

    set((state) => ({
      uploadedImages: [
        ...state.uploadedImages,
        { id, file, preview }
      ]
    }));
  },
  removeImage: (id) => {
    const image = get().uploadedImages.find(img => img.id === id);
    if (image) {
      URL.revokeObjectURL(image.preview);
    }

    set((state) => ({
      uploadedImages: state.uploadedImages.filter(img => img.id !== id)
    }));
  },
  clearImages: () => {
    // Revoke all object URLs
    get().uploadedImages.forEach(img => {
      URL.revokeObjectURL(img.preview);
    });

    set({ uploadedImages: [] });
  },
  setCustomFormats: (imageId, formats) => {
    set((state) => ({
      uploadedImages: state.uploadedImages.map(img =>
        img.id === imageId ? { ...img, customFormats: formats } : img
      )
    }));
  },

  // Format selection
  globalFormats: [],
  setGlobalFormats: (formats) => set({ globalFormats: formats }),
  toggleGlobalFormat: (format) => {
    set((state) => {
      const exists = state.globalFormats.includes(format);
      return {
        globalFormats: exists
          ? state.globalFormats.filter(f => f !== format)
          : [...state.globalFormats, format]
      };
    });
  },

  // Generation
  jobs: [],
  isGenerating: false,
  startGeneration: () => set({ isGenerating: true }),
  addJob: (job) => {
    set((state) => ({
      jobs: [...state.jobs, job]
    }));
  },
  updateJobProgress: (jobId, progress) => {
    set((state) => ({
      jobs: state.jobs.map(job =>
        job.jobId === jobId ? { ...job, ...progress } : job
      )
    }));
  },
  completeGeneration: () => set({ isGenerating: false }),

  // Results
  selectedResult: null,
  setSelectedResult: (result) => set({ selectedResult: result }),

  // Reset
  reset: () => {
    // Cleanup object URLs
    get().uploadedImages.forEach(img => {
      URL.revokeObjectURL(img.preview);
    });

    set({
      currentStep: 0,
      uploadedImages: [],
      globalFormats: [],
      jobs: [],
      isGenerating: false,
      selectedResult: null,
    });
  },
}));
