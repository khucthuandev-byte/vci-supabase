const { createClient } = require('@supabase/supabase-js');

let sb;

function getSupabase() {
  if (!sb) {

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY');
    }

    sb = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }

  return sb;
}

module.exports = { getSupabase };