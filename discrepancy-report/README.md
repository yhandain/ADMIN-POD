# Delivery Discrepancy Report

Aplikasi web PC untuk membuat & mencetak *Delivery Discrepancy Report* (A4 landscape).

- Ketik NO. DN / PO → data terisi otomatis dari Rekap Berita Acara (Supabase).
- Product Price otomatis dari klaim inv (nomor OBD = DN).
- Remark otomatis dikategorikan ke Reason Code A–H dari "Remark in BA".
- **Save** per DN (tersimpan di Supabase), **Print**, **Export** Excel (.xlsx A4) / PDF.
- **Import** Excel: file Berita Acara (sheet `Rekap berita acara`) atau file klaim inv.

Deploy: Cloudflare Pages → root/build output directory `discrepancy-report`, tanpa build command.

Develop Program By Yohanda IN
