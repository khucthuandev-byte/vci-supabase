const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getSupabase }      = require('../config/supabase');
const { protect, role }    = require('../middleware/auth');
const emailCtrl            = require('../controllers/emailController');

router.use(protect, role('admin'));

router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    const { data, error, count } = await getSupabase()
      .from('users')
      .select('id,name,email,role,coso,active,permissions,last_login,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ success: true, total: count, page, pages: Math.ceil(count / limit), data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/',
  body('name').notEmpty(), body('email').isEmail(),
  body('password').isLength({ min:8 }), body('role').isIn(['admin','staff','viewer']),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ success:false, errors:errs.array() });
    try {
      const sb = getSupabase();
      const { data:ex } = await sb.from('users').select('id').eq('email', req.body.email).maybeSingle();
      if (ex) return res.status(400).json({ success:false, message:'Email đã tồn tại.' });

      const defaultPerms = {
        admin:  { dashboard:true,hoSo:true,nganh:true,he:true,taiKhoan:true,phanQuyen:true,caiDat:true,baoCao:true,chatbot:true },
        staff:  { dashboard:true,hoSo:true,nganh:false,he:true,taiKhoan:false,phanQuyen:false,caiDat:false,baoCao:true,chatbot:false },
        viewer: { dashboard:true,hoSo:false,nganh:false,he:false,taiKhoan:false,phanQuyen:false,caiDat:false,baoCao:true,chatbot:false },
      };
      const hashed = await bcrypt.hash(req.body.password, 12);
      const { data, error } = await sb.from('users').insert({
        name:req.body.name, email:req.body.email, password:hashed,
        role:req.body.role, coso:req.body.coso||'Tất cả',
        permissions: defaultPerms[req.body.role], must_change_pwd:true,
      }).select('id,name,email,role,coso,active,permissions').single();
      if (error) throw error;
      res.status(201).json({ success:true, data });
    } catch(err) { res.status(500).json({ success:false, message:err.message }); }
  }
);

// Các route cụ thể phải đứng TRƯỚC /:id
router.put('/:id/toggle', async (req, res) => {
  try {
    const sb = getSupabase();
    const { data:u, error:uErr } = await sb.from('users').select('active,role').eq('id', req.params.id).maybeSingle();
    if (uErr || !u) return res.status(404).json({ success:false, message:'Không tìm thấy user.' });
    const { data, error:togErr } = await sb.from('users').update({ active:!u.active }).eq('id', req.params.id).select('active').single();
    if (togErr) throw togErr;
    res.json({ success:true, active:data.active, message: data.active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id/reset-password', async (req, res) => {
  try {
    const sb = getSupabase();
    const { data: targetUser } = await sb.from('users').select('id,name,email').eq('id', req.params.id).maybeSingle();
    if (!targetUser) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    const newPwd = req.body.newPassword || (
      'VCI@' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    );
    const hashed = await bcrypt.hash(newPwd, 12);
    await sb.from('users').update({ password: hashed, must_change_pwd: true }).eq('id', req.params.id);

    emailCtrl.sendTempPassword({ email: targetUser.email, name: targetUser.name, tempPassword: newPwd })
      .catch(err => console.error('RESET PWD EMAIL ERROR:', err.message));

    res.json({ success: true, message: `Đã đặt lại mật khẩu. Mật khẩu tạm đã được gửi tới ${targetUser.email}.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/permissions', async (req, res) => {
  try {
    const { data, error: permErr } = await getSupabase().from('users').update({ permissions:req.body }).eq('id', req.params.id)
      .select('id,name,permissions').single();
    if (permErr) throw permErr;
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

const ALLOWED_UPDATE = ['name','email','role','coso'];
router.put('/:id', async (req, res) => {
  try {
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => ALLOWED_UPDATE.includes(k))
    );
    if (!Object.keys(updateData).length)
      return res.status(400).json({ success:false, message:'Không có trường hợp lệ để cập nhật.' });
    const { data, error } = await getSupabase().from('users').update(updateData).eq('id', req.params.id)
      .select('id,name,email,role,coso,active,permissions').single();
    if (error) throw error;
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
