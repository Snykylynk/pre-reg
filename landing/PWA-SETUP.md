# PWA Setup Instructions

This project is configured as a Progressive Web App (PWA). To complete the setup, you need to add icon files.

## Required Icons

Create the following icon files in the `public` directory:

1. **pwa-192x192.png** - 192x192 pixels (for Android)
2. **pwa-512x512.png** - 512x512 pixels (for Android and splash screens)
3. **apple-touch-icon.png** - 180x180 pixels (for iOS)
4. **mask-icon.svg** - SVG icon for Safari (optional but recommended)

## Quick Setup

1. Use an online PWA icon generator:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/

2. Or use the provided `icon-template.svg` in the `public` directory and convert it to PNG:
   - Use an online SVG to PNG converter
   - Or use ImageMagick: `convert -background none -size 512x512 icon-template.svg pwa-512x512.png`

3. Generate all required sizes from your main icon

## Testing PWA

1. Build the project: `npm run build`
2. Preview the build: `npm run preview`
3. Open in Chrome/Edge and check:
   - Application tab > Manifest (should show your PWA manifest)
   - Application tab > Service Workers (should show registered service worker)
   - Look for the install prompt in the address bar

## Features Enabled

- ✅ Offline support via service worker
- ✅ Installable on mobile and desktop
- ✅ App-like experience (standalone display mode)
- ✅ Caching for Supabase API calls
- ✅ Automatic service worker updates

