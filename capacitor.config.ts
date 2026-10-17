import type { CapacitorConfig } from "@capacitor/cli";

/**
 * SteadyStream TV shell (Capacitor).
 * Aligns with prior APK branding (tv.aether.player) and TiviMate RE notes:
 * Media3/ExoPlayer+FFmpeg on native TV will replace/augment the WebView player
 * in a later phase. Until then, Fire Stick users keep stock TiviMate + M3U.
 */
const config: CapacitorConfig = {
  appId: "tv.aether.player",
  appName: "SteadyStream",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#000000",
  },
};

export default config;
