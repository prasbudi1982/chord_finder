// File: api/search.js
export default async function handler(req, res) {
  // Izinkan akses CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Judul lagu wajib diisi.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: `Berikan chord gitar dan lirik lengkap paling akurat untuk lagu: "${query}"` }] }],
    systemInstruction: { 
      parts: [{ text: `Anda adalah transkriptor chord gitar profesional 100% presisi. Sediakan lirik dan chord lengkap dari awal sampai akhir lagu tanpa memotong/menyingkat baris.` }] 
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          artist: { type: "STRING" },
          originalKey: { type: "STRING" },
          tempo: { type: "STRING" },
          capo: { type: "STRING" },
          chordsUsed: { type: "ARRAY", items: { type: "STRING" } },
          content: { type: "STRING" }
        },
        required: ["title", "artist", "originalKey", "tempo", "capo", "chordsUsed", "content"]
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) throw new Error("Gagal mengambil data dari Gemini.");

    return res.status(200).json(JSON.parse(rawText));
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server.' });
  }
}
