
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          isAdmin: false,
          fallback: true
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const userId = pathParts[pathParts.length - 1]

    // Special handling for known admin user
    const knownAdminUserId = 'de395bc5-08a6-4359-934a-e7509b4eff46'
    if (userId === knownAdminUserId) {
      return new Response(
        JSON.stringify({ 
          isAdmin: true,
          source: 'hardcoded_admin',
          userId: userId,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check user metadata for admin role
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
      
      if (!userError && userData?.user?.user_metadata?.role === 'admin') {
        return new Response(
          JSON.stringify({ 
            isAdmin: true,
            source: 'user_metadata',
            userId: userId,
            timestamp: new Date().toISOString()
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (metadataError) {
      console.warn('Error checking user metadata:', metadataError)
    }

    // Check admin email patterns
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
      
      if (!userError && userData?.user?.email) {
        const adminEmailPatterns = [
          'admin@steadystreamtv.com',
          'trav.singletary@gmail.com',
          'vincent@steadystreamtv.com'
        ]
        
        if (adminEmailPatterns.includes(userData.user.email.toLowerCase())) {
          // Update user metadata to admin
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { 
              role: 'admin',
              is_admin: true,
              updated_by: 'admin_roles_function'
            }
          })
          
          return new Response(
            JSON.stringify({ 
              isAdmin: true,
              source: 'admin_email_pattern',
              userId: userId,
              email: userData.user.email,
              timestamp: new Date().toISOString()
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }
    } catch (emailError) {
      console.warn('Error checking admin email pattern:', emailError)
    }

    return new Response(
      JSON.stringify({ 
        isAdmin: false,
        source: 'not_found',
        userId: userId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in admin_roles function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        isAdmin: false,
        fallback: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
