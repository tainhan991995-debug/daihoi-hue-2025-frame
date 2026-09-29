// Chạy setup một lần trong tài khoản Google sở hữu dữ liệu.
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FOLDER_ID')) {
    props.setProperty('FOLDER_ID', DriveApp.getFolderById('1HwKd7CDUA3E9WOGgGYzLtFuNQBgjbogl').getId());
  }
  if (!props.getProperty('SHEET_ID')) {
    const book = SpreadsheetApp.create('Lượt tải lời nhắn - Đại hội Huế');
    book.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
    const sheet = book.getSheets()[0];
    sheet.setName('LuotTai');
    sheet.appendRow(['Mã lượt tải', 'Thời gian lưu', 'Họ tên', 'Chức vụ - Đơn vị', 'Lời nhắn', 'Link ảnh', 'Tên file']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:G1').setFontWeight('bold').setBackground('#d9ead3');
    props.setProperty('SHEET_ID', book.getId());
  }
  if (!props.getProperty('UPLOAD_SECRET')) props.setProperty('UPLOAD_SECRET', Utilities.getUuid() + Utilities.getUuid());
  console.log('Sheet: ' + SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getUrl());
  console.log('Thư mục: ' + DriveApp.getFolderById(props.getProperty('FOLDER_ID')).getUrl());
  // Xem UPLOAD_SECRET trong Project Settings > Script Properties; không đăng công khai.
}

function doPost(e) {
  const output = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || e.postData.contents.length > 4250000) throw new Error('Invalid request');
    const data = JSON.parse(e.postData.contents);
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('UPLOAD_SECRET') || data.secret !== props.getProperty('UPLOAD_SECRET')) throw new Error('Unauthorized');
    if (!/^[a-f0-9-]{36}$/i.test(data.id) || typeof data.base64 !== 'string') throw new Error('Invalid data');
    ['name', 'roleUnit', 'message'].forEach((key, index) => {
      if (typeof data[key] !== 'string' || data[key].length > [200, 300, 500][index]) throw new Error('Invalid text');
    });
    const bytes = Utilities.base64Decode(data.base64);
    if (bytes.length < 3 || bytes.length > 3 * 1024 * 1024 || (bytes[0] & 255) !== 255 || (bytes[1] & 255) !== 216 || (bytes[2] & 255) !== 255) throw new Error('Invalid image');
    lock.waitLock(20000);
    const sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheetByName('LuotTai');
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext()) return output({ ok: true });
    const folder = DriveApp.getFolderById(props.getProperty('FOLDER_ID'));
    const filename = data.id + '.jpg';
    // Reuse file if a previous attempt saved the photo but failed before writing the row.
    const matches = folder.getFilesByName(filename);
    const file = matches.hasNext() ? matches.next() : folder.createFile(Utilities.newBlob(bytes, 'image/jpeg', filename));
    const safeText = value => /^[=+\-@\t\r\n]/.test(value) ? "'" + value : value;
    sheet.appendRow([data.id, new Date(), safeText(data.name), safeText(data.roleUnit), safeText(data.message), file.getUrl(), filename]);
    SpreadsheetApp.flush();
    return output({ ok: true });
  } catch (error) {
    console.error(String(error));
    return output({ ok: false });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
