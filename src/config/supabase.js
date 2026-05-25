const { createClient } = require('@supabase/supabase-js');

let sb;

function getSupabase() {
  if (!sb) {

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    console.log('🔍 SUPABASE DEBUG:');
    console.log('- URL:', url);
    console.log('- KEY LENGTH:', key?.length);

    if (!url || !key) {
      console.error('❌ Missing SUPABASE ENV');

      throw new Error(
        `Missing SUPABASE_URL or SUPABASE_SERVICE_KEY`
      );
    }

    sb = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });

    console.log('✅ Supabase client initialized');
  }

  return sb;
}

module.exports = { getSupabase };