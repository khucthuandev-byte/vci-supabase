const express = require('express');
const router  = express.Router();
const { getSupabase } = require('../config/supabase');
const { protect, role } = require('../middleware/auth');

// GET /api/settings  — admin, trả về tất cả settings
router.get('/', protect, role('admin'), async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('system_settings').select('*');
    if (error) throw error;
    const map = {};
    (data || []).forEach(row => { map[row.key] = row.value; });
    res.json({ success: true, data: map });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/settings/:key  — maintenance key là public; các key khác cần admin
router.get('/:key', async (req, res) => {
  const isPublicKey = req.params.key === 'maintenance';
  if (!isPublicKey) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Không có token.' });
  }
  try {
    const { data, error } = await getSupabase()
      .from('system_settings')
      .select('value')
      .eq('key', req.params.key)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ success: false, message: 'Không tìm thấy key.' });
    res.json({ success: true, key: req.params.key, value: data.value });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/settings/:key  — admin
router.put('/:key', protect, role('admin'), async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('system_settings')
      .upsert({ key: req.params.key, value: req.body })
      .select('key,value,updated_at')
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
