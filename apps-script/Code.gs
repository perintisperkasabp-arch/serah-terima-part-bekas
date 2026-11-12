/**
 * Backend Serah Terima Part Bekas.
 * Pasang di spreadsheet: Extensions > Apps Script. Lihat README.md.
 * Script Property wajib: APP_CODE (kode akses aplikasi).
 */
const SHEET_NAME = "Sheet1";
const FOLDER_NAME = "Foto Part Bekas";
const HEADERS = ["ID", "No SPK", "No Polisi", "Teknisi", "Waktu Serah", "Part", "Qty", "Dicek", "Status", "PIC Salvage", "Waktu Terima", "Foto"];
const ST_W = "Menunggu approval PIC Salvage";
const ST_K = "Part Komplit";

// Jalankan SEKALI dari editor untuk memberi izin dan menyiapkan judul kolom.
function setup() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  sh.setFrozenRows(1);
  folder_();
}

function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return out_({ ok: true, info: "Serah Terima Part Bekas API" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const q = JSON.parse(e.postData.contents);
    const code = PropertiesService.getScriptProperties().getProperty("APP_CODE");
    if (!code || q.code !== code) return out_({ ok: false, err: "Kode akses salah" });
    lock.waitLock(20000);
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    if (q.a === "list") return out_({ ok: true, rows: list_(sh) });
    if (q.a === "add") return out_(add_(sh, q));
    if (q.a === "approve") return out_(approve_(sh, q));
    if (q.a === "foto") return out_(foto_(q));
    return out_({ ok: false, err: "Aksi tidak dikenal" });
  } catch (err) {
    return out_({ ok: false, err: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function list_(sh) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, HEADERS.length).getDisplayValues();
}

function idRows_(sh, id) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  const col = sh.getRange(2, 1, n - 1, 1).getValues();
  const rows = [];
  col.forEach((c, i) => { if (String(c[0]) === id) rows.push(i + 2); });
  return rows;
}

function add_(sh, q) {
  if (!q.id || !q.spk || !q.teknisi || !q.parts || !q.parts.length) return { ok: false, err: "Data tidak lengkap" };
  if (idRows_(sh, q.id).length) return { ok: true, dup: true };
  const fld = folder_();
  const rows = q.parts.map((p, i) => {
    let url = "";
    if (p.img) {
      const b64 = String(p.img).split(",")[1];
      const blob = Utilities.newBlob(Utilities.base64Decode(b64), "image/jpeg", q.spk + "_" + q.id + "_Part" + (i + 1) + ".jpg");
      url = fld.createFile(blob).getUrl();
    }
    return [q.id, q.spk, q.nopol || "", q.teknisi, q.waktu, "Part " + (i + 1), String(p.q || 1), p.ok ? "Ya" : "Tidak", ST_W, "", "", url];
  });
  const start = sh.getLastRow() + 1;
  const rng = sh.getRange(start, 1, rows.length, HEADERS.length);
  rng.setNumberFormat("@");
  rng.setValues(rows);
  return { ok: true };
}

function approve_(sh, q) {
  const rows = idRows_(sh, q.id);
  if (!rows.length) return { ok: false, err: "Data SPK tidak ditemukan di spreadsheet" };
  if (!q.pic) return { ok: false, err: "Nama PIC wajib diisi" };
  rows.forEach((r, i) => {
    const rng = sh.getRange(r, 8, 1, 4);
    rng.setNumberFormat("@");
    rng.setValues([[q.ok && q.ok[i] === false ? "Tidak" : "Ya", ST_K, q.pic, q.waktu]]);
  });
  return { ok: true };
}

function foto_(q) {
  const m = String(q.url || "").match(/[-\w]{25,}/);
  if (!m) return { ok: false, err: "Tautan foto tidak valid" };
  const blob = DriveApp.getFileById(m[0]).getBlob();
  return { ok: true, img: "data:image/jpeg;base64," + Utilities.base64Encode(blob.getBytes()) };
}
