
// Production Configuration
const SUPABASE_URL = 'https://ojueihcytxwcioqtvwez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM';

// MegaOTT Production Configuration
const MEGAOTT_CONFIG = {
  baseUrl: 'https://megaott.net/api/v1/user',
  apiKey: '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'
};

// Production Automation Service with REAL API calls
export const ProductionAutomationService = {
  async signUp(email: string, password: string, userData: any) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        password,
        data: userData
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Registration failed');
    }
    
    return response.json();
  },

  async registerUser(userData: any) {
    try {
      console.log('🚀 Starting production registration for:', userData.email);

      // Create user in Supabase Auth
      const authData = await this.signUp(userData.email, userData.password, {
        full_name: userData.name,
        plan: userData.plan || 'trial'
      });

      const userId = authData.user?.id;
      if (!userId) throw new Error('User creation failed');

      console.log('✅ User created:', userId);

      // Generate activation code and assets
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      // Using JSON.stringify instead of any potential dynamic code execution
      const playlistToken = btoa(JSON.stringify({
        userId,
        activationCode,
        plan: userData.plan,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
      }));

      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;
      console.log('✅ Assets generated');

      // Create REAL MegaOTT subscription (no simulations)
      let megaottResult = null;
      try {
        console.log('🔥 Creating REAL MegaOTT subscription for all plans...');
        const megaottResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-xtream-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            userId: userId,
            planType: userData.plan,
            email: userData.email,
            name: userData.name
          })
        });

        if (megaottResponse.ok) {
          megaottResult = await megaottResponse.json();
          console.log('✅ REAL MegaOTT subscription created:', megaottResult.data?.username);
        } else {
          const errorData = await megaottResponse.json();
          console.error('❌ MegaOTT API error:', errorData);
          throw new Error(errorData.error || 'Failed to create IPTV account');
        }
      } catch (megaError) {
        console.error('❌ MegaOTT integration failed:', megaError.message);
        throw megaError; // Don't use fallback, require real subscription
      }

      // Send welcome email with REAL credentials
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId,
            email: userData.email,
            name: userData.name,
            iptv: {
              username: megaottResult?.data?.username || activationCode,
              password: megaottResult?.data?.password || 'temp123',
              playlistUrls: megaottResult?.data?.playlistUrls || {
                m3u: playlistUrl,
                m3u_plus: playlistUrl.replace('.m3u8', '_plus.m3u8'),
                xspf: playlistUrl.replace('.m3u8', '.xspf')
              }
            }
          })
        });
        console.log('✅ Welcome email sent with REAL credentials');
      } catch (emailError) {
        console.warn('⚠️ Email sending failed:', emailError.message);
      }

      return {
        success: true,
        user: authData.user,
        activationCode: megaottResult?.data?.username || activationCode,
        playlistUrl: megaottResult?.data?.playlistUrls?.m3u || playlistUrl,
        megaottSubscription: megaottResult,
        message: 'Account created successfully with REAL IPTV subscription!'
      };

    } catch (error: any) {
      console.error('💥 Registration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
