/**
 * Performance utilities for optimizing the application
 */

/**
 * Debounce function to limit how often a function is called
 * Useful for search inputs, scroll handlers, etc.
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to ensure a function is called at most once per specified time period
 * Useful for scroll handlers, resize events, etc.
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Check if the device is a low-end device
 * Based on hardware concurrency (CPU cores) and device memory
 */
export const isLowEndDevice = (): boolean => {
  // Check if device has limited CPU cores
  const hasLimitedCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  
  // Check if device has limited memory (less than 4GB)
  const hasLimitedMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  
  return hasLimitedCPU || hasLimitedMemory;
};

/**
 * Preload an image
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Request idle callback with fallback for browsers that don't support it
 */
export const requestIdleCallback = (callback: () => void, timeout: number = 2000) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return setTimeout(callback, 1);
};
