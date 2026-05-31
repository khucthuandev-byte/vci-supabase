const express = require('express');
const router  = express.Router();
const { getSupabase } = require('../config/supabase');
const { protect, role } = require('../middleware/auth');

function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// GET /api/articles  — public, chỉ published
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    const { data, error, count } = await getSupabase()
      .from('articles')
      .select('id,title,slug,excerpt,cover_url,meta_title,published,created_at', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    res.json({ success: true, total: count, page, pages: Math.ceil(count / limit), data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/articles/admin/all  — admin (phải đứng trước /:slug)
router.get('/admin/all', protect, role('admin'), async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const from  = (page - 1) * limit;
    const to    = from + limit - 1;

    const { data, error, count } = await getSupabase()
      .from('articles')
      .select('id,title,slug,excerpt,cover_url,published,created_at,updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    res.json({ success: true, total: count, page, pages: Math.ceil(count / limit), data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/articles/admin/:id  — admin, single by id (phải đứng trước /:slug)
router.get('/admin/:id', protect, role('admin'), async (req, res) => {
  try {
    const { data, error } = await getSupabase().from('articles').select('*').eq('id', req.params.id).maybeSingle();
    if (error || !data) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/articles/:slug  — public, single bài
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('articles')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('published', true)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/articles  — admin
router.post('/', protect, role('admin'), async (req, res) => {
  try {
    const { title, excerpt, content, cover_url, meta_title, meta_desc, schema_json, published } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Tiêu đề không được để trống.' });

    let slug = slugify(title);
    const { data: existing } = await getSupabase().from('articles').select('id').eq('slug', slug).maybeSingle();
    if (existing) slug = slug + '-' + Date.now();

    const { data, error } = await getSupabase()
      .from('articles')
      .insert({ title, slug, excerpt, content, cover_url, meta_title, meta_desc, schema_json, published: !!published, created_by: req.user.id })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/articles/:id  — admin
router.put('/:id', protect, role('admin'), async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('articles')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/articles/:id  — admin
router.delete('/:id', protect, role('admin'), async (req, res) => {
  try {
    const { error } = await getSupabase().from('articles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa bài viết.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
