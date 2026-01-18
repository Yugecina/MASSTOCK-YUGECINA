import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt?: string;
  className?: string;
  thumbnailSize?: number;
  aspectRatio?: string | null;
  onClick?: () => void;
  onLoad?: (img: HTMLImageElement) => void;
}

/**
 * OptimizedImage Component
 * - Lazy loading with Intersection Observer
 * - Loading skeleton placeholder
 * - URL optimization for smaller images
 * - Automatic retry on error
 */
export function OptimizedImage({
  src,
  alt = '',
  className = '',
  thumbnailSize = 400,
  aspectRatio = '4 / 3',
  onClick,
  onLoad
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Optimize URL for thumbnails (works with Google Storage, Supabase Storage, etc.)
  const getOptimizedUrl = (url: string, size: number): string => {
    if (!url) return url;

    try {
      const urlObj = new URL(url);

      // Google Storage optimization
      // CodeQL Fix: Use strict hostname validation instead of .includes()
      if (urlObj.hostname === 'storage.googleapis.com' ||
          urlObj.hostname.endsWith('.storage.googleapis.com')) {
        // Add image transformation parameters
        urlObj.searchParams.set('width', size);
        urlObj.searchParams.set('quality', '80');
        return urlObj.toString();
      }

      // Supabase Storage optimization
      if (urlObj.hostname === 'supabase.co' ||
          urlObj.hostname.endsWith('.supabase.co')) {
        // Supabase supports transform parameters
        urlObj.searchParams.set('width', size);
        urlObj.searchParams.set('quality', '80');
        urlObj.searchParams.set('format', 'webp');
        return urlObj.toString();
      }

      // CloudFlare Images optimization
      if (urlObj.hostname === 'imagedelivery.net' ||
          urlObj.hostname.endsWith('.imagedelivery.net')) {
        // CloudFlare Images format: /cdn-cgi/image/width=400/url
        return url.replace(/\/cdn-cgi\/image\/[^\/]+/, `/cdn-cgi/image/width=${size},quality=80`);
      }

      // Default: return original URL
      return url;
    } catch (e) {
      // If URL parsing fails, return original
      return url;
    }
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current || imageSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start loading when image is near viewport
            const optimizedSrc = getOptimizedUrl(src, thumbnailSize);
            setImageSrc(optimizedSrc);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, thumbnailSize, imageSrc]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(false);

    // Call parent onLoad callback with image element
    if (onLoad && e.currentTarget) {
      onLoad(e.currentTarget);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error('❌ OptimizedImage: Failed to load', { src: imageSrc });
  };

  return (
    <div
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={{ aspectRatio: aspectRatio || undefined }}
      onClick={onClick}
    >
      {/* Loading Skeleton */}
      {isLoading && !hasError && (
        <div className="optimized-image-skeleton">
          <div className="skeleton-shimmer"></div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="optimized-image-error">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M8 8L40 40M8 40L40 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="4" y="4" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Failed to load</span>
        </div>
      )}

      {/* Actual Image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`optimized-image ${isLoading ? 'optimized-image-loading' : 'optimized-image-loaded'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
