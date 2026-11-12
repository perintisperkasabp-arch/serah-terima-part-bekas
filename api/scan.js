// Vercel serverless function: baca foto SPK lewat Gemini API (tier gratis Google AI Studio).
// Environment variables: APP_CODE, GEMINI_API_KEY, (opsional) GEMINI_MODEL.
const PROMPT =
  'Baca foto SPK (Surat Perintah Kerja) bengkel ini. Ambil nomor SPK, nomor polisi kendaraan, ' +
  'dan SEMUA part/bagian yang diganti beserta jumlahnya (jumlah 1 jika tidak tertulis). ' +
  'Balas HANYA JSON: {"spk":"","nopol":"","parts":[{"n":"nama part","q":1}]}. Kosongkan nilai yang tidak terbaca.';

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method tidak diizinkan" });
  if (!process.env.APP_CODE || req.headers["x-app-code"] !== process.env.APP_CODE)
    return res.status(401).json({ error: "Kode akses salah" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY belum diisi di Vercel" });

  const image = req.body && req.body.image;
  if (!image || typeof image !== "string") return res.status(400).json({ error: "Gambar tidak ada" });

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: "image/jpeg", data: image } }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      const code = r.status === 429 ? "Batas pemakaian gratis tercapai, coba lagi nanti atau isi manual" : "Gemini error " + r.status;
      return res.status(502).json({ error: code, detail: j.error && j.error.message });
    }
    const text = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts[0].text;
    const data = JSON.parse(String(text).replace(/```json|```/g, "").trim());
    return res.status(200).json({
      spk: String(data.spk || ""),
      nopol: String(data.nopol || ""),
      parts: Array.isArray(data.parts) ? data.parts : [],
    });
  } catch (e) {
    return res.status(500).json({ error: "Gagal membaca SPK: " + e.message });
  }
};
