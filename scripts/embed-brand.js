/**
 * Script embed brand assets vào HTML files
 * Chạy: node scripts/embed-brand.js
 */
const fs   = require('fs');
const path = require('path');

const BRAND_DIR = 'L:/My Drive/VCI CAN THO/KHOA CNTT VÀ TRÍ TUỆ NHÂN TẠO/2. QUẢN LÝ WEB/Banner';

const logoB64 = 'data:image/png;base64,' +
  fs.readFileSync(path.join(BRAND_DIR, 'logo.png')).toString('base64');

const gifB64  = 'data:image/gif;base64,' +
  fs.readFileSync(path.join(BRAND_DIR, 'bn-tuyen-sinh.gif')).toString('base64');

// ---- Cập nhật public site ----
let pub = fs.readFileSync('vci-v2-premium.html', 'utf8');

// Thay logo navbar (src="data:image/jpeg;base64,..." → logo.png thực)
pub = pub.replace(
  /src="data:image\/jpeg;base64,[^"]+"/g,
  `src="${logoB64}"`
);

// Thay hero background → GIF tuyển sinh
pub = pub.replace(
  /bgEl\.style\.backgroundImage\s*=\s*`url\('https:\/\/images\.unsplash[^`]+`/,
  `bgEl.style.backgroundImage = \`url('${gifB64}')\``
);

// Thay default fallback ảnh hero → GIF
pub = pub.replace(
  /bgEl\.style\.backgroundImage\s*=\s*`url\('https:\/\/images\.unsplash\.com\/photo-1523050854058[^`]+`/,
  `bgEl.style.backgroundImage = \`url('${gifB64}')\``
);

fs.writeFileSync('vci-v2-premium.html', pub);
console.log('✅ vci-v2-premium.html updated');

// ---- Cập nhật admin ----
let adm = fs.readFileSync('vci-admin-railway.html', 'utf8');

adm = adm.replace(
  /src="data:image\/jpeg;base64,[^"]+"/g,
  `src="${logoB64}"`
);

fs.writeFileSync('vci-admin-railway.html', adm);
console.log('✅ vci-admin-railway.html updated');
console.log('Done!');
