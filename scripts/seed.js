require('dotenv').config();

const bcrypt = require('bcryptjs');
const { getSupabase } = require('../src/config/supabase');

const NGANH = [
  { name: 'Tiếp viên hàng không', grp: 'Kỹ thuật', don_gia: 590000, cam_ket: true },
  { name: 'Điện công nghiệp', grp: 'Kỹ thuật', don_gia: 525000, cam_ket: true },
  { name: 'Công nghệ thông tin', grp: 'Kỹ thuật', don_gia: 525000, cam_ket: true },
  { name: 'Thiết kế đồ họa', grp: 'Kỹ thuật', don_gia: 525000, cam_ket: false },
];

async function seed() {
  console.log('🌱 Seed starting...');

  try {
    const sb = getSupabase();

    // TEST CONNECTION
    const { error: testError } = await sb.from('users').select('id').limit(1);

    if (testError) {
      console.error('❌ DB error:', testError.message);
      return process.exit(1);
    }

    console.log('✅ Supabase connected');

    // =========================
    // ADMIN
    // =========================
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@vci.edu.vn';

    const { data: exAdmin, error: checkError } = await sb
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Check admin error:', checkError.message);
      return process.exit(1);
    }

    if (!exAdmin) {
      console.log('🔐 Creating admin...');

      const hashed = await bcrypt.hash(
        process.env.SEED_ADMIN_PASS || 'Admin@VCI2026!',
        12
      );

      const { error: insertError } = await sb.from('users').insert({
        name: process.env.SEED_ADMIN_NAME || 'Quản trị viên VCI',
        email,
        password: hashed,
        role: 'admin',
        coso: 'Tất cả',
        must_change_pwd: false,
        permissions: {
          dashboard: true,
          hoSo: true,
          nganh: true,
          he: true,
          taiKhoan: true,
          phanQuyen: true,
          caiDat: true,
          baoCao: true,
          chatbot: true
        }
      });

      if (insertError) {
        console.error('❌ Insert admin error:', insertError.message);
        return process.exit(1);
      }

      console.log('✅ Admin created:', email);

    } else {
      console.log('ℹ️ Admin exists:', email);
    }

    // =========================
    // NGÀNH
    // =========================
    for (const n of NGANH) {
      const { data: exNganh } = await sb
        .from('nganh')
        .select('id')
        .eq('name', n.name)
        .maybeSingle();

      if (!exNganh) {
        const { error } = await sb.from('nganh').insert(n);

        if (error) {
          console.error(`❌ Insert ngành ${n.name} error:`, error.message);
        } else {
          console.log(`✅ Added: ${n.name}`);
        }
      }
    }

    console.log('\n🎉 SEED DONE\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ SYSTEM ERROR:', err.message);
    process.exit(1);
  }
}

seed();