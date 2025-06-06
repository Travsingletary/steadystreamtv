
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: any, res: any) {
  const { token } = req.query;
  
  try {
    // Remove .m3u8 extension if present
    const cleanToken = token.replace('.m3u8', '');
    
    // Use the NEW database function with improved logo handling
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
    
    res.status(200).send(playlistContent || '#EXTM3U\n#EXTINF:-1,Empty Playlist\nhttp://empty\n');
    
  } catch (error) {
    console.error('Playlist generation error:', error);
    const errorPlaylist = '#EXTM3U\n#EXTINF:-1,Error Loading Playlist\nhttp://error\n';
    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(500).send(errorPlaylist);
  }
}
