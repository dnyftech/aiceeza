import { useState, useEffect } from 'react';
import { DeviceCapabilities } from '../types';

export function getDeviceCapabilities(): DeviceCapabilities {
  const isTouch = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;

  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (width < 640) {
    deviceType = 'mobile';
  } else if (width < 1024) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const navAny = typeof navigator !== 'undefined' ? (navigator as any) : {};
  const connection = navAny.connection || navAny.mozConnection || navAny.webkitConnection;

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (navigator as any).standalone === true
  );

  return {
    deviceType,
    viewportWidth: width,
    viewportHeight: height,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    touchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0,
    isTouch,
    isOnline,
    connectionType: connection?.effectiveType || connection?.type || 'wifi/4g',
    downlinkSpeed: connection?.downlink || 10,
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
    deviceMemoryGb: navAny.deviceMemory || 8,
    webAudioSupported: typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window),
    webSpeechSupported: typeof window !== 'undefined' && ('speechSynthesis' in window),
    pwaStandalone: isStandalone,
    platform: typeof navigator !== 'undefined' ? navigator.platform || 'Unknown' : 'Unknown',
  };
}

export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(getDeviceCapabilities);

  useEffect(() => {
    const handleResize = () => {
      setCapabilities(getDeviceCapabilities());
    };

    const handleConnectionChange = () => {
      setCapabilities(getDeviceCapabilities());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    // Optional Battery status check
    const navAny = navigator as any;
    if (navAny && typeof navAny.getBattery === 'function') {
      navAny.getBattery().then((battery: any) => {
        const updateBattery = () => {
          setCapabilities(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            batteryCharging: battery.charging,
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  return capabilities;
}
