import { createClient } from '@supabase/supabase-js'

// Admin client with service role key - bypasses RLS
// ⚠️ WARNING: This should ONLY be imported and used in API routes (server-side)
// NEVER import this in client-side components

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
