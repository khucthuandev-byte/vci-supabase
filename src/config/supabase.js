const { createClient } = require('@supabase/supabase-js');

let sb;

function getSupabase() {
  if (!sb) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      console.error('❌ Missing SUPABASE ENV');
      throw new Error('Missing SUPABASE ENV');
    }

    sb = createClient(url, key, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'vci-backend'
        }
      }
    });

    console.log('✅ Supabase client ready');
  }

  return sb;
}

module.exports = { getSupabase };