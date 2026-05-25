const { createClient } = require('@supabase/supabase-js');

let sb;

function getSupabase() {
  if (sb) return sb;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();

  if (!url || !key) {
    throw new Error('Missing SUPABASE env');
  }

  sb = createClient(url, key, {
    auth: { persistSession: false }
  });

  console.log('✅ Supabase connected');
  return sb;
}

module.exports = { getSupabase };