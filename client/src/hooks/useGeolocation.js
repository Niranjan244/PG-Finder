import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setError(null);
    setErrorCode(null);
  }, []);

  const getCurrentLocation = useCallback(() => {
    setError(null);
    setErrorCode(null);

    // 1. Check if browser supports Geolocation
    if (!navigator || !navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser.';
      setError(msg);
      setErrorCode('NOT_SUPPORTED');
      return Promise.reject(new Error(msg));
    }

    // 2. Check for Secure Context (HTTPS or localhost)
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      const msg =
        'Browser location requires a secure connection (HTTPS or localhost). Please search by typing an area name.';
      setError(msg);
      setErrorCode('INSECURE_CONTEXT');
      return Promise.reject(new Error(msg));
    }

    setIsLocating(true);

    return new Promise((resolve, reject) => {
      const tryGetPosition = (highAccuracy = true) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setIsLocating(false);
            const accuracy = Math.round(position.coords.accuracy);
            const coords = {
              lat: Number(position.coords.latitude.toFixed(6)),
              lng: Number(position.coords.longitude.toFixed(6)),
              accuracy,
              isApproximate: accuracy > 2500, // Coarse IP or ISP gateway estimate
            };
            setCoordinates(coords);
            setError(null);
            setErrorCode(null);
            resolve(coords);
          },
          (err) => {
            if (highAccuracy && err.code === 3) {
              // High accuracy timed out, retry with standard network/IP geolocation
              tryGetPosition(false);
              return;
            }

            setIsLocating(false);
            let friendlyMessage = 'Unable to determine your location.';
            let codeName = 'UNKNOWN';

            switch (err.code) {
              case 1: // PERMISSION_DENIED
                friendlyMessage =
                  'Location access was denied. Please allow location permissions in your browser bar, or enter your area name below.';
                codeName = 'PERMISSION_DENIED';
                break;
              case 2: // POSITION_UNAVAILABLE
                friendlyMessage =
                  'Location information is unavailable. Check your device GPS or network connection, or search by area.';
                codeName = 'POSITION_UNAVAILABLE';
                break;
              case 3: // TIMEOUT
                friendlyMessage =
                  'Location request timed out. Please click retry or type your location below.';
                codeName = 'TIMEOUT';
                break;
              default:
                friendlyMessage = err.message || 'An unexpected error occurred while locating you.';
            }

            setError(friendlyMessage);
            setErrorCode(codeName);
            reject(new Error(friendlyMessage));
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 15000 : 10000,
            maximumAge: 0,
          }
        );
      };

      tryGetPosition(true);
    });
  }, []);

  return {
    coordinates,
    isLocating,
    error,
    errorCode,
    getCurrentLocation,
    clearLocation,
  };
};

export default useGeolocation;
