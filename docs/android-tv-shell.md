# SteadyStream Android TV / Capacitor shell

## Goal

Ship a SteadyStream-branded TV app (`tv.aether.player`) that plays the user’s **provisioned** MegaOTT / Xtream catalog, informed by TiviMate RE (Leanback UX, Media3 ExoPlayer + FFmpeg).

## Interim Fire Stick path (keep)

Until this shell reaches parity:

1. Install **stock TiviMate** via Downloader code `1592817` (`CONFIG.tivimate` / Connect Apps).
2. Add playlist with the user’s M3U / Xtream credentials from Account / Dashboard.
3. Do **not** redistribute or modify TiviMate.

## Capacitor bootstrap (this branch)

```bash
npm i
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android
npm run build
npx cap add android   # once
npx cap sync android
npx cap open android
```

Config: `capacitor.config.ts` (`appId: tv.aether.player`, cleartext allowed for IPTV CDNs).

## Native Media3 phase (next)

TiviMate RE confirmed:

- `androidx.media3.exoplayer.ExoPlayer`
- Media3 FFmpeg extension + `libffmpegJNI.so`

Plan for native module (not in this scaffold commit):

1. Android TV / Leanback activity with D-pad channel rail.
2. ExoPlayer `MediaItem` from Xtream live `.m3u8` URLs returned by `xtream-channels`.
3. Optional FFmpeg extension for exotic codecs.
4. Deep-link / QR from web dashboard to auto-fill credentials (interop only).

## Edge function

Deploy `supabase/functions/xtream-channels` so the web/Capacitor WebView can load catalogs without browser CORS blocks:

```bash
supabase functions deploy xtream-channels
```

Auth: caller JWT; credentials resolved from `subscriptions` (preferred) or legacy profile fields.
