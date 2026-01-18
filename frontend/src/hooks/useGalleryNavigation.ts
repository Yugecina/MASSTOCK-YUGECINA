/**
 * useGalleryNavigation Hook
 * Manages keyboard and button navigation for image galleries
 */

import { useState, useEffect, useCallback, RefObject } from 'react';
import logger from '@/utils/logger';

interface UseGalleryNavigationOptions<T> {
  /** All items in the gallery */
  items: T[];
  /** Filter function to get navigable items (e.g., successful results only) */
  filterFn?: (item: T) => boolean;
  /** Enable keyboard navigation (default: true) */
  enableKeyboard?: boolean;
  /** Refs array for thumbnail scroll-into-view */
  thumbnailRefs?: RefObject<(HTMLElement | null)[]>;
  /** Callback when navigating to a new item */
  onNavigate?: (item: T, index: number) => void;
}

interface UseGalleryNavigationReturn<T> {
  /** Currently selected item */
  selectedItem: T | null;
  /** Index of selected item in the full items array */
  selectedIndex: number;
  /** Navigate to previous item */
  navigateToPrevious: () => void;
  /** Navigate to next item */
  navigateToNext: () => void;
  /** Set selection directly */
  selectItem: (item: T, actualIndex: number) => void;
  /** Number of navigable items */
  navigableCount: number;
  /** Whether navigation arrows should be shown */
  showNavigationArrows: boolean;
}

/**
 * Hook for managing gallery navigation with keyboard support
 */
export function useGalleryNavigation<T>({
  items,
  filterFn = () => true,
  enableKeyboard = true,
  thumbnailRefs,
  onNavigate
}: UseGalleryNavigationOptions<T>): UseGalleryNavigationReturn<T> {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Get filtered navigable items
  const navigableItems = items.filter(filterFn);
  const navigableCount = navigableItems.length;
  const showNavigationArrows = navigableCount > 1;

  // Auto-select first navigable item on mount or items change
  useEffect(() => {
    if (navigableItems.length > 0 && selectedItem === null) {
      const firstNavigable = navigableItems[0];
      const actualIndex = items.indexOf(firstNavigable);
      setSelectedItem(firstNavigable);
      setSelectedIndex(actualIndex);
    }
  }, [items, navigableItems, selectedItem]);

  // Scroll thumbnail into view
  const scrollThumbnailIntoView = useCallback((index: number) => {
    if (thumbnailRefs?.current) {
      setTimeout(() => {
        thumbnailRefs.current?.[index]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }, 100);
    }
  }, [thumbnailRefs]);

  // Navigate to previous item
  const navigateToPrevious = useCallback(() => {
    if (navigableItems.length <= 1 || !selectedItem) return;

    const currentIdx = navigableItems.indexOf(selectedItem);
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : navigableItems.length - 1;
    const prevItem = navigableItems[prevIdx];
    const actualIndex = items.indexOf(prevItem);

    setSelectedItem(prevItem);
    setSelectedIndex(actualIndex);
    scrollThumbnailIntoView(prevIdx);
    onNavigate?.(prevItem, actualIndex);

    logger.debug('useGalleryNavigation: Navigate to previous', {
      prevIdx,
      actualIndex
    });
  }, [navigableItems, selectedItem, items, scrollThumbnailIntoView, onNavigate]);

  // Navigate to next item
  const navigateToNext = useCallback(() => {
    if (navigableItems.length <= 1 || !selectedItem) return;

    const currentIdx = navigableItems.indexOf(selectedItem);
    const nextIdx = currentIdx < navigableItems.length - 1 ? currentIdx + 1 : 0;
    const nextItem = navigableItems[nextIdx];
    const actualIndex = items.indexOf(nextItem);

    setSelectedItem(nextItem);
    setSelectedIndex(actualIndex);
    scrollThumbnailIntoView(nextIdx);
    onNavigate?.(nextItem, actualIndex);

    logger.debug('useGalleryNavigation: Navigate to next', {
      nextIdx,
      actualIndex
    });
  }, [navigableItems, selectedItem, items, scrollThumbnailIntoView, onNavigate]);

  // Select item directly
  const selectItem = useCallback((item: T, actualIndex: number) => {
    setSelectedItem(item);
    setSelectedIndex(actualIndex);
    onNavigate?.(item, actualIndex);

    logger.debug('useGalleryNavigation: Item selected', { actualIndex });
  }, [onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard || navigableItems.length <= 1) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, navigableItems.length, navigateToPrevious, navigateToNext]);

  return {
    selectedItem,
    selectedIndex,
    navigateToPrevious,
    navigateToNext,
    selectItem,
    navigableCount,
    showNavigationArrows
  };
}
