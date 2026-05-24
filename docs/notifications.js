// ============================================
// PUSH NOTIFICATIONS MODULE
// Handles device registration and notification preferences
// ============================================

// Supabase configuration
const SUPABASE_URL = 'https://gybvghnldmgvkhtukpil.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-psTImQd8K3JdPWPcpnXHQ_PxGGbW-1';

// Firebase configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDYUm2M3I1hkWxaAjeJYkaID9FH_sVNO4U",
  authDomain: "keepers-report.firebaseapp.com",
  projectId: "keepers-report",
  storageBucket: "keepers-report.firebasestorage.app",
  messagingSenderId: "878621210730",
  appId: "1:878621210730:web:154390c9168dc3a9f8f213"
};

// Firebase VAPID key for web push
const VAPID_KEY = 'BEWkA-vZcTGqyTxa1aRymidJFwG-L5kJIkeEFvk9tzXaUrAZ6b5l2jSNYQfqdW89i2By4BM6U6uk78Oq6nXg6kA';

// Initialize Supabase client
let supabase = null;
let firebaseApp = null;
let messaging = null;

function initSupabase() {
  if (supabase) return supabase;

  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
}

// Initialize Firebase
function initFirebase() {
  if (firebaseApp) return firebaseApp;

  if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    messaging = firebase.messaging();
  }
  return firebaseApp;
}

// ============================================
// DEVICE REGISTRATION
// ============================================

// Get or create device ID (stored locally)
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// Register device with push token
async function registerDevice(pushToken, platform = 'web') {
  const sb = initSupabase();
  if (!sb) {
    console.error('Supabase not initialized');
    return null;
  }

  try {
    const { data, error } = await sb
      .from('devices')
      .upsert({
        push_token: pushToken,
        platform: platform,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'push_token'
      })
      .select()
      .single();

    if (error) throw error;

    // Store device ID locally
    localStorage.setItem('supabaseDeviceId', data.id);
    console.log('Device registered:', data.id);
    return data;
  } catch (e) {
    console.error('Failed to register device:', e);
    return null;
  }
}

// Update last seen timestamp
async function updateLastSeen() {
  const sb = initSupabase();
  const deviceId = localStorage.getItem('supabaseDeviceId');
  if (!sb || !deviceId) return;

  try {
    await sb
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', deviceId);
  } catch (e) {
    console.warn('Failed to update last seen:', e);
  }
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// Save notification preferences for a location
async function saveNotificationPrefs(location, prefs = {}) {
  const sb = initSupabase();
  const deviceId = localStorage.getItem('supabaseDeviceId');

  if (!sb || !deviceId) {
    console.error('Device not registered');
    return null;
  }

  const defaultPrefs = {
    notify_good_conditions: true,
    notify_tide_falling: true,
    notify_tide_rising: true,
    quiet_start: null,
    quiet_end: null
  };

  try {
    const { data, error } = await sb
      .from('notification_prefs')
      .upsert({
        device_id: deviceId,
        location_name: location.name,
        lat: location.lat,
        lng: location.lng,
        ...defaultPrefs,
        ...prefs
      }, {
        onConflict: 'device_id,lat,lng'
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Notification prefs saved:', data);
    return data;
  } catch (e) {
    console.error('Failed to save notification prefs:', e);
    return null;
  }
}

// Get notification preferences for current device
async function getNotificationPrefs() {
  const sb = initSupabase();
  const deviceId = localStorage.getItem('supabaseDeviceId');

  if (!sb || !deviceId) return [];

  try {
    const { data, error } = await sb
      .from('notification_prefs')
      .select('*')
      .eq('device_id', deviceId);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Failed to get notification prefs:', e);
    return [];
  }
}

// Delete notification preferences for a location
async function deleteNotificationPrefs(lat, lng) {
  const sb = initSupabase();
  const deviceId = localStorage.getItem('supabaseDeviceId');

  if (!sb || !deviceId) return false;

  try {
    const { error } = await sb
      .from('notification_prefs')
      .delete()
      .eq('device_id', deviceId)
      .eq('lat', lat)
      .eq('lng', lng);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Failed to delete notification prefs:', e);
    return false;
  }
}

// ============================================
// WEB PUSH NOTIFICATIONS (FCM)
// ============================================

// Check if notifications are supported
function notificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Request notification permission and get FCM token
async function requestNotificationPermission() {
  if (!notificationsSupported()) {
    console.warn('Notifications not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  // Get FCM token
  try {
    const token = await getFCMToken();
    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      return true;
    }
  } catch (e) {
    console.error('Failed to get FCM token:', e);
  }

  return permission === 'granted';
}

// Get FCM token
async function getFCMToken() {
  if (!messaging) {
    initFirebase();
  }

  if (!messaging) {
    console.warn('Firebase messaging not available');
    return null;
  }

  try {
    // Register service worker for FCM
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Firebase SW registered:', registration);

    // Get token
    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      // Store token locally
      localStorage.setItem('fcmToken', token);
      return token;
    }
  } catch (e) {
    console.error('Failed to get FCM token:', e);
  }

  return null;
}

// Get stored FCM token
function getStoredFCMToken() {
  return localStorage.getItem('fcmToken');
}

// Get current permission status
function getNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

// Handle foreground messages
function setupForegroundMessaging() {
  if (!messaging) return;

  messaging.onMessage((payload) => {
    console.log('Foreground message received:', payload);

    // Show notification manually for foreground
    if (Notification.permission === 'granted') {
      const title = payload.notification?.title || 'Keepers Report';
      const options = {
        body: payload.notification?.body || 'New update available',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        data: payload.data
      };

      new Notification(title, options);
    }
  });
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize notifications system
async function initNotifications() {
  initSupabase();
  initFirebase();

  // Update last seen on load
  updateLastSeen();

  // Check if already registered
  const deviceId = localStorage.getItem('supabaseDeviceId');
  if (deviceId) {
    console.log('Device already registered:', deviceId);
  }

  // Set up foreground message handling
  setupForegroundMessaging();

  // If we have permission, make sure we have a token
  if (Notification.permission === 'granted') {
    const token = getStoredFCMToken();
    if (!token) {
      getFCMToken();
    }
  }
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initNotifications);
