const express = require('express');
const router  = express.Router();
const { getSupabase }   = require('../config/supabase');
const { protect, perm } = require('../middleware/auth');

router.use(protect, perm('baoCao'));

const _cache = {};
const CACHE_TTL = 60_000;
const getCached = (k) => { const e = _cache[k]; return (e && Date.now() - e.at < CACHE_TTL) ? e.data : null; };
const setCache  = (k, d) => { _cache[k] = { data: d, at: Date.now() }; };

router.get('/summary', async (req, res) => {
  const cached = getCached('summary');
  if (cached) return res.json({ success: true, cached: true, data: cached });

  try {
    const sb = getSupabase();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate()-7); weekStart.setHours(0,0,0,0);

    const [total, todayCount, weekCount, allRows] = await Promise.all([
      sb.from('ho_so').select('id', { count: 'exact', head: true }),
      sb.from('ho_so').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      sb.from('ho_so').select('id', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
      sb.from('ho_so').select('status,he_dao_tao,coso'),
    ]);

    const group = (key) => (allRows.data || []).reduce((acc, r) => {
      const v = r[key] || 'Khác'; acc[v] = (acc[v] || 0) + 1; return acc;
    }, {});

    const data = {
      total:    total.count,
      today:    todayCount.count || 0,
      week:     weekCount.count  || 0,
      byStatus: group('status'),
      byHe:     group('he_dao_tao'),
      byCoso:   group('coso'),
    };

    setCache('summary', data);
    return res.json({ success: true, cached: false, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/nganh', async (req, res) => {
  const cached = getCached('nganh');
  if (cached) return res.json({ success: true, cached: true, data: cached });

  try {
    const { data, error } = await getSupabase().from('ho_so').select('nganh');
    if (error) throw error;

    const counts = data.reduce((acc, r) => { if (r.nganh) { acc[r.nganh] = (acc[r.nganh] || 0) + 1; } return acc; }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    setCache('nganh', sorted);
    return res.json({ success: true, cached: false, data: sorted });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
