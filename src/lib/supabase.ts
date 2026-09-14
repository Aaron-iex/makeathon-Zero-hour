import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are read from process.env (Vercel Edge compatible)
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Client for client-side usage (read-only / public operations)
export const supabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder_anon_key"
);

// Client for server-side / Edge usage (admin mutations)
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseServiceRoleKey || "placeholder_service_role_key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);
