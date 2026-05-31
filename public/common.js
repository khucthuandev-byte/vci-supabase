/* ==========================================================
   VCI COMMON.JS  —  Shared utilities cho index.html & admin.html
   Load trước tất cả script khác bằng: <script src="common.js"></script>
========================================================== */

/* ── API BASE URL ─────────────────────────────────────── */
const RAILWAY_URL = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://vci-supabase-production.up.railway.app';

/* ── DANH SÁCH CƠ SỞ (nguồn dữ liệu chuẩn) ────────────
   Dùng value này ở CẢ 2 file để đảm bảo nhất quán.
   Khi thêm cơ sở mới chỉ cần sửa ở đây.
─────────────────────────────────────────────────────── */
const COSO_LIST = [
  { value: 'Cần Thơ',        label: '🌊 Cần Thơ' },
  { value: 'TP. Hồ Chí Minh',label: '🏙️ TP. Hồ Chí Minh' },
  { value: 'Hà Nội',         label: '🏛️ Hà Nội' },
  { value: 'Đắk Lắk',        label: '☕ Đắk Lắk' },
  { value: 'Thái Nguyên',    label: '🍵 Thái Nguyên' },
];

/* Tạo <option> HTML cho select cơ sở (dùng chung) */
const cosoOptions = (defaultLabel = 'Chọn cơ sở...', includeAll = false) => {
  const first = includeAll
    ? `<option value="">Tất cả cơ sở</option>`
    : `<option value="">${defaultLabel}</option>`;
  return first + COSO_LIST.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
};

/* ── STATUS MAPPING ────────────────────────────────────── */
const STATUS_VN = {
  new:        'Mới',
  contacted:  'Đang tư vấn',
  consulting: 'Tư vấn chi tiết',
  success:    'Đã nhập học',
  cancel:     'Đã hủy',
  pending:    'Đang chờ',
};

const STATUS_COLOR = {
  new:        'bdg-pending',
  contacted:  'bdg-info',
  consulting: 'bdg-info',
  success:    'bdg-active',
  cancel:     'bdg-inactive',
  pending:    'bdg-pending',
};

/* ── SOURCE ICON ───────────────────────────────────────── */
const SOURCE_ICONS = {
  website: '🌐', facebook: '📘', zalo: '💬',
  'walk-in': '🚶', phone: '📞', tiktok: '🎵',
  youtube: '▶️', referral: '👥',
};
const srcIcon = s => (SOURCE_ICONS[s] || '📌') + ' ' + (s || '');

/* ── DATE HELPERS ──────────────────────────────────────── */
const fmtDate  = d => d ? new Date(d).toLocaleDateString('vi-VN')  : '–';
const fmtDTime = d => d ? new Date(d).toLocaleString('vi-VN')      : '–';

/* ── NUMBER HELPERS ────────────────────────────────────── */
const fmtMoney = n => (n || 0).toLocaleString('vi-VN') + 'đ';
const fmtNum   = n => (n || 0).toLocaleString('vi-VN');

/* ── STRING HELPERS ────────────────────────────────────── */
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const slugify = t => t.normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9\s-]/g,'')
  .trim().replace(/\s+/g,'-').replace(/-+/g,'-');
