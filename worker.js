// Delivery Discrepancy Report — Worker: static assets + /api/ai (Workers AI)
// Develop Program By Yohanda IN
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const FIELDS = `- dn: nomor DN / DN Refferance / No DO / OBD / Externorderkey / No PO (biasanya 10 digit, diawali 619)
- distributor: Distributor / Customer / Company / Toko tujuan
- carrier: Carrieragent / Transporter / Ekspedisi / Vendor angkutan
- driver: nama sopir / Driver / Drivername
- vessel: nomor polisi truk / Truck No / Vessel / No container
- nart: kode produk / NART / SKU / Product Code (format seperti 82886-04800-64)
- description: nama barang / Item Description
- dispatch_date: tanggal kirim / Dispatch Date
- qty_kar: jumlah karton / Qty in Kar / CTN / Qty
- remark_ba: keterangan masalah / Remark / Kondisi (misal kurang kirim, pecah, basah)`;

const PROMPTS = {
  map: s => [
    { role: 'system', content: `Kamu asisten data gudang. Tugasmu memetakan kolom spreadsheet ke field standar Rekap Berita Acara.\nField:\n${FIELDS}\nBalas HANYA JSON valid tanpa penjelasan, format: {"header_row": <index baris header di sampel, 0-based, -1 jika tidak ada header>, "map": {"dn": <index kolom 0-based atau null>, "distributor": ..., "carrier": ..., "driver": ..., "vessel": ..., "nart": ..., "description": ..., "dispatch_date": ..., "qty_kar": ..., "remark_ba": ...}}` },
    { role: 'user', content: 'Sampel baris (array JSON, tiap baris array sel):\n' + JSON.stringify(s.sample).slice(0, 12000) },
  ],
  extract: s => [
    { role: 'system', content: `Kamu asisten data gudang. Ambil semua data berita acara pengiriman dari teks berantakan dan susun per SKU.\nField:\n${FIELDS}\nAturan: satu objek per SKU; ulangi dn/distributor/driver/vessel untuk tiap SKU di DN yang sama; tanggal format YYYY-MM-DD; field yang tidak ada isi "". Jangan mengarang data.\nBalas HANYA JSON valid tanpa penjelasan: {"rows":[{"dn":"","distributor":"","carrier":"","driver":"","vessel":"","nart":"","description":"","dispatch_date":"","qty_kar":"","remark_ba":""}]}` },
    { role: 'user', content: String(s.text || '').slice(0, 15000) },
  ],
};

function parseJson(out){
  if (out && typeof out === 'object' && !('response' in out)) return out;
  let t = out && typeof out.response === 'object' ? JSON.stringify(out.response) : String(out?.response ?? out ?? '');
  t = t.replace(/```json|```/g, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('AI tidak mengembalikan JSON');
  return JSON.parse(t.slice(a, b + 1));
}
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    if (url.pathname === '/api/ai') {
      if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
      if (!env.AI) return json({ error: 'Workers AI belum aktif (binding AI tidak ditemukan)' }, 500);
      try {
        const body = await req.json(), build = PROMPTS[body.task];
        if (!build) return json({ error: 'task tidak dikenal' }, 400);
        const out = await env.AI.run(MODEL, { messages: build(body), max_tokens: body.task === 'map' ? 400 : 6000, temperature: 0 });
        return json(parseJson(out));
      } catch (e) { return json({ error: 'AI error: ' + (e.message || e) }, 500); }
    }
    return env.ASSETS.fetch(req);
  },
};
