const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { getSupabase }  = require('../config/supabase');
const { protect, perm } = require('../middleware/auth');
const sheets = require('../controllers/sheetsController');
const email  = require('../controllers/emailController');

router.use(protect);

// GET /api/hoso – danh sách + lọc + phân trang
router.get('/', perm('hoSo'), async (req, res) => {
  try {
    const sb = getSupabase();
    const { page=1, limit=20, status, he_dao_tao, coso, q, sort='-created_at' } = req.query;
    const from = (Number(page)-1)*Number(limit);
    const to   = from + Number(limit) - 1;

    let query = sb.from('ho_so')
      .select('*, tu_van_vien:users(id,name,email)', { count:'exact' });

    // Nhân viên chỉ thấy cơ sở của mình
    if (req.user.role === 'staff' && req.user.coso !== 'Tất cả')
      query = query.eq('coso', req.user.coso);

    if (status)     query = query.eq('status', status);
    if (he_dao_tao) query = query.eq('he_dao_tao', he_dao_tao);
    if (coso && req.user.role === 'admin') query = query.eq('coso', coso);
    if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);

    const sortCol = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortAsc = !sort.startsWith('-');
    query = query.order(sortCol, { ascending: sortAsc }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ success:true, total:count, page:Number(page),
      pages: Math.ceil(count/Number(limit)), data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/hoso/export/csv – must be BEFORE /:id to avoid route conflict
// GET /api/hoso/export/csv
router.get('/export/csv', perm('hoSo'), async (req, res) => {
  try {
    let query = getSupabase().from('ho_so').select('*, tu_van_vien:users(name)').order('created_at', { ascending:false });
    if (req.user.role === 'staff' && req.user.coso !== 'Tất cả') query = query.eq('coso', req.user.coso);
    const { data } = await query;
    const headers = ['#','Họ tên','SĐT','Email','Hệ đào tạo','Ngành','Cơ sở','Ngày','Trạng thái','Tư vấn viên'];
    const rows = data.map((r,i) => [
      i+1, r.name, r.phone, r.email||'', r.he_dao_tao, r.nganh||'', r.coso||'',
      new Date(r.created_at).toLocaleDateString('vi-VN'), r.status, r.tu_van_vien?.name||'',
    ]);
    const csv = [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',`attachment; filename="VCI_HoSo_${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/hoso/:id
router.get('/:id', perm('hoSo'), async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('ho_so').select('*, tu_van_vien:users(id,name,email)')
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ success:false, message:'Không tìm thấy hồ sơ.' });
    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/hoso – tạo mới
router.post('/',
  body('name').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('he_dao_tao').notEmpty(),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ success:false, errors:errs.array() });
    try {
      const sb = getSupabase();
      const payload = {
        ...req.body,
        history: [{ action:'Tạo hồ sơ', by: req.user?.id, note:'Hồ sơ được tạo mới', at: new Date().toISOString() }],
      };
      const { data, error } = await sb.from('ho_so').insert(payload).select().single();
      if (error) throw error;

      // Audit log
      await sb.from('audit_logs').insert({ user_id:req.user?.id, action:'create_hoso', target:data.id, ip:req.ip });

      // Google Sheets (async)
      sheets.appendRow(data).then(() =>
        sb.from('ho_so').update({ sheet_synced:true }).eq('id', data.id)
      ).catch(console.error);

      // Email xác nhận
      if (data.email) email.sendConfirmation(data).catch(console.error);

      res.status(201).json({ success:true, data });
    } catch(err) { res.status(500).json({ success:false, message:err.message }); }
  }
);

// PUT /api/hoso/:id
router.put('/:id', perm('hoSo'), async (req, res) => {
  try {
    const sb = getSupabase();
    const { data:existing } = await sb.from('ho_so').select('*').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ success:false, message:'Không tìm thấy hồ sơ.' });

    if (req.user.role === 'staff' && req.user.coso !== 'Tất cả' && existing.coso !== req.user.coso)
      return res.status(403).json({ success:false, message:'Không có quyền sửa hồ sơ này.' });

    const { action, note, ...updateData } = req.body;
    // Thêm vào lịch sử
    const history = [...(existing.history || [])];
    if (action || note) history.push({ action:action||'Cập nhật', note, by:req.user.id, at:new Date().toISOString() });
    updateData.history = history;

    const { data, error } = await sb.from('ho_so').update(updateData).eq('id', req.params.id).select().single();
    if (error) throw error;

    await sb.from('audit_logs').insert({ user_id:req.user.id, action:'update_hoso', target:req.params.id, ip:req.ip });
    sheets.updateRow(data).catch(console.error);

    res.json({ success:true, data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// DELETE /api/hoso/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success:false, message:'Chỉ Admin mới được xóa hồ sơ.' });
    const { error } = await getSupabase().from('ho_so').delete().eq('id', req.params.id);
    if (error) throw error;
    await getSupabase().from('audit_logs').insert({ user_id:req.user.id, action:'delete_hoso', target:req.params.id, ip:req.ip });
    res.json({ success:true, message:'Đã xóa hồ sơ.' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
