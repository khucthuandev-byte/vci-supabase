const express = require('express');
const router  = express.Router();
const { getSupabase }      = require('../config/supabase');
const { protect, role }    = require('../middleware/auth');

router.use(protect);
router.get('/', async (req, res) => {
  const { data, error } = await getSupabase().from('nganh').select('*').order('name');
  if (error) return res.status(500).json({ success:false, message:error.message });
  res.json({ success:true, data });
});
router.post('/', role('admin'), async (req, res) => {
  const { data, error } = await getSupabase().from('nganh').insert(req.body).select().single();
  if (error) return res.status(500).json({ success:false, message:error.message });
  res.status(201).json({ success:true, data });
});
router.put('/:id', role('admin'), async (req, res) => {
  const { data, error } = await getSupabase().from('nganh').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success:false, message:error.message });
  res.json({ success:true, data });
});
router.delete('/:id', role('admin'), async (req, res) => {
  const { error } = await getSupabase().from('nganh').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success:false, message:error.message });
  res.json({ success:true, message:'Đã xóa ngành.' });
});
module.exports = router;
