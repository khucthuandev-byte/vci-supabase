const express = require('express');
const router = express.Router();

const { body, validationResult } = require('express-validator');

const { getSupabase } = require('../config/supabase');

const { protect, perm } = require('../middleware/auth');

const sheets = require('../controllers/sheetsController');

const email = require('../controllers/emailController');


// ======================================================
// GET /api/hoso
// ADMIN / STAFF
// ======================================================
router.get(
  '/',
  protect,
  perm('hoSo'),

  async (req, res) => {

    try {

      const sb = getSupabase();

      const ALLOWED_SORT_COLS = ['created_at','updated_at','name','phone','status','coso','nganh','he_dao_tao'];
      const ALLOWED_STATUSES  = ['new','contacted','consulting','success','cancel','pending'];

      const rawSort  = req.query.sort || '-created_at';
      const sortKey  = rawSort.startsWith('-') ? rawSort.slice(1) : rawSort;
      const sort     = ALLOWED_SORT_COLS.includes(sortKey) ? rawSort : '-created_at';
      const page     = Math.max(1, Number(req.query.page)  || 1);
      const limit    = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const { status, he_dao_tao, coso, q } = req.query;

      if (status && !ALLOWED_STATUSES.includes(status))
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });

      const from = (page - 1) * limit;
      const to   = from + limit - 1;

      let query = sb
        .from('ho_so')
        .select(
          '*, tu_van_vien:users(id,name,email)',
          { count: 'exact' }
        );

      // STAFF chỉ xem cơ sở mình
      if (
        req.user.role === 'staff' &&
        req.user.coso !== 'Tất cả'
      ) {
        query = query.eq('coso', req.user.coso);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (he_dao_tao) {
        query = query.eq('he_dao_tao', he_dao_tao);
      }

      if (
        coso &&
        req.user.role === 'admin'
      ) {
        query = query.eq('coso', coso);
      }

      if (q) {
        const safe = q.replace(/[%_\\]/g, '\\$&');
        query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`);
      }

      const safeSortCol = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortAsc = !sort.startsWith('-');

      query = query.order(safeSortCol, { ascending: sortAsc }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return res.json({
        success: true,
        total: count,
        page,
        pages: Math.ceil(count / limit),
        data
      });

    } catch (err) {

      console.error('GET HOSO ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// ======================================================
// EXPORT CSV
// ADMIN / STAFF
// ======================================================
router.get(
  '/export/csv',
  protect,
  perm('hoSo'),

  async (req, res) => {

    try {

      let query = getSupabase()
        .from('ho_so')
        .select('*, tu_van_vien:users(name)')
        .order('created_at', {
          ascending: false
        });

      if (
        req.user.role === 'staff' &&
        req.user.coso !== 'Tất cả'
      ) {
        query = query.eq('coso', req.user.coso);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const headers = [
        '#',
        'Họ tên',
        'SĐT',
        'Email',
        'Hệ đào tạo',
        'Ngành',
        'Cơ sở',
        'Ngày',
        'Trạng thái',
        'Tư vấn viên'
      ];

      const rows = data.map((r, i) => [
        i + 1,
        r.name,
        r.phone,
        r.email || '',
        r.he_dao_tao,
        r.nganh || '',
        r.coso || '',
        new Date(r.created_at).toLocaleDateString('vi-VN'),
        r.status,
        r.tu_van_vien?.name || ''
      ]);

      const csv = [headers, ...rows]
        .map(r =>
          r.map(c =>
            `"${String(c).replace(/"/g, '""')}"`
          ).join(',')
        )
        .join('\n');

      res.setHeader(
        'Content-Type',
        'text/csv; charset=utf-8'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="VCI_HoSo_${Date.now()}.csv"`
      );

      return res.send('\uFEFF' + csv);

    } catch (err) {

      console.error('EXPORT CSV ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// ======================================================
// GET DETAIL
// ADMIN / STAFF
// ======================================================
router.get(
  '/:id',
  protect,
  perm('hoSo'),

  async (req, res) => {

    try {

      const { data, error } = await getSupabase()
        .from('ho_so')
        .select('*, tu_van_vien:users(id,name,email)')
        .eq('id', req.params.id)
        .single();

      if (error || !data) {

        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hồ sơ.'
        });

      }

      return res.json({
        success: true,
        data
      });

    } catch (err) {

      console.error('GET DETAIL ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// ======================================================
// CREATE HOSO
// PUBLIC
// ======================================================
router.post(
  '/',

  body('name')
    .notEmpty()
    .withMessage('Vui lòng nhập họ tên'),

  body('phone')
    .notEmpty()
    .withMessage('Vui lòng nhập số điện thoại'),

  body('he_dao_tao')
    .notEmpty()
    .withMessage('Vui lòng chọn hệ đào tạo'),

  async (req, res) => {

    const errs = validationResult(req);

    if (!errs.isEmpty()) {

      return res.status(400).json({
        success: false,
        errors: errs.array()
      });

    }

    try {

      const sb = getSupabase();

      const payload = {

        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email || null,

        dob: req.body.dob || null,
        level: req.body.level || null,
        address: req.body.address || null,

        nganh: req.body.nganh || null,

        he_dao_tao: req.body.he_dao_tao,

        coso: req.body.coso || 'Cần Thơ',

        source: req.body.source || 'website',
        note: req.body.note || null,

        status: 'new',

        history: [
          {
            action: 'Tạo hồ sơ',
            by: null,
            note: 'Sinh viên đăng ký',
            at: new Date().toISOString()
          }
        ]

      };

      const {
        data,
        error
      } = await sb
        .from('ho_so')
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Google Sheets
      sheets
        .appendRow(data)
        .then(() => {

          sb
            .from('ho_so')
            .update({
              sheet_synced: true
            })
            .eq('id', data.id);

        })
        .catch(err => {
          console.error('GOOGLE SHEET ERROR:', err.message);
        });

      // Email xác nhận
      if (data.email) {

        email
          .sendConfirmation(data)
          .catch(err => {
            console.error('EMAIL ERROR:', err.message);
          });

      }

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data
      });

    } catch (err) {

      console.error('CREATE HOSO ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// ======================================================
// UPDATE
// ADMIN / STAFF
// ======================================================
router.put(
  '/:id',
  protect,
  perm('hoSo'),

  async (req, res) => {

    try {

      const sb = getSupabase();

      const {
        data: existing,
        error: findError
      } = await sb
        .from('ho_so')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (findError || !existing) {

        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hồ sơ.'
        });

      }

      if (
        req.user.role === 'staff' &&
        req.user.coso !== 'Tất cả' &&
        existing.coso !== req.user.coso
      ) {

        return res.status(403).json({
          success: false,
          message: 'Không có quyền sửa hồ sơ này.'
        });

      }

      const {
        action,
        note,
        ...updateData
      } = req.body;

      const history = [
        ...(existing.history || [])
      ];

      history.push({
        action: action || 'Cập nhật',
        note: note || '',
        by: req.user.id,
        at: new Date().toISOString()
      });

      updateData.history = history;

      const {
        data,
        error
      } = await sb
        .from('ho_so')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      await sb
        .from('audit_logs')
        .insert({
          user_id: req.user.id,
          action: 'update_hoso',
          target: req.params.id,
          ip: req.ip
        });

      sheets
        .updateRow(data)
        .catch(console.error);

      return res.json({
        success: true,
        data
      });

    } catch (err) {

      console.error('UPDATE HOSO ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// ======================================================
// DELETE
// ADMIN ONLY
// ======================================================
router.delete(
  '/:id',
  protect,

  async (req, res) => {

    try {

      if (req.user.role !== 'admin') {

        return res.status(403).json({
          success: false,
          message: 'Chỉ Admin mới được xóa hồ sơ.'
        });

      }

      const { error } = await getSupabase()
        .from('ho_so')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        throw error;
      }

      await getSupabase()
        .from('audit_logs')
        .insert({
          user_id: req.user.id,
          action: 'delete_hoso',
          target: req.params.id,
          ip: req.ip
        });

      return res.json({
        success: true,
        message: 'Đã xóa hồ sơ.'
      });

    } catch (err) {

      console.error('DELETE HOSO ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);

module.exports = router;
