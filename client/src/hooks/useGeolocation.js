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

    // 1. Check if browser supports Geolocation API
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

        const coords = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
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
              'Location access was denied. Please allow location permissions in your browser address bar.';
            codeName = 'PERMISSION_DENIED';
            break;
          case 2: // POSITION_UNAVAILABLE
            friendlyMessage =
              'Location information is unavailable. Check your device GPS or network connection.';
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

      // Request highest possible accuracy from device hardware / GPS / Wi-Fi
      try {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const acc = position.coords.accuracy;

            if (!bestPosition || acc < bestPosition.coords.accuracy) {
              bestPosition = position;
            }

            // If hardware GPS locks with high accuracy (<= 50 meters), finish immediately
            if (acc <= 50) {
              finishWithPosition(position);
              return;
            }

            // Settle on the best fix if stable
            if (acc <= 200 && !settleTimer) {
              settleTimer = setTimeout(() => {
                if (bestPosition) {
                  finishWithPosition(bestPosition);
                }
              }, 1000);
            }
          },
          (err) => {
            if (bestPosition) {
              finishWithPosition(bestPosition);
            } else {
              // Fallback to standard single-shot request
              navigator.geolocation.getCurrentPosition(
                (pos) => finishWithPosition(pos),
                (singleErr) => finishWithError(singleErr || err),
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
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

        maxTimeoutTimer = setTimeout(() => {
          if (bestPosition) {
            finishWithPosition(bestPosition);
          } else {
            navigator.geolocation.getCurrentPosition(
              (pos) => finishWithPosition(pos),
              (timeoutErr) => finishWithError(timeoutErr || { code: 3, message: 'Timed out' }),
              { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
            );
          }
        }, 3500);
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
