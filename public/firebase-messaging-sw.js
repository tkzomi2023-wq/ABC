/*
 * firebase-messaging-sw.js
 * Combined service worker: PWA caching (app shell) + Firebase Cloud Messaging.
 * Must live at the root scope so it controls the entire site.
 */

// ─── CACHE CONFIG ────────────────────────────────────────────────────────────
const CACHE_VERSION = 'abc-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
];

// Hostnames we should NEVER cache (external APIs, auth, CDNs with their own cache)
const PASSTHROUGH_HOSTS = [
  'supabase.co',
  'googleapis.com',
  'gstatic.com',
  'firebaseio.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'checkout.razorpay.com',
  'pexels.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

function isPassthrough(url) {
  return PASSTHROUGH_HOSTS.some((h) => url.hostname.includes(h));
}

// ─── INSTALL: pre-cache app shell ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: purge stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH: caching strategies ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Let external/API requests go straight to network
  if (isPassthrough(url)) return;

  // Navigation requests (HTML pages) → network-first, fall back to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) → cache-first, update in background
  const dest = event.request.destination;
  if (dest === 'script' || dest === 'style' || dest === 'image' || dest === 'font' || dest === 'manifest') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(event.request, clone));
          }
          return res;
        });
        return cached || networkFetch;
      })
    );
  }
});

// ─── FIREBASE CLOUD MESSAGING ────────────────────────────────────────────────
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD1ni9qqpTyHgW-U_jxAgdqKm6CgXPEo2g',
  authDomain: 'aizawlbiblecollege.firebaseapp.com',
  projectId: 'aizawlbiblecollege',
  storageBucket: 'aizawlbiblecollege.firebasestorage.app',
  messagingSenderId: '115286874000',
  appId: '1:115286874000:web:ffc1c6b927bb86495ac515',
  measurementId: 'G-KK313VH8BX',
});

const messaging = firebase.messaging();

// Deduplication: prevent double-showing the same notification within 30 s
let lastNotificationKey = null;
let lastNotificationTime = 0;
const DEDUP_WINDOW_MS = 30000;

function getNotificationKey(payload) {
  const title = payload.data?.title || payload.notification?.title || '';
  const body = payload.data?.body || payload.notification?.body || '';
  return `${title}||${body}`;
}

function showNotification(payload) {
  const key = getNotificationKey(payload);
  const now = Date.now();
  if (key === lastNotificationKey && now - lastNotificationTime < DEDUP_WINDOW_MS) {
    console.log('[SW] Duplicate notification suppressed:', key);
    return;
  }
  lastNotificationKey = key;
  lastNotificationTime = now;

  const title = payload.data?.title || payload.notification?.title || 'Aizawl Bible College';
  const tag = payload.data?.tag || 'abc-notification';
  self.registration.showNotification(title, {
    body: payload.data?.body || payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag,
    renotify: true,
    data: { click_action: payload.data?.click_action || '/', ...payload.data },
  });
}

// Background FCM messages
messaging.onBackgroundMessage((payload) => {
  showNotification(payload);
});

// Notification click → open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.click_action || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
