export const triggerHaptic = (pattern: number | number[] = 18) => {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Graceful fallback for browsers/platforms without haptic hardware
  }
};
