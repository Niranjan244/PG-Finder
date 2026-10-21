import { useState, useCallback, useRef } from 'react';

export const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const activeWatchIdRef = useRef(null);

  const clearLocation = useCallback(() => {
    if (activeWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(activeWatchIdRef.current);
      activeWatchIdRef.current = null;
    }
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

    // Clean up any pending watch before starting a new one
    if (activeWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(activeWatchIdRef.current);
      activeWatchIdRef.current = null;
    }

    return new Promise((resolve, reject) => {
      let bestPosition = null;
      let hasResolved = false;
      let settleTimer = null;
      let maxTimeoutTimer = null;

      const finishWithPosition = (position) => {
        if (hasResolved) return;
        hasResolved = true;

        if (settleTimer) clearTimeout(settleTimer);
        if (maxTimeoutTimer) clearTimeout(maxTimeoutTimer);

        if (activeWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(activeWatchIdRef.current);
          activeWatchIdRef.current = null;
        }

        setIsLocating(false);

        const accuracy = Math.round(position.coords.accuracy);
        const coords = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy,
          isExact: accuracy <= 200,
          isApproximate: accuracy > 1500, // Coarse IP or ISP gateway estimate
        };

        setCoordinates(coords);
        setError(null);
        setErrorCode(null);
        resolve(coords);
      };

      const finishWithError = (err) => {
        if (hasResolved) return;
        hasResolved = true;

        if (settleTimer) clearTimeout(settleTimer);
        if (maxTimeoutTimer) clearTimeout(maxTimeoutTimer);

        if (activeWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(activeWatchIdRef.current);
          activeWatchIdRef.current = null;
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
      };

      // Watch position to give Wi-Fi scanning / GPS time to settle to highest accuracy
      try {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const acc = position.coords.accuracy;

            // Track reading with the highest accuracy (smallest radius in meters)
            if (!bestPosition || acc < bestPosition.coords.accuracy) {
              bestPosition = position;
            }

            // High-accuracy fix (<= 65 meters, true GPS or Wi-Fi AP triangulation): lock immediately
            if (acc <= 65) {
              finishWithPosition(position);
              return;
            }

            // Moderate fix (<= 300 meters): settle within 1.2 seconds if no finer reading arrives
            if (acc <= 300 && !settleTimer) {
              settleTimer = setTimeout(() => {
                if (bestPosition) {
                  finishWithPosition(bestPosition);
                }
              }, 1200);
            }
          },
          (err) => {
            // If watch threw an error but we already captured a best reading, use it
            if (bestPosition) {
              finishWithPosition(bestPosition);
            } else {
              // Try fallback to standard single-shot getCurrentPosition
              navigator.geolocation.getCurrentPosition(
                (pos) => finishWithPosition(pos),
                (singleErr) => finishWithError(singleErr || err),
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
              );
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );

        activeWatchIdRef.current = watchId;

        // Maximum wait time: 4 seconds to allow Wi-Fi AP scan without hanging the UI
        maxTimeoutTimer = setTimeout(() => {
          if (bestPosition) {
            finishWithPosition(bestPosition);
          } else {
            // Settle with standard single-shot if watch didn't yield any position
            navigator.geolocation.getCurrentPosition(
              (pos) => finishWithPosition(pos),
              (timeoutErr) => finishWithError(timeoutErr || { code: 3, message: 'Timed out' }),
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
            );
          }
        }, 4000);
      } catch (e) {
        finishWithError(e);
      }
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
