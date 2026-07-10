import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyD1ni9qqpTyHgW-U_jxAgdqKm6CgXPEo2g',
  authDomain: 'aizawlbiblecollege.firebaseapp.com',
  projectId: 'aizawlbiblecollege',
  storageBucket: 'aizawlbiblecollege.firebasestorage.app',
  messagingSenderId: '115286874000',
  appId: '1:115286874000:web:ffc1c6b927bb86495ac515',
  measurementId: 'G-KK313VH8BX',
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;


async function ensureMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase messaging is not supported in this browser');
    return null;
  }

  if (!app) app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);

  try {
    getAnalytics(app);
  } catch {
    // Analytics requires a supported environment; silently skip if unavailable
  }

  return messaging;
}

export async function getPushToken(vapidKey: string): Promise<{ token: string | null; error?: string }> {
  const m = await ensureMessaging();
  if (!m) {
    return { token: null, error: 'Messaging not supported in this browser' };
  }

  // Check if service worker is supported and accessible (not blocked by iframe sandbox)
  if ('serviceWorker' in navigator) {
    try {
      // Check if we're in a cross-origin iframe (e.g. Bolt.new preview)
      if (window.self !== window.top) {
        try {
          // This will throw in cross-origin iframes
          void window.top!.location.origin;
        } catch {
          return {
            token: null,
            error: 'Push notifications require a secure origin. They work on the live website but not in this preview environment.',
          };
        }
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        // Wait for the service worker to be activated
        await navigator.serviceWorker.ready;
      }
    } catch (swError: any) {
      console.error('Service worker registration failed:', swError);
      // If it's a security/origin error, give a helpful message
      if (swError?.name === 'SecurityError' || swError?.message?.includes('origin')) {
        return { token: null, error: 'Push notifications require a secure origin (HTTPS). They work on the live website.' };
      }
      return { token: null, error: 'Service worker registration failed. Push notifications will work on the live website.' };
    }
  } else {
    return { token: null, error: 'Service workers are not supported in this browser.' };
  }

  // Request permission
  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch (permError) {
    console.error('Permission request failed:', permError);
    return { token: null, error: 'Permission request failed' };
  }

  if (permission !== 'granted') {
    return { token: null, error: 'Notification permission denied. Please allow notifications in your browser settings.' };
  }

  try {
    const token = await getToken(m, { vapidKey, serviceWorkerRegistration: await navigator.serviceWorker.ready });
    if (!token) {
      return { token: null, error: 'Failed to get push token. Please try again.' };
    }
    return { token };
  } catch (tokenError: any) {
    console.error('getToken error:', tokenError);
    return { token: null, error: tokenError.message || 'Failed to get push token' };
  }
}

export async function onPushMessage(callback: (payload: any) => void): Promise<void> {
  const m = await ensureMessaging();
  if (!m) return;
  onMessage(m, callback);
}

export async function isPushSupported(): Promise<boolean> {
  const supported = await isSupported();
  return supported && 'serviceWorker' in navigator && 'PushManager' in window;
}
