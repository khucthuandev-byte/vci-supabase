const { google } = require('googleapis');

const SHEET_TAB = 'HoSo';
const HEADERS   = ['STT','Họ tên','SĐT','Email','Năm sinh','Hệ đào tạo','Ngành','Cơ sở','Địa chỉ','Trạng thái','Tư vấn viên','Nguồn','Ngày đăng ký','Ghi chú'];

function auth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_EMAIL,
    key:   (process.env.GOOGLE_PRIVATE_KEY||'').replace(/\\n/g,'\n'),
    scopes:['https://www.googleapis.com/auth/spreadsheets'],
  });
}
function sheets() { return google.sheets({ version:'v4', auth: auth() }); }
const SID = () => process.env.GOOGLE_SHEET_ID;

function toRow(r, idx='') {
  return [idx, r.name||'', r.phone||'', r.email||'', r.dob||'',
    r.he_dao_tao||'', r.nganh||'', r.coso||'', r.address||'', r.status||'',
    r.tu_van_vien?.name||'', r.source||'website',
    r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '',
    r.note||''];
}

exports.appendRow = async (r) => {
  if (!SID() || !process.env.GOOGLE_SERVICE_EMAIL) return;
  const sh = sheets();
  const res = await sh.spreadsheets.values.get({ spreadsheetId:SID(), range:`${SHEET_TAB}!A:A` });
  const rowCount = (res.data.values||[]).length;
  if (rowCount === 0) {
    await sh.spreadsheets.values.update({ spreadsheetId:SID(), range:`${SHEET_TAB}!A1`,
      valueInputOption:'RAW', requestBody:{ values:[HEADERS] } });
  }
  await sh.spreadsheets.values.append({ spreadsheetId:SID(), range:`${SHEET_TAB}!A1`,
    valueInputOption:'USER_ENTERED', insertDataOption:'INSERT_ROWS',
    requestBody:{ values:[toRow(r, rowCount)] } });
};

exports.updateRow = async (r) => {
  if (!SID()) return;
  const sh = sheets();
  const res = await sh.spreadsheets.values.get({ spreadsheetId:SID(), range:`${SHEET_TAB}!C:C` });
  const rows = res.data.values||[];
  const idx  = rows.findIndex(row => row[0]===r.phone);
  if (idx < 0) return exports.appendRow(r);
  await sh.spreadsheets.values.update({ spreadsheetId:SID(), range:`${SHEET_TAB}!A${idx+1}`,
    valueInputOption:'USER_ENTERED', requestBody:{ values:[toRow(r, idx)] } });
};

exports.syncAll = async (all) => {
  if (!SID()) throw new Error('GOOGLE_SHEET_ID chưa cấu hình.');
  const sh = sheets();
  await sh.spreadsheets.values.clear({ spreadsheetId:SID(), range:`${SHEET_TAB}!A:Z` });
  await sh.spreadsheets.values.update({ spreadsheetId:SID(), range:`${SHEET_TAB}!A1`,
    valueInputOption:'USER_ENTERED',
    requestBody:{ values:[HEADERS, ...all.map((r,i)=>toRow(r,i+1))] } });
};
