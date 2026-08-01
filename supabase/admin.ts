import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/supabase/types'

// Service role client — bypasses RLS. Server-side only.
export const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
