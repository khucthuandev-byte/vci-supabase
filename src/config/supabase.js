const { createClient } = require('@supabase/supabase-js');
let sb;
function getSupabase() {
  if (!sb) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
      throw new Error('Chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_KEY trong .env');
    sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });
  }
  return sb;
}
module.exports = { getSupabase };
