import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * True while the device has a usable connection. NetInfo also reports
 * `isInternetReachable`, which is false on a captive portal where the radio is
 * connected but nothing can be reached.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // addEventListener returns its own unsubscribe function.
    return NetInfo.addEventListener((state) => {
      const connected = Boolean(state.isConnected) && state.isInternetReachable !== false;
      setIsOnline(connected);
    });
  }, []);

  return isOnline;
}
