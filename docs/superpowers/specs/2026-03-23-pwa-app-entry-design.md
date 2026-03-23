# PWA App-like Entry Experience Design

## Overview

Implement a native app-like PWA entry experience for the farm management app (养殖场管理). This includes three key components: splash screen, add-to-home-screen prompt, and offline indicator.

## Requirements

### 1. Splash Screen
- **Purpose**: Provide immediate visual feedback while the app loads
- **Appearance**: Full-screen overlay with app logo and loading animation
- **Colors**: Green theme (#4CAF50) matching existing manifest
- **Behavior**: Shows immediately from HTML, fades out when React app mounts
- **Performance**: Assets pre-cached by service worker

### 2. Add-to-Home-Screen Prompt
- **Purpose**: Encourage users to install the PWA for native experience
- **Browser Support**: Modern browsers that support `beforeinstallprompt` event
- **UI**: Custom banner with clear call-to-action
- **Instructions**: Include iOS Safari instructions (since iOS doesn't support beforeinstallprompt)

### 3. Offline Indicator
- **Purpose**: Show connection status for better user experience
- **UI**: Small badge or toast notification
- **Behavior**: Shows when app goes offline, disappears when back online

## Architecture

### File Structure
```
src/
├── components/
│   ├── SplashScreen.tsx        # Splash screen component
│   ├── InstallPrompt.tsx       # Add-to-home-screen component
│   └── NetworkStatus.tsx       # Offline indicator
├── hooks/
│   ├── usePWAInstall.ts        # Hook for PWA install logic
│   └── useNetworkStatus.ts     # Hook for network detection
├── styles/
│   └── pwa.css                 # PWA-specific styles
public/
├── pwa-192x192.png             # App logo for splash (reuse existing asset)
└── ios-install.png             # iOS install instruction image (new asset needed)
index.html                      # Add splash markup
vite.config.ts                  # Update PWA config for splash assets
```

### Component Design

#### 1. SplashScreen
- **Location**: `index.html` (initial HTML) + `SplashScreen.tsx` (React control)
- **HTML Part**: Full-screen div with app logo, loading spinner, and text
- **React Part**: Controls fade-out animation when app is ready
- **CSS**: CSS animations for loading spinner and fade transition

#### 2. InstallPrompt
- **Hook**: `usePWAInstall` manages beforeinstallprompt event
- **Component**: Conditional banner with install button
- **iOS Fallback**: Shows instructions for iOS Safari

#### 3. NetworkStatus
- **Hook**: `useNetworkStatus` monitors navigator.onLine and online/offline events
- **Component**: Badge that shows connection status

### Data Flow
1. User opens PWA → splash screen shows from cached HTML
2. Service worker loads → app assets loaded in background
3. React mounts → splash screen fades out
4. App detects PWA install eligibility → shows custom install prompt
5. Network status monitored → shows indicator when offline

## Implementation Details

### index.html Changes
Add splash screen markup inside `<body>` before `<div id="root">`:
```html
<div id="splash-screen" class="splash">
  <div class="splash-content">
    <img src="/pwa-192x192.png" alt="养殖场管理" class="splash-logo" />
    <div class="splash-loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</div>
```

### CSS Animations
- `splash-fade-out`: Smooth opacity transition (0.5s ease-out)
- `spinner-rotate`: Infinite rotation animation for loading indicator
- `install-banner-slide`: Slide up animation for install prompt

### Service Worker Caching
- Cache splash assets (logo, CSS) with high priority
- Pre-cache app shell for instant offline availability
- Use Workbox CacheFirst strategy for splash assets (static assets)

### PWA Config Updates (vite.config.ts)
- Add splash assets to `includeAssets`
- Update manifest with `screenshots` if needed
- Configure `workbox` for splash asset caching

## Success Criteria

### Must Have
- [ ] Splash screen appears immediately on app load
- [ ] Splash screen fades out smoothly when React mounts
- [ ] Install prompt appears for eligible browsers
- [ ] iOS users get clear instructions to add to home screen
- [ ] Offline indicator shows when connection is lost
- [ ] All assets cached by service worker for instant load

### Nice to Have
- [ ] Splash screen shows app version or loading progress
- [ ] Install prompt can be dismissed and remembers preference (using localStorage)
- [ ] Smooth transitions between online/offline states
- [ ] Analytics tracking for install rates

## Risks & Mitigations

### Browser Compatibility
- **Risk**: beforeinstallprompt not supported everywhere
- **Mitigation**: Graceful fallback, iOS Safari instructions

### Performance
- **Risk**: Splash screen delays app interactivity
- **Mitigation**: Pre-critical assets, fast fade-out

### User Experience
- **Risk**: Too aggressive install prompts annoy users
- **Mitigation**: Show once, respect user choice, subtle design

## Testing Strategy

### Manual Testing
- Chrome/Edge: Install prompt functionality
- Safari iOS: Add to home screen instructions
- Firefox: PWA installation
- Offline mode: Service worker caching

### Automated Testing
- Unit tests for hooks (usePWAInstall, useNetworkStatus)
- Visual regression tests for splash screen
- E2E tests for install flow

## Timeline

### Phase 1: Core Implementation (2-3 hours)
1. Add splash HTML to index.html
2. Create SplashScreen component
3. Implement fade-out logic
4. Add CSS animations

### Phase 2: Install Prompt (1-2 hours)
1. Create usePWAInstall hook
2. Build InstallPrompt component
3. Add iOS instructions
4. Handle user preferences

### Phase 3: Offline Indicator (30-60 minutes)
1. Create useNetworkStatus hook
2. Build NetworkStatus component
3. Add toast notifications

### Phase 4: Testing & Polish (1 hour)
1. Cross-browser testing
2. Performance optimization
3. Final styling adjustments

**Total Estimated Time**: 4.5-6.5 hours

## Alternative Approaches Considered

### Using Libraries
- **Pros**: Less code, battle-tested
- **Cons**: Extra dependency, less control

### Minimal Implementation
- **Pros**: Simple, fast
- **Cons**: Less polished, inconsistent across browsers

### Progressive Enhancement
- **Pros**: Works everywhere, graceful degradation
- **Cons**: More complex implementation

**Chosen Approach**: Enhanced native integration (custom implementation) for maximum control and polish.
