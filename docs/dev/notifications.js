// ============================================
// PUSH NOTIFICATIONS MODULE
// Handles device registration and notification preferences
// ============================================

// Supabase configuration
const SUPABASE_URL = 'https://gybvghnldmgvkhtukpil.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-psTImQd8K3JdPWPcpnXHQ_PxGGbW-1';

// Initialize Supabase client
let supabase = null;

function initSupabase() {
  if (supabase) return supabase;

  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
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
// WEB PUSH NOTIFICATIONS
// ============================================

// Check if notifications are supported
function notificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Request notification permission
async function requestNotificationPermission() {
  if (!notificationsSupported()) {
    console.warn('Notifications not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Get current permission status
function getNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize notifications system
async function initNotifications() {
  initSupabase();

  // Update last seen on load
  updateLastSeen();

  // Check if already registered
  const deviceId = localStorage.getItem('supabaseDeviceId');
  if (deviceId) {
    console.log('Device already registered:', deviceId);
  }
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initNotifications);
