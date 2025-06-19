
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Decode the token to get user information
    let tokenData;
    try {
      tokenData = JSON.parse(atob(token));
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid token format'
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { userId, plan, activationCode } = tokenData;

    // Generate optimized M3U playlist based on plan
    const channels = getChannelsByPlan(plan);
    const playlistContent = generateM3UContent(channels, tokenData);

    const playlistUrl = `data:application/vnd.apple.mpegurl;base64,${btoa(playlistContent)}`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(playlistUrl)}`;

    return new Response(JSON.stringify({
      success: true,
      data: {
        playlistContent,
        playlistUrl,
        qrCode,
        channelCount: channels.length,
        activationCode
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error('❌ Playlist generation failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

function getChannelsByPlan(plan: string) {
  const allChannels = [
    { id: 1, name: 'SteadyStream News', url: 'https://stream.steadystreamtv.com/news', logo: 'https://via.placeholder.com/200x200/1e40af/ffffff?text=NEWS', group: 'News' },
    { id: 2, name: 'SteadyStream Sports', url: 'https://stream.steadystreamtv.com/sports', logo: 'https://via.placeholder.com/200x200/059669/ffffff?text=SPORTS', group: 'Sports' },
    { id: 3, name: 'SteadyStream Movies', url: 'https://stream.steadystreamtv.com/movies', logo: 'https://via.placeholder.com/200x200/dc2626/ffffff?text=MOVIES', group: 'Movies' },
    { id: 4, name: 'SteadyStream Kids', url: 'https://stream.steadystreamtv.com/kids', logo: 'https://via.placeholder.com/200x200/f59e0b/ffffff?text=KIDS', group: 'Kids' },
    { id: 5, name: 'SteadyStream Music', url: 'https://stream.steadystreamtv.com/music', logo: 'https://via.placeholder.com/200x200/ec4899/ffffff?text=MUSIC', group: 'Music' },
    { id: 6, name: 'SteadyStream Entertainment', url: 'https://stream.steadystreamtv.com/entertainment', logo: 'https://via.placeholder.com/200x200/7c3aed/ffffff?text=ENT', group: 'Entertainment' }
  ];

  switch (plan) {
    case 'trial':
      return allChannels.slice(0, 3);
    case 'basic':
      return allChannels.slice(0, 4);
    default:
      return allChannels;
  }
}

function generateM3UContent(channels: any[], tokenData: any) {
  let m3u = '#EXTM3U\n';
  m3u += `#EXTINF:-1,SteadyStream TV - Enhanced Automation\n`;
  m3u += 'https://steadystream-tv.lovable.app\n\n';

  channels.forEach(channel => {
    m3u += `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.group}",${channel.name}\n`;
    m3u += `${channel.url}?token=${tokenData.activationCode}\n`;
  });

  return m3u;
}
