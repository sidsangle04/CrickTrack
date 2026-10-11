import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Android hardware back button inside the WebView shell.
// Navigation within the app is left to the router. A back press with nowhere
// left to go inside the app is handed to the native wrapper instead, so the
// shell decides whether to close or to keep CrickTrack open.
const NATIVE_BRIDGES = ['CrickTrackNative', 'AndroidBridge', 'Android', 'ReactNativeWebView'];

function notifyNative(message) {
  for (const name of NATIVE_BRIDGES) {
    const bridge = window[name];
    if (!bridge) continue;
    if (typeof bridge.onBackPressed === 'function') {
      bridge.onBackPressed();
      return true;
    }
    if (typeof bridge.postMessage === 'function') {
      bridge.postMessage(JSON.stringify(message));
      return true;
    }
  }
  return false;
}

export default function WebViewBackHandler() {
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      const goingTo = window.location.pathname;
      // Nothing left to pop inside the app: same page, and it is the landing page.
      const leavingApp = goingTo === pathRef.current && goingTo === '/';
      pathRef.current = goingTo;
      if (!leavingApp) return;

      if (notifyNative({ type: 'back', path: goingTo })) {
        // Hold the shell's page in place so the WebView does not fall through.
        window.history.pushState({ crickTrackGuard: true }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return null;
}