# The Keepers Report - Project Memory

## Current State
- Surf & tide forecast app supporting any coastal location worldwide
- Mobile-first PWA (Progressive Web App)
- GitHub Pages serves from `docs/` folder on master branch
- Live at: mattergravity.github.io/TheKeepersReport/

### Tech Stack
| Component | Service |
|-----------|---------|
| Hosting | GitHub Pages |
| Wave/Weather | Open-Meteo Marine API |
| Tide Data | NOAA CO-OPS API (US only) |
| Geocoding | LocationIQ (replaced Nominatim) |
| Coastline Detection | Overpass API (cached) |
| Sun Times | suncalc library (client-side) |
| Database | Supabase |
| Push Notifications | Firebase Cloud Messaging |

### Key Files
- `location.js` - Shared location module (search, favorites, NOAA stations)
- `notifications.js` - Supabase + Firebase FCM integration
- `firebase-messaging-sw.js` - Service worker for background push notifications
- `surf.js` - Surf forecast page logic
- `app.js` - Tide page logic
- `location.css` - Shared location picker styles

## Recently Completed (This Session)

### Multi-Location Support (DONE)
- Location picker modal with map on all pages (menu, surf, tide)
- Search any coastal location via LocationIQ
- Auto-detect beach orientation from Overpass coastline data
- Manual compass fallback when no coastline detected
- Save up to 5 favorite locations in localStorage
- NOAA station auto-assignment for US locations (~70 stations mapped)
- Tide data shows "not available" message for international locations
- Dynamic surf guide based on beach orientation (optimal swell/wind)

### API Replacements for Commercial Use (DONE)
- **Nominatim → LocationIQ**: Commercial-friendly geocoding
  - API Key in location.js: `pk.98266edf545f5e19b300d0c28ee027ab`
  - 5,000 requests/day free tier
- **Sunrise-Sunset.org → suncalc**: Client-side calculation, no API needed
- **Coastline caching**: Stored in localStorage, never re-fetched

### Push Notifications Setup (CLIENT DONE)
- Supabase project created: `keepers-report`
- Database tables created: `devices`, `notification_prefs`
- Firebase project created: `keepers-report`
- FCM configured with VAPID key
- Service worker registered for background notifications
- Frontend gets FCM token and registers with Supabase
- Bell icon on surf page to toggle notifications per location
- **Still needed**: Backend Edge Function to actually send notifications

## Supabase Configuration
- **Project URL**: `https://gybvghnldmgvkhtukpil.supabase.co`
- **Publishable Key**: `sb_publishable_-psTImQd8K3JdPWPcpnXHQ_PxGGbW-1`
- **Tables**: `devices`, `notification_prefs`
- RLS enabled on both tables

## Firebase Configuration
- **Project**: `keepers-report`
- **App ID**: `1:878621210730:web:154390c9168dc3a9f8f213`
- **VAPID Key**: `BEWkA-vZcTGqyTxa1aRymidJFwG-L5kJIkeEFvk9tzXaUrAZ6b5l2jSNYQfqdW89i2By4BM6U6uk78Oq6nXg6kA`
- Config stored in `notifications.js`

## Next: Push Notifications Backend

### What's Done
- User can tap bell icon → saves notification preference to Supabase
- Preferences stored: location, notify_good_conditions, notify_tide_falling, notify_tide_rising
- Firebase project + FCM configured
- FCM tokens obtained from browser and stored in Supabase `devices` table
- Service worker handles background push notifications

### What's Needed
1. **Supabase Edge Function** (condition checker)
   - Runs every 30 min via cron
   - Fetches current conditions from Open-Meteo
   - Fetches tide data from NOAA
   - Checks each user's notification_prefs
   - Triggers push via FCM when conditions match

3. **Notification Logic**
   - Good conditions: When rating is GOOD or EPIC
   - Tide falling: When tide crosses midpoint going down
   - Tide rising: When tide crosses midpoint going up

### Architecture
```
┌─────────────────┐      ┌─────────────────┐
│  Capacitor App  │◄────►│    Supabase     │
│  (iOS/Android)  │      │   - devices     │
└────────┬────────┘      │   - prefs       │
         │               └────────┬────────┘
         │ FCM token              │
         ▼                        │
┌─────────────────┐               │
│  Firebase FCM   │◄──────────────┤
└────────▲────────┘               │
         │                        │
         │ sends push             ▼
         │            ┌───────────────────────┐
         └────────────│  Edge Function (cron) │
                      │  - Check conditions   │
                      │  - Compare to prefs   │
                      │  - Send FCM push      │
                      └───────────────────────┘
```

## App Store Path

### For Mobile Stores
- **PWABuilder**: Quickest path to wrap PWA for stores
- **Capacitor**: If need native features (push notifications)
- Push notifications help with Apple App Store approval

### Store Fees
| Store | Fee |
|-------|-----|
| Google Play | $25 one-time |
| Apple App Store | $99/year |

### For Desktop
- **Electron** or **Tauri** for Win/Mac/Linux distribution

## Cost Projections

### Hobby (Current)
- All services on free tier
- Store fees if publishing: ~$124/year

### Commercial (If Monetized)
| Service | Cost |
|---------|------|
| Open-Meteo | ~€20/month |
| Supabase | Free → $25/month at scale |
| LocationIQ | Free → $49/month at scale |
| FCM | Free |
| Store fees | $124/year |

## Workflow Preferences
- Commit and push after every change (live on GitHub Pages immediately)
- Mobile-first development
- Dev preview available at `/dev/` path on GitHub Pages

## Archive Points
- `v1.0-pre-location-search` tag: Before multi-location feature
