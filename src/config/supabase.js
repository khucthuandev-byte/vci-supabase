const { createClient } = require('@supabase/supabase-js');

let sb;

function getSupabase() {
  if (!sb) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      console.error('❌ Missing ENV:', {
        url: !!url,
        key: !!key
      });
      throw new Error('Missing Supabase ENV');
    }

    sb = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });

    console.log('✅ Supabase connected');
  }

  return sb;
}

module.exports = { getSupabase };