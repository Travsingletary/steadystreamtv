
import { SimpleAutomationService } from '@/services/automationService';

export default function handler(req: any, res: any) {
  const { token } = req.query;
  
  try {
    // Remove .m3u8 extension if present
    const cleanToken = token.replace('.m3u8', '');
    
    // Decode the playlist token
    const playlistData = JSON.parse(atob(cleanToken));
    
    // Check if token is expired
    if (Date.now() > playlistData.expires) {
      const expiredPlaylist = '#EXTM3U\n#EXTINF:-1,Token Expired\nhttp://expired\n';
      res.setHeader('Content-Type', 'application/x-mpegURL');
      return res.status(200).send(expiredPlaylist);
    }

    // Generate M3U content based on plan
    const m3uContent = SimpleAutomationService.generateM3UContent(
      playlistData.plan, 
      playlistData.activationCode
    );

    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(m3uContent);
    
  } catch (error) {
    console.error('Playlist generation error:', error);
    const errorPlaylist = '#EXTM3U\n#EXTINF:-1,Error Loading Playlist\nhttp://error\n';
    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.status(500).send(errorPlaylist);
  }
}
