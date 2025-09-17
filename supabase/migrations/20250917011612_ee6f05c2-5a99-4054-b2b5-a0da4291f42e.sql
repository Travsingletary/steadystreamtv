-- SteadyStream TV - ESSENTIAL DATABASE CLEANUP (Step 1: Clean slate)
-- Drop all unnecessary tables

DROP TABLE IF EXISTS users_log CASCADE;
DROP TABLE IF EXISTS megaott_subscribers CASCADE;
DROP TABLE IF EXISTS device_pairings CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS user_friends CASCADE;
DROP TABLE IF EXISTS health_check CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS viewing_analytics CASCADE;
DROP TABLE IF EXISTS steadystream_users CASCADE;
DROP TABLE IF EXISTS optimized_playlists CASCADE;
DROP TABLE IF EXISTS megaott_credits CASCADE;
DROP TABLE IF EXISTS token_retry_queue CASCADE;
DROP TABLE IF EXISTS resellers CASCADE;
DROP TABLE IF EXISTS system_errors CASCADE;
DROP TABLE IF EXISTS megaott_transactions CASCADE;
DROP TABLE IF EXISTS user_preferences_enhanced CASCADE;
DROP TABLE IF EXISTS user_playlists CASCADE;
DROP TABLE IF EXISTS megaott_diagnostics CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS users_with_active_subscriptions CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS purchase_automations CASCADE;
DROP TABLE IF EXISTS checkout_sessions CASCADE;
DROP TABLE IF EXISTS bet_rooms CASCADE;
DROP TABLE IF EXISTS bet_room_bets CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS bet_room_participants CASCADE;
DROP TABLE IF EXISTS channels_catalog CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS megaott_subscriptions CASCADE;
DROP TABLE IF EXISTS steadystream_playlists CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS iptv_accounts CASCADE;
DROP TABLE IF EXISTS user_subscriptions_new CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- Drop existing subscriptions table if it exists to start fresh
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";