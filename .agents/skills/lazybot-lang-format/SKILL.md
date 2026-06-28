---
name: lazybot-lang-format
description: Aturan formatting file bahasa (lang/*.json) di LazyBot, aktif saat agen mengedit atau membuat terjemahan pesan
---

# Panduan Formatting Pesan (Language Files) LazyBot

Saat Anda mengedit atau membuat file bahasa (`lang/*.json`) di dalam plugin LazyBot, Anda **WAJIB** mengikuti standar format berikut agar tampilan bot tetap konsisten:

1. **Gunakan Header, Tanpa Penutup**: 
   - Anda disarankan menggunakan header untuk mempertegas pesan (contoh: `┌ *INFO*`).
   - Namun, **DILARANG** menggunakan karakter penutup (seperti `└`) di akhir pesan. Jangan juga berikan baris baru (`\n`) ekstra di bagian akhir pesan.

2. **Aturan Penggunaan Awalan (` › `)**:
   - **DILARANG** menggunakan awalan ` › ` untuk pesan teks biasa atau pesan satu baris.
   - Awalan ` › ` **HANYA** diperbolehkan untuk item dalam struktur **Daftar/List** yang berjumlah lebih dari satu.

### Contoh Format yang BENAR

**Pesan Teks Biasa / Satu Baris:**
```json
{
  "success": "┌ *BERHASIL*\nData telah berhasil disimpan ke dalam database."
}
```

**Pesan Bentuk Daftar (List):**
```json
{
  "menu": "┌ *DAFTAR PERINTAH*\n › !help - Bantuan\n › !ping - Cek status\n › !add - Tambah member"
}
```

### Contoh Format yang SALAH (Jangan Lakukan Ini)

**SALAH - Memakai penutup `└`:**
```json
{
  "success": "┌ *BERHASIL*\nData telah berhasil disimpan.\n└"
}
```

**SALAH - Memakai ` › ` untuk teks biasa (bukan list):**
```json
{
  "success": "┌ *BERHASIL*\n › Data telah berhasil disimpan ke dalam database."
}
```
