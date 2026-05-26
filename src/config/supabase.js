const { createClient } = require('@supabase/supabase-js');

let sb;

function getSupabase() {
  if (sb) return sb;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // ✅ FIX Ở ĐÂY

  if (!url || !key) {
    console.error("❌ SUPABASE ENV MISSING");
    console.error("URL:", !!url);
    console.error("KEY:", !!key);
    throw new Error("Missing Supabase ENV");
  }

  try {
    sb = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });

    console.log("✅ Supabase client initialized");
    console.log("👉 URL:", url);
    console.log("👉 KEY length:", key.length);

  } catch (err) {
    console.error("❌ Supabase init error:", err.message);
    throw err;
  }

  return sb;
}

module.exports = { getSupabase };