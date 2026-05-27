const express = require('express');
const router  = express.Router();
const { getSupabase } = require('../config/supabase');
const { protect, role } = require('../middleware/auth');

// GET /api/banners  — public, chỉ active
router.get('/', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/banners/all  — admin, tất cả
router.get('/all', protect, role('admin'), async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/banners  — admin
router.post('/', protect, role('admin'), async (req, res) => {
  try {
    const { title, subtitle, image_url, link_url, btn_text, active, sort_order } = req.body;
    const { data, error } = await getSupabase()
      .from('banners')
      .insert({ title, subtitle, image_url, link_url, btn_text, active, sort_order })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/banners/:id  — admin
router.put('/:id', protect, role('admin'), async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('banners')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/banners/:id  — admin
router.delete('/:id', protect, role('admin'), async (req, res) => {
  try {
    const { error } = await getSupabase().from('banners').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa banner.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
