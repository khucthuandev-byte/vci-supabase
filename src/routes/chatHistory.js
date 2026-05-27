const express = require('express');
const router  = express.Router();
const { getSupabase } = require('../config/supabase');
const { protect, role } = require('../middleware/auth');

router.use(protect, role('admin'));

// GET /api/chat-history  — paginated, filter by date
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    let query = getSupabase()
      .from('chat_history')
      .select('id,session_id,visitor_ip,created_at,messages', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (req.query.from_date) query = query.gte('created_at', req.query.from_date);
    if (req.query.to_date)   query = query.lte('created_at', req.query.to_date + 'T23:59:59Z');

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, total: count, page, pages: Math.ceil(count / limit), data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/chat-history/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await getSupabase().from('chat_history').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa log.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
