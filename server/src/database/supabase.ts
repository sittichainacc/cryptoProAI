import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sfotlpjydhdpcmkooqwr.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Q6UfnNVpNr3LMr-83D9XeQ_kFlIkUFA';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testSupabaseClient(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn(`[Supabase Client] Notice:`, error.message);
    } else {
      console.log(`[Supabase Client] ✅ Supabase JS Client initialized successfully (${supabaseUrl})`);
    }
    return true;
  } catch (err: any) {
    console.error(`[Supabase Client] ❌ Init error:`, err.message);
    return false;
  }
}
