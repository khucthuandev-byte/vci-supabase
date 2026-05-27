const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { getSupabase } = require('../config/supabase');
const { protect, role } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success: false, errors: errs.array() });
  next();
};

// GET ALL - PUBLIC
router.get('/', async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('nganh').select('*').order('name');
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE - ADMIN
router.post('/', protect, role('admin'),
  body('name').trim().notEmpty().withMessage('Vui lòng nhập tên ngành'),
  body('ma_nganh').optional({ nullable: true }).trim().isLength({ max: 20 }),
  validate,
  async (req, res) => {
    try {
      const sb = getSupabase();
      const { data: existing } = await sb.from('nganh').select('id').eq('name', req.body.name).maybeSingle();
      if (existing) return res.status(400).json({ success: false, message: 'Tên ngành đã tồn tại.' });

      const { name, ma_nganh, ...rest } = req.body;
      const { data, error } = await sb.from('nganh').insert({ name, ma_nganh: ma_nganh || null, ...rest }).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// UPDATE - ADMIN
router.put('/:id', protect, role('admin'),
  body('name').optional().trim().notEmpty().withMessage('Tên ngành không được để trống'),
  body('ma_nganh').optional({ nullable: true }).trim().isLength({ max: 20 }),
  validate,
  async (req, res) => {
    try {
      const sb = getSupabase();
      const { data: existing } = await sb.from('nganh').select('id').eq('id', req.params.id).maybeSingle();
      if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy ngành.' });

      const { name, ma_nganh, ...rest } = req.body;
      const updateData = { ...rest };
      if (name !== undefined) updateData.name = name;
      if (ma_nganh !== undefined) updateData.ma_nganh = ma_nganh;

      const { data, error } = await sb.from('nganh').update(updateData).eq('id', req.params.id).select().single();
      if (error) throw error;
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// DELETE - ADMIN
router.delete('/:id', protect, role('admin'), async (req, res) => {
  try {
    const sb = getSupabase();
    const { count } = await sb.from('ho_so').select('id', { count: 'exact', head: true }).eq('nganh', req.params.id);
    if (count > 0) return res.status(400).json({ success: false, message: `Không thể xóa: có ${count} hồ sơ đang dùng ngành này.` });

    const { error } = await sb.from('nganh').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true, message: 'Đã xóa ngành.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;