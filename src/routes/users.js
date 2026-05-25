const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getSupabase }      = require('../config/supabase');
const { protect, role }    = require('../middleware/auth');

router.use(protect, role('admin'));

router.get('/', async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('users').select('id,name,email,role,coso,active,permissions,last_login,created_at').order('created_at', { ascending:false });
    if (error) throw error;
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/',
  body('name').notEmpty(), body('email').isEmail(),
  body('password').isLength({ min:8 }), body('role').isIn(['admin','staff','viewer']),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ success:false, errors:errs.array() });
    try {
      const sb = getSupabase();
      const { data:ex } = await sb.from('users').select('id').eq('email', req.body.email).single();
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

router.put('/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const { data, error } = await getSupabase().from('users').update(updateData).eq('id', req.params.id)
      .select('id,name,email,role,coso,active,permissions').single();
    if (error) throw error;
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id/toggle', async (req, res) => {
  try {
    const sb = getSupabase();
    const { data:u } = await sb.from('users').select('active,role').eq('id', req.params.id).single();
    if (!u) return res.status(404).json({ success:false, message:'Không tìm thấy user.' });
    const { data } = await sb.from('users').update({ active:!u.active }).eq('id', req.params.id).select('active').single();
    res.json({ success:true, active:data.active, message: data.active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id/reset-password', async (req, res) => {
  try {
    const newPwd = req.body.newPassword || ('VCI@'+Math.random().toString(36).slice(-6).toUpperCase());
    const hashed = await bcrypt.hash(newPwd, 12);
    await getSupabase().from('users').update({ password:hashed, must_change_pwd:true }).eq('id', req.params.id);
    res.json({ success:true, message:'Đã đặt lại mật khẩu.', tempPassword: newPwd });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id/permissions', async (req, res) => {
  try {
    const { data } = await getSupabase().from('users').update({ permissions:req.body }).eq('id', req.params.id)
      .select('id,name,permissions').single();
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
