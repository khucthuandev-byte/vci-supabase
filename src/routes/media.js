const express = require('express');
const router  = express.Router();
const { getSupabase } = require('../config/supabase');
const { protect, role } = require('../middleware/auth');

const BUCKET = 'vci-media';

// GET /api/media  — admin, list files
router.get('/', protect, role('admin'), async (req, res) => {
  try {
    const { data, error } = await getSupabase().storage.from(BUCKET).list('', {
      limit: 200, offset: 0, sortBy: { column: 'created_at', order: 'desc' }
    });
    if (error) throw error;

    const baseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
    const files = (data || [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => ({
        name: f.name,
        size: f.metadata?.size,
        mimetype: f.metadata?.mimetype,
        created_at: f.created_at,
        url: baseUrl + f.name,
      }));
    res.json({ success: true, data: files });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/media/upload  — admin, nhận base64
router.post('/upload', protect, role('admin'), async (req, res) => {
  try {
    const { filename, base64, mimetype } = req.body;
    if (!filename || !base64) return res.status(400).json({ success: false, message: 'Thiếu filename hoặc base64.' });

    const ALLOWED_TYPES = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','video/mp4','application/pdf'];
    const mt = mimetype || 'application/octet-stream';
    if (!ALLOWED_TYPES.includes(mt)) return res.status(400).json({ success: false, message: 'Loại file không được phép.' });

    const buf = Buffer.from(base64, 'base64');
    if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ success: false, message: 'File quá 5MB.' });

    const safeName = Date.now() + '-' + filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    const { error } = await getSupabase().storage.from(BUCKET).upload(safeName, buf, {
      contentType: mt,
      upsert: false,
    });
    if (error) throw error;

    const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${safeName}`;
    res.status(201).json({ success: true, url, name: safeName });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/media/:filename  — admin
router.delete('/:filename', protect, role('admin'), async (req, res) => {
  try {
    const { error } = await getSupabase().storage.from(BUCKET).remove([req.params.filename]);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa file.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
