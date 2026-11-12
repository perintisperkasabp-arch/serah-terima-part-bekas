# Serah Terima Part Bekas

Aplikasi pencatatan serah terima part bekas: scan SPK, foto bukti langsung dari kamera, approval PIC Salvage, dan hasil tersimpan otomatis di Google Sheets (foto di Google Drive).

```
index.html            tampilan aplikasi (hosting Vercel)
api/scan.js           pembaca SPK lewat Gemini (fungsi serverless Vercel)
apps-script/Code.gs   backend: tulis ke Sheets + simpan foto ke Drive
```

## Langkah 1. Pasang backend di Google Sheets

1. Buka spreadsheet penyimpanan, lalu **Extensions → Apps Script**.
2. Hapus isi default, tempel seluruh isi `apps-script/Code.gs`, lalu **Save**.
3. Buka **Project Settings (ikon roda gigi) → Script Properties → Add script property**:
   - Property: `APP_CODE`
   - Value: kode akses pilihan Anda (misalnya 8–12 karakter acak). Kode ini dibagikan ke teknisi dan PIC.
4. Di editor, pilih fungsi **`setup`** lalu tekan **Run**. Setujui izin akses Sheets dan Drive. Langkah ini mengisi baris judul kolom dan membuat folder "Foto Part Bekas" di Drive Anda.
5. **Deploy → New deployment → jenis Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Salin **Web app URL** yang muncul.

> Setiap mengubah `Code.gs` di kemudian hari, lakukan **Deploy → Manage deployments → Edit → New version**, supaya perubahan berlaku.

## Langkah 2. Isi URL di aplikasi

Buka `index.html`, cari baris `const GAS_URL = "PASTE_URL_WEB_APP_DI_SINI";` lalu ganti dengan URL dari langkah 1.

## Langkah 3. Unggah ke GitHub

1. Buat repository baru di GitHub. **Pilih Private.**
2. Unggah seluruh isi folder ini (`index.html`, folder `api`, folder `apps-script`, `README.md`).

## Langkah 4. Deploy di Vercel

1. Di vercel.com pilih **Add New → Project**, lalu impor repository tadi.
2. Sebelum menekan Deploy, buka **Environment Variables** dan isi:
   - `APP_CODE` = kode akses yang sama dengan langkah 1
   - `GEMINI_API_KEY` = API key dari Google AI Studio (aistudio.google.com → Get API key)
   - `GEMINI_MODEL` = (opsional) bila scan gagal karena nama model sudah tidak berlaku, isi dengan model Flash terbaru yang tertera di dokumentasi Gemini API
3. Tekan **Deploy**. Buka link yang diberikan Vercel dari HP, lalu izinkan akses kamera.

## Cara pakai

1. **Serah (Teknisi):** foto SPK, periksa hasilnya, centang part yang ada, foto tiap part, isi nama teknisi, lalu kirim.
2. **Terima (Salvage):** pilih SPK yang menunggu, cocokkan part dan foto, centang semuanya, isi nama PIC, lalu Approve. Status berubah menjadi "Part Komplit".
3. **Riwayat:** daftar semua serah terima dan foto-fotonya. Spreadsheet itu sendiri adalah rekap lengkapnya (kolom Foto berisi tautan ke Drive).

## Catatan penting

- **Keamanan:** siapa pun yang memegang kode akses bisa memakai aplikasi. Jangan taruh kode akses di file mana pun. Ganti `APP_CODE` di Apps Script dan Vercel kalau perlu mencabut akses.
- **Jangan** mengurutkan ulang, menyisipkan, atau mengubah kolom A (ID) di spreadsheet. Kolom A dipakai untuk mencari baris yang harus diperbarui.
- **Gemini tier gratis:** ada batas pemakaian per menit dan per hari, dan Google dapat memakai data tier gratis untuk memperbaiki produknya. SPK dan nomor polisi ikut terkirim ke Google saat scan. Kalau tidak diinginkan, kosongkan `GEMINI_API_KEY` dan isi data SPK secara manual.
- **Foto** disimpan di folder Drive milik akun yang memasang Apps Script, dan tidak dibuka untuk umum.
