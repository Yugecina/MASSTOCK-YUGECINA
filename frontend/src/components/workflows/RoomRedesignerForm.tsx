/**
 * Room Redesigner Form Component
 * AI-powered interior design virtual staging
 * v3: 9 styles + 4 budgets + 5 seasons with illustrative SVG icons
 */

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import logger from '@/utils/logger';
import './RoomRedesignerForm.css';

// Import all 18 illustrative SVG icons
import {
  ModernIcon,
  MinimalistIcon,
  IndustrialIcon,
  ScandinavianIcon,
  ContemporaryIcon,
  CoastalIcon,
  FarmhouseIcon,
  MidCenturyIcon,
  TraditionalIcon,
  BudgetIcon,
  StandardIcon,
  PremiumIcon,
  LuxuryIcon,
  SpringIcon,
  SummerIcon,
  AutumnIcon,
  WinterIcon,
  NoelIcon
} from '../icons/RoomStyleIcons';

// Design styles (must match backend) - 9 styles with illustrative icons
const DESIGN_STYLES = [
  { value: 'modern', label: 'Modern', desc: 'Clean lines, minimalist approach', icon: ModernIcon },
  { value: 'minimalist', label: 'Minimalist', desc: 'Simplicity and functionality', icon: MinimalistIcon },
  { value: 'industrial', label: 'Industrial', desc: 'Raw materials, exposed elements', icon: IndustrialIcon },
  { value: 'scandinavian', label: 'Scandinavian', desc: 'Light, natural, cozy', icon: ScandinavianIcon },
  { value: 'contemporary', label: 'Contemporary', desc: 'Current trends, sophisticated', icon: ContemporaryIcon },
  { value: 'coastal', label: 'Coastal', desc: 'Beach-inspired, airy', icon: CoastalIcon },
  { value: 'farmhouse', label: 'Farmhouse', desc: 'Rustic charm, warm', icon: FarmhouseIcon },
  { value: 'midcentury', label: 'Mid-Century', desc: '1950s-60s retro style', icon: MidCenturyIcon },
  { value: 'traditional', label: 'Traditional', desc: 'Classic elegance', icon: TraditionalIcon }
] as const;

// Budget levels with illustrative icons
const BUDGET_LEVELS = [
  { value: 'low', label: 'Budget', desc: 'Affordable furniture', icon: BudgetIcon },
  { value: 'medium', label: 'Standard', desc: 'Mid-range quality', icon: StandardIcon },
  { value: 'high', label: 'Premium', desc: 'High-end pieces', icon: PremiumIcon },
  { value: 'luxury', label: 'Luxury', desc: 'Designer furniture', icon: LuxuryIcon }
] as const;

// Seasons with illustrative icons (NEW)
const SEASONS = [
  { value: 'spring', label: 'Printemps', desc: 'Décor frais et fleuri', icon: SpringIcon },
  { value: 'summer', label: 'Été', desc: 'Ambiance lumineuse', icon: SummerIcon },
  { value: 'autumn', label: 'Automne', desc: 'Tons chauds et cosy', icon: AutumnIcon },
  { value: 'winter', label: 'Hiver', desc: 'Style élégant et froid', icon: WinterIcon },
  { value: 'noel', label: 'Noël', desc: 'Décor festif', icon: NoelIcon }
] as const;

type DesignStyle = typeof DESIGN_STYLES[number]['value'];
type BudgetLevel = typeof BUDGET_LEVELS[number]['value'];
type SeasonType = typeof SEASONS[number]['value'];

/**
 * Helper function: Convert base64 data to File object
 * Handles both object format {data, mimeType} and string format
 */
function base64ToFile(base64Data: any, filename: string): File | null {
  try {
    let base64String: string;
    let mimeType: string;

    console.log('🔧 base64ToFile: Starting conversion', {
      filename,
      dataType: typeof base64Data,
      isObject: typeof base64Data === 'object',
      isString: typeof base64Data === 'string'
    });

    if (typeof base64Data === 'object' && base64Data !== null) {
      base64String = base64Data.data || base64Data.image_base64 || '';
      mimeType = base64Data.mimeType || base64Data.image_mime || 'image/jpeg';
      console.log('🔧 base64ToFile: Object format detected', {
        hasData: !!base64Data.data,
        hasImageBase64: !!base64Data.image_base64,
        mimeType,
        base64Length: base64String.length
      });
    } else if (typeof base64Data === 'string') {
      base64String = base64Data;
      mimeType = 'image/jpeg';
      console.log('🔧 base64ToFile: String format detected', {
        base64Length: base64String.length
      });
    } else {
      console.error('❌ base64ToFile: Unknown data format', { dataType: typeof base64Data });
      return null;
    }

    if (!base64String) {
      console.error('❌ base64ToFile: Empty base64 string');
      return null;
    }

    // Remove data URL prefix if present
    const base64Content = base64String.includes(',')
      ? base64String.split(',')[1]
      : base64String;

    console.log('🔧 base64ToFile: Decoding base64', {
      originalLength: base64String.length,
      cleanedLength: base64Content.length,
      hadDataUrlPrefix: base64String.includes(',')
    });

    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const file = new File([blob], filename, { type: mimeType });
    console.log('✅ base64ToFile: File created successfully', {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    return file;
  } catch (error) {
    console.error('❌ base64ToFile: Conversion failed', { error, filename });
    return null;
  }
}

interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: number;
}

interface RoomRedesignerFormData {
  room_images: File[];
  design_style: DesignStyle;
  budget_level: BudgetLevel;
  season: SeasonType | null;
  api_key: string;
}

interface RoomRedesignerPrefillData {
  design_style?: DesignStyle;
  budget_level?: BudgetLevel;
  season?: SeasonType | null;
  room_images_base64?: any;
}

interface RoomRedesignerFormProps {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
  initialData?: RoomRedesignerPrefillData | null;
}

export function RoomRedesignerForm({ onSubmit, loading, initialData }: RoomRedesignerFormProps): JSX.Element {
  const [formData, setFormData] = useState<RoomRedesignerFormData>({
    room_images: [],
    design_style: 'modern',
    budget_level: 'medium',
    season: null,
    api_key: import.meta.env.VITE_DEFAULT_GEMINI_API_KEY || ''
  });

  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from prefill data (Run Again feature)
  useEffect(() => {
    if (!initialData) {
      console.log('🔍 RoomRedesignerForm: No initialData provided');
      return;
    }

    console.log('🔄 RoomRedesignerForm: Initializing from prefill data', {
      design_style: initialData.design_style,
      budget_level: initialData.budget_level,
      season: initialData.season,
      hasRoomImages: !!initialData.room_images_base64,
      roomImagesType: initialData.room_images_base64 ? typeof initialData.room_images_base64 : 'undefined',
      roomImagesIsArray: Array.isArray(initialData.room_images_base64)
    });

    // Set form parameters
    setFormData(prev => {
      const newData = {
        ...prev,
        design_style: initialData.design_style || prev.design_style,
        budget_level: initialData.budget_level || prev.budget_level,
        season: initialData.season ?? prev.season
      };
      console.log('📝 RoomRedesignerForm: Form data updated', {
        design_style: newData.design_style,
        budget_level: newData.budget_level,
        season: newData.season
      });
      return newData;
    });

    // Convert base64 images to Files
    if (initialData.room_images_base64) {
      const images = initialData.room_images_base64;
      const imageArray = Array.isArray(images) ? images : Object.values(images);

      console.log('🖼️ RoomRedesignerForm: Processing room images', {
        imageCount: imageArray.length,
        firstImageKeys: imageArray[0] ? Object.keys(imageArray[0]) : []
      });

      const convertedFiles: File[] = [];
      const newPreviews: string[] = [];

      imageArray.forEach((imgData: any, index: number) => {
        console.log(`🔄 RoomRedesignerForm: Converting image ${index + 1}`, {
          hasImageBase64: !!imgData.image_base64,
          hasData: !!imgData.data,
          imageMime: imgData.image_mime || imgData.mimeType,
          imageName: imgData.image_name
        });

        const filename = imgData.image_name || `room_${index + 1}.jpg`;
        const file = base64ToFile(imgData, filename);

        if (file) {
          console.log(`✅ RoomRedesignerForm: Image ${index + 1} converted`, {
            filename: file.name,
            size: file.size,
            type: file.type
          });
          convertedFiles.push(file);
          // Create preview URL
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            console.log(`📸 RoomRedesignerForm: Preview ${newPreviews.length}/${convertedFiles.length} created`);
            if (newPreviews.length === convertedFiles.length) {
              setImagePreviews(newPreviews.map((url, idx) => ({
                file: convertedFiles[idx],
                url,
                name: convertedFiles[idx].name,
                size: convertedFiles[idx].size
              })));
              console.log('✅ RoomRedesignerForm: All image previews set');
            }
          };
          reader.readAsDataURL(file);
        } else {
          console.error(`❌ RoomRedesignerForm: Failed to convert image ${index + 1}`, imgData);
        }
      });

      if (convertedFiles.length > 0) {
        setFormData(prev => ({ ...prev, room_images: convertedFiles }));
        console.log('✅ RoomRedesignerForm: Restored', convertedFiles.length, 'images to form data');
      } else {
        console.warn('⚠️ RoomRedesignerForm: No images were successfully converted');
      }
    } else {
      console.log('ℹ️ RoomRedesignerForm: No room images to restore');
    }
  }, [initialData]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    const currentCount = formData.room_images.length;
    const totalCount = currentCount + files.length;

    // Limit: 50 images max
    if (totalCount > 50) {
      setError(`Maximum 50 room images allowed (currently ${currentCount})`);
      e.target.value = '';
      return;
    }

    // Validate file size (10MB max per file)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError('Some files exceed 10MB limit');
      e.target.value = '';
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setError('Only JPG, PNG, and WebP images are allowed');
      e.target.value = '';
      return;
    }

    // Create preview URLs for new images
    const newPreviews: ImagePreview[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setError(null);
    setFormData(prev => ({
      ...prev,
      room_images: [...prev.room_images, ...files]
    }));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';

    logger.debug('✅ RoomRedesignerForm: Images added', {
      count: files.length,
      totalCount: totalCount
    });
  };

  const removeImage = (index: number): void => {
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index].url);

    setFormData(prev => ({
      ...prev,
      room_images: prev.room_images.filter((_, i) => i !== index)
    }));

    setImagePreviews(prev => prev.filter((_, i) => i !== index));

    logger.debug('✅ RoomRedesignerForm: Image removed', { index });
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (formData.room_images.length === 0) {
      setError('Please upload at least one room photo');
      return;
    }

    if (!formData.api_key) {
      setError('API key is required');
      return;
    }

    // Submit directly without confirmation modal
    const submitData = new FormData();

    // Append all room images
    formData.room_images.forEach(file => {
      submitData.append('room_images', file);
    });

    submitData.append('design_style', formData.design_style);
    submitData.append('budget_level', formData.budget_level);

    if (formData.season) {
      submitData.append('season', formData.season);
    }

    submitData.append('api_key', formData.api_key);

    logger.debug('🚀 RoomRedesignerForm: Submitting', {
      design_style: formData.design_style,
      budget_level: formData.budget_level,
      season: formData.season,
      image_count: formData.room_images.length
    });

    onSubmit(submitData);
  };

  const isFormValid = formData.room_images.length > 0 && !!formData.api_key;

  return (
    <form onSubmit={handleFormSubmit} className="rr-form">
        {/* Step 1: Upload Room Photo */}
        <div className="rr-step">
          <div className="rr-step-header">
            <div className="rr-step-badge">01</div>
            <div className="rr-step-title">
              <h3>Room Photo</h3>
              <p>Upload a photo of the room to redesign</p>
            </div>
          </div>

          <div className="rr-upload-zone">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="rr-upload-input"
              id="room-upload"
            />
            <label htmlFor="room-upload" className="rr-upload-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Upload room photos</span>
              <span className="rr-upload-hint">JPG, PNG, WebP • Max 10MB each • Up to 50 images</span>
            </label>
          </div>

          {/* Image Previews Grid */}
          {imagePreviews.length > 0 && (
            <div className="rr-preview-section">
              <div className="rr-preview-header">
                <span className="rr-preview-count">{imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} selected</span>
              </div>
              <div className="rr-preview-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="rr-preview-item">
                    <img src={preview.url} alt={preview.name} className="rr-preview-img" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rr-preview-remove"
                      title="Remove image"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    <div className="rr-preview-info">
                      <span className="rr-preview-name">{preview.name}</span>
                      <span className="rr-preview-size">{(preview.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="rr-error-msg">{error}</div>}
        </div>

        {/* Step 2: Design Style */}
        <div className="rr-step">
          <div className="rr-step-header">
            <div className="rr-step-badge">02</div>
            <div className="rr-step-title">
              <h3>Design Style</h3>
              <p>Choose your preferred interior design style</p>
            </div>
          </div>

          <div className="rr-style-grid">
            {DESIGN_STYLES.map((style) => {
              const IconComponent = style.icon;
              return (
                <label
                  key={style.value}
                  className={`rr-style-card ${formData.design_style === style.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="design_style"
                    value={style.value}
                    checked={formData.design_style === style.value}
                    onChange={(e) => setFormData({ ...formData, design_style: e.target.value as DesignStyle })}
                  />
                  <IconComponent className="rr-card-icon" size={32} />
                  <span className="rr-style-label">{style.label}</span>
                  <span className="rr-style-desc">{style.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Step 3: Budget Level (Optional) */}
        <div className="rr-step">
          <div className="rr-step-header">
            <div className="rr-step-badge">03</div>
            <div className="rr-step-title">
              <h3>Budget Level</h3>
              <p>Optional: Select furniture quality tier</p>
            </div>
          </div>

          <div className="rr-budget-grid">
            {BUDGET_LEVELS.map((budget) => {
              const IconComponent = budget.icon;
              return (
                <label
                  key={budget.value}
                  className={`rr-budget-card ${formData.budget_level === budget.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="budget_level"
                    value={budget.value}
                    checked={formData.budget_level === budget.value}
                    onChange={(e) => setFormData({ ...formData, budget_level: e.target.value as BudgetLevel })}
                  />
                  <IconComponent className="rr-card-icon" size={28} />
                  <span className="rr-budget-label">{budget.label}</span>
                  <span className="rr-budget-desc">{budget.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Step 4: Season Selection (Optional) */}
        <div className="rr-step">
          <div className="rr-step-header">
            <div className="rr-step-badge">04</div>
            <div className="rr-step-title">
              <h3>Season Selection</h3>
              <p>Optional: Choose a seasonal ambiance</p>
            </div>
          </div>

          <div className="rr-season-grid">
            {SEASONS.map((season) => {
              const IconComponent = season.icon;
              const isSelected = formData.season === season.value;
              return (
                <label
                  key={season.value}
                  className={`rr-season-card ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    // Toggle behavior: click again to deselect
                    setFormData({
                      ...formData,
                      season: isSelected ? null : season.value
                    });
                  }}
                >
                  <input
                    type="radio"
                    name="season"
                    value={season.value}
                    checked={isSelected}
                    onChange={() => {}} // Handled by label onClick
                    style={{ display: 'none' }}
                  />
                  <IconComponent className="rr-card-icon" size={28} />
                  <span className="rr-season-label">{season.label}</span>
                  <span className="rr-season-desc">{season.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="rr-submit-section">
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`rr-submit-btn ${isFormValid && !loading ? 'ready' : ''}`}
          >
            {loading ? (
              <>
                <span className="rr-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Redesign Room
              </>
            )}
          </button>

          {!isFormValid && !loading && (
            <p className="rr-submit-hint">
              {formData.room_images.length === 0 ? 'Upload at least one room photo to continue' : 'API key required'}
            </p>
          )}
        </div>
      </form>
  );
}
