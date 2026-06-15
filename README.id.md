# Lazy Bot

> Framework bot WhatsApp berskala enterprise berbasis [Baileys](https://github.com/WhiskeySockets/Baileys), dilengkapi dengan Arsitektur Plugin modular dan CLI (Command Line Interface) yang tangguh.

[Read in English (Baca dalam Bahasa Inggris) 🇬🇧](./README.md)

## ✨ Fitur Unggulan

- **Arsitektur Plugin Modular:** Bangun fitur dalam *namespace* yang terisolasi (contoh: `@admin/leveling`). Nyalakan, matikan, atau copot fitur tanpa perlu memodifikasi sistem *core*.
- **CLI Terintegrasi (Developer Experience):** Ucapkan selamat tinggal pada kode *boilerplate*. Gunakan perintah ala Laravel:
  - `make:plugin` - Membuat struktur dasar plugin baru.
  - `make:command` & `make:event` - Membuat interaksi dan respon bot.
  - `plugin:install` - Mengunduh plugin langsung dari *registry* resmi.
  - `plugin:migrate` - Menjalankan migrasi database khusus untuk plugin Anda.
- **Hot-Reloading:** Dilengkapi *Plugin Watcher* yang secara otomatis me-*reload* kode saat Anda menyimpan file (*save*). Mengembangkan bot kini tak perlu *restart* bolak-balik!
- **Migrasi Database Terisolasi:** Terintegrasi dengan Knex.js. Setiap plugin mengurus tabel databasenya masing-masing.
- **Dukungan Multi-bahasa (i18n):** Dukungan lokalisasi bawaan untuk balasan bot maupun *output* di terminal CLI.
- **Middleware & Security:** Lapisan keamanan *built-in* untuk proteksi spam, pengecekan admin grup, limitasi penggunaan, dan lainnya.

## 🚀 Memulai (Getting Started)

### Persyaratan Sistem
- Node.js (v18 atau lebih baru)
- Database yang berjalan (MySQL, PostgreSQL, SQLite, dll yang didukung Knex.js)

### Instalasi

1. Clone repositori:
   ```bash
   git clone https://github.com/your-username/lazy-bot.git
   cd lazy-bot
   ```
2. Install dependensi NPM:
   ```bash
   npm install
   ```
3. Atur environment:
   ```bash
   cp .env.example .env
   # Edit .env dengan kredensial database dan konfigurasi bot Anda
   ```
4. Jalankan bot:
   ```bash
   npm start
   ```

## 🛠️ Penggunaan CLI

Lazy Bot dilengkapi dengan sistem CLI interaktif. Cukup jalankan:
```bash
npm run cli
```
Atau eksekusi perintah secara langsung:
```bash
npm run cli -- make:plugin
npm run cli -- make:migration
npm run cli -- plugin:install @community/sticker-maker
npm run cli -- plugin:migrate
```

## 📦 Cara Membuat Plugin

Selama masa *development*, plugin akan disimpan di dalam direktori `workspace/`.

1. Generate plugin baru:
   ```bash
   npm run cli -- make:plugin
   ```
2. Buat *command* (perintah) di dalam plugin tersebut:
   ```bash
   npm run cli -- make:command
   ```
3. Ubah kode dan simpan. Perubahan Anda akan otomatis diaplikasikan seketika berkat sistem *hot-reloading* tanpa perlu me-*restart* bot!

## 🤝 Berkontribusi
Kontribusi Anda sangat membantu ekosistem *open-source* bot Indonesia ini menjadi lebih baik. Segala bentuk masukan dan *Pull Request* sangat kami **hargai**.

## 📜 Lisensi
Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.
