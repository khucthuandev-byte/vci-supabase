require('dotenv').config();

const bcrypt = require('bcryptjs');

const { getSupabase } = require('./config/supabase');

const NGANH = [
  {name:'Tiếp viên hàng không',grp:'Kỹ thuật',don_gia:590000,cam_ket:true},
  {name:'Điện công nghiệp',grp:'Kỹ thuật',don_gia:525000,cam_ket:true},
  {name:'Công nghệ thông tin',grp:'Kỹ thuật',don_gia:525000,cam_ket:true},
  {name:'Thiết kế đồ họa',grp:'Kỹ thuật',don_gia:525000,cam_ket:false},
];

async function seed() {

  console.log('🌱 Bắt đầu seed Supabase...');

  try {

    const sb = getSupabase();

    console.log('✅ Kết nối Supabase OK');

    // TEST DATABASE
    const { data:testData, error:testError } = await sb
      .from('users')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Lỗi database:', testError.message);
      return;
    }

    console.log('✅ Database query OK');

    // =========================
    // ADMIN
    // =========================

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@vci.edu.vn';

    const { data: ex, error: checkError } = await sb
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Check admin lỗi:', checkError.message);
      return;
    }

    if (!ex) {

      console.log('🔐 Tạo admin...');

      const hashed = await bcrypt.hash(
        process.env.SEED_ADMIN_PASS || 'Admin@VCI2026!',
        12
      );

      const { error: insertAdminError } = await sb
        .from('users')
        .insert({
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

      if (insertAdminError) {
        console.error('❌ Insert admin lỗi:', insertAdminError.message);
        return;
      }

      console.log(`✅ Admin tạo: ${email}`);

    } else {

      console.log(`ℹ️ Admin đã tồn tại: ${email}`);

    }

    // =========================
    // NGÀNH
    // =========================

    for (const n of NGANH) {

      const { data: ex2 } = await sb
        .from('nganh')
        .select('id')
        .eq('name', n.name)
        .maybeSingle();

      if (!ex2) {

        const { error } = await sb
          .from('nganh')
          .insert(n);

        if (error) {
          console.error(`❌ Lỗi insert ngành ${n.name}:`, error.message);
        } else {
          console.log(`✅ Đã thêm ngành: ${n.name}`);
        }
      }
    }

    console.log('\n🎉 Seed hoàn tất!\n');

    process.exit(0);

  } catch (err) {

    console.error('❌ SYSTEM ERROR');
    console.error(err);

    process.exit(1);
  }
}

seed();