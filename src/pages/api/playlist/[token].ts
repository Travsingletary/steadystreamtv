
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: any, res: any) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).send('#EXTM3U\n#EXTINF:-1,Error: Invalid playlist token');
  }

  try {
    // Remove .m3u8 extension if present
    const cleanToken = token.replace('.m3u8', '');
    
    // Get playlist data
    const { data: playlist, error: playlistError } = await supabase
      .from('optimized_playlists')
      .select('*, user_id')
      .eq('token', cleanToken)
      .single();

    if (playlistError || !playlist) {
      // Fallback to database function for backwards compatibility
      const { data: playlistContent, error } = await supabase.rpc('generate_m3u_playlist', {
        input_token: cleanToken
      });

      if (error) {
        console.error('Playlist generation error:', error);
        const errorPlaylist = '#EXTM3U\n#EXTINF:-1,Error Loading Playlist\nhttp://error\n';
        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(500).send(errorPlaylist);
      }

      // Set proper headers for M3U playlist
      res.setHeader('Content-Type', 'application/x-mpegURL');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      return res.status(200).send(playlistContent || '#EXTM3U\n#EXTINF:-1,Empty Playlist\nhttp://empty\n');
    }

    // Extract user ID from token if playlist not found in optimized_playlists
    let userId = playlist?.user_id;
    if (!userId) {
      try {
        const tokenData = JSON.parse(atob(cleanToken));
        userId = tokenData.userId;
      } catch (e) {
        return res.status(400).send('#EXTM3U\n#EXTINF:-1,Error: Invalid token format');
      }
    }

    // Check subscription status using new enhanced schema
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions_new')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.status(403).send('#EXTM3U\n#EXTINF:-1,Error: No active subscription');
    }

    // Check if subscription expired
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      await supabase
        .from('user_subscriptions_new')
        .update({ status: 'expired' })
        .eq('id', subscription.id);
      
      return res.status(403).send('#EXTM3U\n#EXTINF:-1,Error: Subscription expired');
    }

    // Track device if device ID provided
    const deviceId = req.headers['x-device-id'] || req.headers['user-agent'];
    if (deviceId && userId) {
      await trackDevice(userId, deviceId as string, req);
    }

    // Get user preferences for dynamic optimization
    const { data: preferences } = await supabase
      .from('user_preferences_enhanced')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Generate optimized playlist content
    let optimizedContent;
    if (playlist?.content) {
      // Use stored optimized content and apply real-time optimizations
      optimizedContent = applyRealtimeOptimizations(
        playlist.content,
        preferences,
        req.headers
      );

      // Update access tracking
      await supabase
        .from('optimized_playlists')
        .update({
          last_accessed: new Date().toISOString()
        })
        .eq('id', playlist.id);
    } else {
      // Generate fresh content using database function
      const { data: freshContent } = await supabase.rpc('generate_m3u_playlist', {
        input_token: cleanToken
      });
      
      optimizedContent = applyRealtimeOptimizations(
        freshContent || '#EXTM3U\n#EXTINF:-1,No Content Available\nhttp://error\n',
        preferences,
        req.headers
      );
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Playlist-Generated', new Date().toISOString());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Send optimized playlist
    res.status(200).send(optimizedContent);

  } catch (error) {
    console.error('Playlist delivery error:', error);
    res.status(500).send('#EXTM3U\n#EXTINF:-1,Error: Server error');
  }
}

// Track device access
async function trackDevice(userId: string, deviceId: string, req: any) {
  try {
    const deviceInfo = {
      user_id: userId,
      device_id: deviceId,
      device_name: req.headers['x-device-name'] || 'Unknown Device',
      device_type: detectDeviceType(req.headers['user-agent'] as string),
      ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      last_active: new Date().toISOString()
    };

    // Check device limit before adding new device
    const { data: existingDevices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: userSubscription } = await supabase
      .from('user_subscriptions_new')
      .select('device_limit')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const deviceLimit = userSubscription?.device_limit || 1;
    const isExistingDevice = existingDevices?.some(d => d.device_id === deviceId);

    if (!isExistingDevice && (existingDevices?.length || 0) >= deviceLimit) {
      console.warn(`Device limit exceeded for user ${userId}`);
      return;
    }

    // Upsert device
    await supabase
      .from('user_devices')
      .upsert(deviceInfo, {
        onConflict: 'user_id,device_id'
      });

    // Update devices_connected count
    const { count } = await supabase
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    await supabase
      .from('user_subscriptions_new')
      .update({ devices_connected: count || 0 })
      .eq('user_id', userId)
      .eq('status', 'active');

  } catch (error) {
    console.error('Device tracking error:', error);
  }
}

// Detect device type from user agent
function detectDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('tivimate')) return 'tivimate';
  if (ua.includes('firetv') || ua.includes('aftt')) return 'firestick';
  if (ua.includes('androidtv')) return 'androidtv';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  if (ua.includes('roku')) return 'roku';
  if (ua.includes('appletv')) return 'appletv';
  if (ua.includes('smart-tv') || ua.includes('smarttv')) return 'smart-tv';
  
  return 'web';
}

// Apply real-time optimizations based on user preferences and context
function applyRealtimeOptimizations(
  content: string,
  preferences: any,
  headers: any
): string {
  if (!content || !content.includes('#EXTM3U')) {
    return content;
  }

  let lines = content.split('\n');
  let optimized: string[] = ['#EXTM3U'];
  let channels: any[] = [];
  
  // Parse channels
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF:')) {
      const channelInfo = parseChannelInfo(lines[i]);
      const url = lines[i + 1];
      
      if (channelInfo && url && url.trim() !== '') {
        channels.push({
          ...channelInfo,
          url: url.trim(),
          originalIndex: i
        });
        i++; // Skip URL line
      }
    } else if (lines[i].startsWith('#PLAYLIST:') || lines[i].startsWith('url-tvg=')) {
      optimized.push(lines[i]);
    }
  }

  if (!preferences) {
    // No preferences - return original content with minor cleanup
    channels.forEach(channel => {
      const extinf = `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.group}",${channel.name}`;
      optimized.push(extinf);
      optimized.push(channel.url);
    });
    return optimized.join('\n');
  }

  // Apply sorting based on preferences
  channels = sortChannels(channels, preferences);

  // Filter blocked categories
  if (preferences.blocked_categories?.length > 0) {
    channels = channels.filter(ch => 
      !preferences.blocked_categories.includes(ch.group)
    );
  }

  // Apply parental controls with time-based filtering
  if (preferences.parental_controls) {
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour <= 22) {
      // Daytime - filter adult content
      channels = channels.filter(ch => 
        !ch.group.toLowerCase().includes('adult') &&
        !ch.group.toLowerCase().includes('xxx') &&
        !ch.name.toLowerCase().includes('adult')
      );
    }
  }

  // Rebuild M3U content
  channels.forEach(channel => {
    const extinf = `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.group}",${channel.name}`;
    optimized.push(extinf);
    optimized.push(channel.url);
  });

  return optimized.join('\n');
}

// Parse channel info from EXTINF line
function parseChannelInfo(line: string) {
  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
  const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
  const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
  const groupTitleMatch = line.match(/group-title="([^"]*)"/);
  
  const namePart = line.split(',').slice(1).join(',').trim();
  const name = namePart || tvgNameMatch?.[1] || 'Unknown Channel';
  
  return {
    id: tvgIdMatch?.[1] || name.replace(/[^a-zA-Z0-9]/g, ''),
    name: name,
    logo: tvgLogoMatch?.[1] || 'https://via.placeholder.com/200x200/6b7280/ffffff?text=TV',
    group: groupTitleMatch?.[1] || 'General'
  };
}

// Sort channels based on user preferences
function sortChannels(channels: any[], preferences: any) {
  const favoriteCategories = preferences.favorite_categories || [];
  
  // Sort by:
  // 1. Favorite categories (in order)
  // 2. Alphabetically within categories
  return channels.sort((a, b) => {
    const aFavIndex = favoriteCategories.indexOf(a.group);
    const bFavIndex = favoriteCategories.indexOf(b.group);
    
    // Both in favorites
    if (aFavIndex !== -1 && bFavIndex !== -1) {
      if (aFavIndex !== bFavIndex) {
        return aFavIndex - bFavIndex;
      }
      return a.name.localeCompare(b.name);
    }
    
    // Only A in favorites
    if (aFavIndex !== -1) return -1;
    
    // Only B in favorites
    if (bFavIndex !== -1) return 1;
    
    // Neither in favorites - sort by group then name
    if (a.group !== b.group) {
      return a.group.localeCompare(b.group);
    }
    
    return a.name.localeCompare(b.name);
  });
}
