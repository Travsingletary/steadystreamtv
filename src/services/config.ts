
// src/services/config.ts
// Centralized configuration for all services - SECURITY UPDATED

export const CONFIG = {
  supabase: {
    url: 'https://ojueihcytxwcioqtvwez.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM'
  },
  app: {
    downloadCode: '1592817',
    downloadUrl: 'aftv.news/1592817'
  }
  // SECURITY FIX: Removed hardcoded MegaOTT API credentials
  // These are now stored securely in Supabase Edge Function secrets
};
