
-- Add MegaOTT specific columns to existing tables
ALTER TABLE iptv_accounts 
ADD COLUMN IF NOT EXISTS megaott_subscription_id text,
ADD COLUMN IF NOT EXISTS package_id integer,
ADD COLUMN IF NOT EXISTS forced_country text DEFAULT 'ALL',
ADD COLUMN IF NOT EXISTS adult_content boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_vpn boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS dns_link text;

-- Update existing profiles table to include MegaOTT data
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS megaott_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Create MegaOTT subscription function
CREATE OR REPLACE FUNCTION create_megaott_subscription_v2(
  user_id_param uuid,
  customer_email text,
  customer_name text,
  plan_type text,
  stripe_session_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  megaott_response json;
  package_id integer;
  max_connections integer;
  username text;
  password text;
  api_url text := 'https://megaott.net/api/v1/subscriptions';
  create_token text := '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d';
  adult_enabled boolean := false;
BEGIN
  -- Generate unique username
  username := 'steady_' || extract(epoch from now())::bigint::text;
  
  -- Map plan types to package IDs and connections
  CASE plan_type
    WHEN 'standard' THEN
      package_id := 1;
      max_connections := 2;
    WHEN 'premium' THEN
      package_id := 2;
      max_connections := 4;
    WHEN 'ultimate' THEN
      package_id := 3;
      max_connections := 6;
      adult_enabled := true;
    WHEN 'trial' THEN
      package_id := 1;
      max_connections := 1;
    ELSE
      package_id := 1;
      max_connections := 1;
  END CASE;

  -- Call MegaOTT API using HTTP extension
  SELECT content::json INTO megaott_response
  FROM http((
    'POST',
    api_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || create_token),
      http_header('Accept', 'application/json'),
      http_header('Content-Type', 'application/x-www-form-urlencoded')
    ],
    'type=M3U&username=' || username || 
    '&package_id=' || package_id || 
    '&max_connections=' || max_connections || 
    '&forced_country=ALL' ||
    '&adult=' || CASE WHEN adult_enabled THEN 'true' ELSE 'false' END ||
    '&note=SteadyStream TV - ' || initcap(plan_type) || ' Plan' ||
    '&enable_vpn=true' ||
    '&paid=true'
  ));

  -- Check if MegaOTT API call was successful
  IF megaott_response IS NULL OR (megaott_response->>'error') IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', COALESCE(megaott_response->>'error', 'Failed to connect to MegaOTT API'),
      'raw_response', megaott_response
    );
  END IF;

  -- Extract credentials
  password := megaott_response->>'password';

  -- Update IPTV accounts table
  INSERT INTO iptv_accounts (
    user_id,
    stripe_session_id,
    megaott_subscription_id,
    username,
    password,
    server_url,
    playlist_url,
    plan_type,
    status,
    expires_at,
    package_id,
    dns_link
  ) VALUES (
    user_id_param,
    stripe_session_id,
    (megaott_response->>'id'),
    username,
    password,
    megaott_response->>'dns_link',
    (megaott_response->>'dns_link') || '/get.php?username=' || username || '&password=' || password || '&type=m3u_plus',
    plan_type,
    'active',
    (megaott_response->>'expiring_at')::timestamp,
    package_id,
    megaott_response->>'dns_link'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    megaott_subscription_id = EXCLUDED.megaott_subscription_id,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    server_url = EXCLUDED.server_url,
    playlist_url = EXCLUDED.playlist_url,
    plan_type = EXCLUDED.plan_type,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

  -- Update profiles table
  INSERT INTO profiles (
    id,
    email,
    xtream_username,
    xtream_password,
    megaott_subscription_id,
    subscription_status,
    subscription_start_date,
    subscription_end_date
  ) VALUES (
    user_id_param,
    customer_email,
    username,
    password,
    (megaott_response->>'id'),
    'active',
    now(),
    (megaott_response->>'expiring_at')::timestamp
  )
  ON CONFLICT (id) DO UPDATE SET
    xtream_username = EXCLUDED.xtream_username,
    xtream_password = EXCLUDED.xtream_password,
    megaott_subscription_id = EXCLUDED.megaott_subscription_id,
    subscription_status = EXCLUDED.subscription_status,
    subscription_end_date = EXCLUDED.subscription_end_date,
    updated_at = now();

  -- Return success response
  RETURN json_build_object(
    'success', true,
    'subscription_id', megaott_response->>'id',
    'credentials', json_build_object(
      'username', username,
      'password', password,
      'server_url', megaott_response->>'dns_link',
      'playlist_url', (megaott_response->>'dns_link') || '/get.php?username=' || username || '&password=' || password || '&type=m3u_plus',
      'max_connections', max_connections,
      'expiration_date', megaott_response->>'expiring_at',
      'package', megaott_response->'package'
    ),
    'raw_megaott_response', megaott_response
  );

EXCEPTION
  WHEN others THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Enable HTTP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;
