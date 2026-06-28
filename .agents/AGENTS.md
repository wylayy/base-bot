# AGENTS.md — LazyBot WhatsApp Bot (Modular Plugin System)

> Panduan arsitektur dan konvensi untuk AI/developer.
> Wajib dibaca sebelum menulis kode apapun di project ini.
> File ini berlaku untuk semua AI assistant (Claude, Gemini, GPT, dll.).

---

## Struktur Direktori

```
project/
├── core/                    # Engine utama bot (JANGAN dimodifikasi saat membuat plugin)
│   ├── lazy.js              # Entry point — compiled bot runtime
│   ├── socket/              # Koneksi WhatsApp via Baileys
│   ├── services/
│   │   ├── plugin/          # Plugin loader, watcher, schema validasi
│   │   ├── cli/             # Interactive CLI (hanya aktif saat bot berjalan)
│   │   │   └── cmd/         # Perintah CLI: make:plugin, make:command, dll.
│   │   ├── cache/           # CacheService (LRU atau Redis)
│   │   ├── database/        # Knex database (SQLite/MySQL)
│   │   ├── i18n/            # Internasionalisasi / translasi
│   │   ├── auth/            # Autentikasi ke platform cloud
│   │   └── store/           # Message batcher ke database
│   ├── utils/
│   │   ├── helpers.d.ts     # Type definitions — helper functions
│   │   ├── http.d.ts        # Type definitions — Http class
│   │   ├── converter.d.ts   # Type definitions — FFmpeg media converter
│   │   ├── storage.d.ts     # Type definitions — Storage class
│   │   ├── debug.d.ts       # Type definitions — dump() function
│   │   └── ...              # File .js compiled lainnya
│   ├── stubs/               # Template file untuk generate plugin baru
│   │   ├── command.js.stub
│   │   ├── event.js.stub
│   │   ├── middleware.js.stub
│   │   ├── migration.js.stub
│   │   ├── package.json.stub
│   │   ├── config.json.stub
│   │   └── lang.json.stub
│   └── types/
│       └── plugin.d.ts      # Type definitions — semua interface & type utama
│
├── plugins/                 # Plugin yang sudah di-publish/install
│   └── @namespace/
│       └── plugin-name/     # Struktur plugin (sama seperti workspace)
│
├── workspace/               # Area developer: plugin yang sedang dikembangkan (butuh login)
│   └── plugin-name/
│       ├── package.json     # Manifest plugin — WAJIB ada
│       ├── commands/        # File .js command
│       ├── events/          # File .js event listener
│       ├── middlewares/     # File .js middleware
│       ├── migrations/      # File .js database migration (Knex)
│       ├── configs/         # File .json konfigurasi
│       └── lang/            # File .json terjemahan
│
└── storage/                 # Data runtime (auto-generated)
    └── tmp/                 # File sementara
```

---

## Plugin System

### Aturan Nama Plugin
- Format wajib: `@namespace/plugin-name`
- Hanya huruf kecil, angka, dan tanda hubung (`-`)
- Regex: `/^@[a-z0-9_-]+\/[a-z0-9_-]+$/`
- `namespace` = username dari akun yang login

### Plugin `package.json` (Manifest)
```json
{
  "name": "@username/plugin-name",
  "type": "module",
  "version": "1.0.0",
  "description": "Deskripsi plugin",
  "author": "username",
  "keywords": [],
  "pluginDependencies": {
    "@other/plugin": "^1.0.0"
  },
  "dependencies": {}
}
```
> **Penting:** Gunakan `pluginDependencies` untuk dependensi antar plugin, bukan `dependencies`.

### Struktur Folder Plugin (Lengkap)
```
my-plugin/
├── package.json         <- WAJIB — manifest plugin
├── index.js             <- Opsional — boot file (export default function)
├── commands/            <- File .js saja (bukan .ts)
├── events/              <- File .js saja
├── middlewares/         <- File .js saja
├── migrations/          <- File .js saja
├── configs/             <- File .json saja
└── lang/                <- File .json saja
```

> Plugin ditulis dalam JavaScript (.js). Core bot sudah dalam bentuk compiled — tidak ada TypeScript source.
> Gunakan `core/types/plugin.d.ts` dan `core/utils/*.d.ts` sebagai referensi type.

---

## Membuat Komponen Plugin

### 1. Command
```js
// commands/contoh.js
import { defineCommand } from '@lazy/core/types/plugin';

export default defineCommand({
  name: 'contoh',
  description: 'Deskripsi command ini',
  aliases: ['c', 'cnt'],
  async execute({ sock, msg, db, cache, config, t, logger, plugin, getPluginMsg, setPluginMsg }) {
    await msg.reply('Halo dari plugin!');
  },
});
```

### 2. Event
```js
// events/on-message.js
import { defineEvent } from '@lazy/core/types/plugin';

export default defineEvent({
  event: 'messages.upsert',
  priority: 0,
  async execute({ sock, db, eventData, cache, config, t, logger, plugin }) {
    // eventData adalah BaileysEventMap['messages.upsert']
  },
});
```

### 3. Middleware
```js
// middlewares/auth-check.js
import { defineMiddleware } from '@lazy/core/types/plugin';

export default defineMiddleware({
  event: 'command',
  priority: -1,
  async handler({ sock, db, payload, eventName, cache, config, t, logger, plugin,
                  getPluginMsg, setPluginMsg, next, abort }) {
    // return true  -> lanjut ke middleware/command berikutnya
    // return false -> hentikan chain
    // return abort('alasan') -> hentikan + log warning
    return next();
  },
});
```

### 4. Migration (Database)
```js
// migrations/001_create_table.js
/** @param {import('knex').Knex} knex */
export async function up(knex) {
  return knex.schema.createTable('nama_tabel', (table) => {
    table.increments('id');
    table.string('kolom').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTable('nama_tabel');
}
```

### 5. Config (`configs/nama.json`)
```json
{
  "enabled": true,
  "prefix": "!",
  "max_items": 10
}
```
- Akses: `config.get('nama.enabled')` atau `config.get('nama')`
- Update: `await config.set('nama.enabled', false)` — otomatis tersimpan ke file

### 6. Lang (`lang/id.json`)
```json
{
  "greeting": "Halo, {name}!",
  "error.not_found": "Data tidak ditemukan."
}
```
Akses: `t('greeting', { name: 'User' })` => `"Halo, User!"`

---

## Context Data yang Tersedia

### CommandContext (dalam execute() command)

| Property | Type | Keterangan |
|----------|------|-----------|
| `sock` | WASocket | Baileys socket — kirim pesan WhatsApp |
| `msg` | SerializedMessage | Pesan yang masuk (sudah di-parse) |
| `db` | Knex | Database instance (SQLite/MySQL) |
| `cache` | CacheService | In-memory/Redis cache (auto-prefix per plugin) |
| `config` | `{ get, set }` | Baca/tulis config plugin |
| `t` | `(path, params?) => string` | Translasi bahasa |
| `logger` | PluginLogger | Logger dengan prefix plugin |
| `plugin` | `{ key, name, version, ... }` | Manifest plugin yang aktif |
| `getPluginMsg` | `(path?) => any` | Baca data dari msg.plugins namespace ini |
| `setPluginMsg` | `(path, val, pos?) => void` | Tulis data ke msg.plugins namespace ini |

### SerializedMessage (objek `msg`)

```js
msg.key              // WAMessageKey (id, remoteJid, fromMe, ...)
msg.chat             // JID grup atau user (string)
msg.fromMe           // boolean — apakah pesan dari bot sendiri?
msg.device           // 'web' | 'android' | 'ios' | 'desktop' | 'unknown'

// Flags pesan
msg.flags.isGroup            // apakah dari grup?
msg.flags.isText             // boolean
msg.flags.isImage            // boolean
msg.flags.isVideo            // boolean
msg.flags.isAudio            // boolean
msg.flags.isDocument         // boolean
msg.flags.isSticker          // boolean
msg.flags.isStickerAnimated  // boolean
msg.flags.isMedia            // true jika ada media apapun
msg.flags.fromMe             // boolean

// Info bot
msg.bot.session      // nama sesi WA
msg.bot.id           // JID bot (LID)
msg.bot.pn           // nomor HP bot (JID format)
msg.bot.lid          // LID bot

// Info pengirim
msg.sender.id        // JID pengirim
msg.sender.pn        // nomor HP pengirim
msg.sender.lid       // LID pengirim
msg.sender.pushName  // nama tampilan WhatsApp

// Permissions (grup)
msg.permissions.sender.admin       // boolean
msg.permissions.sender.superAdmin  // boolean
msg.permissions.bot.admin          // boolean
msg.permissions.bot.superAdmin     // boolean

// Body pesan
msg.body.rawText      // teks mentah seluruh pesan
msg.body.command      // kata pertama ("ping" dari "ping halo dunia")
msg.body.argsText     // sisa setelah command ("halo dunia")
msg.body.args         // array sisa ["halo", "dunia"]
msg.body.mtype        // tipe pesan Baileys (conversation, imageMessage, dll.)
msg.body.mentionedJid // array JID yang di-mention
msg.body.expiration   // durasi disappearing message (0 jika tidak ada)

// Quoted message (pesan yang di-reply)
msg.quoted                    // undefined jika tidak ada reply
msg.quoted.key
msg.quoted.fromMe
msg.quoted.flags              // sama strukturnya seperti msg.flags
msg.quoted.sender             // { lid, pn }
msg.quoted.msg                // { rawText, command, argsText, args, mtype, ... }
msg.quoted.message            // WAMessageContent (raw Baileys)
msg.quoted.downloadMedia()    // async -> Buffer media quoted

// Actions pada pesan
msg.reply('teks')                             // balas pesan (quoted reply)
msg.sendImage(buffer | { url }, caption?)     // kirim gambar
msg.sendVideo(buffer | { url }, caption?)     // kirim video
msg.sendAudio(buffer | { url }, ptt?)         // kirim audio (ptt=true = voice note)
msg.sendDocument(buffer | { url }, options?)  // kirim dokumen
msg.sendSticker(buffer | { url })             // kirim stiker
msg.react('emoji')                            // react emoji ke pesan
msg.delete()                                  // hapus pesan
msg.downloadMedia()                           // download media pesan -> Buffer

// Raw data
msg.raw              // WAMessage mentah dari Baileys
msg.sock             // WASocket
```

### MiddlewareContext (dalam handler() middleware)

Sama seperti CommandContext + tambahan:

| Property | Type | Keterangan |
|----------|------|-----------|
| `payload` | SerializedMessage atau BaileysEventMap[T] | Data event/command |
| `eventName` | string | Nama event yang sedang diproses |
| `next()` | `() => boolean` | Lanjut ke middleware berikutnya |
| `abort(msg)` | `(log: string) => object` | Batalkan chain + log warning |

### EventContext (dalam execute() event)

| Property | Type | Keterangan |
|----------|------|-----------|
| `sock` | WASocket | Baileys socket |
| `db` | Knex | Database |
| `eventData` | BaileysEventMap[T] | Data event Baileys mentah |
| `cache` | CacheService | Cache service |
| `config` | `{ get, set }` | Config plugin |
| `t` | Function | Translasi |
| `logger` | PluginLogger | Logger |
| `plugin` | PluginManifest | Manifest |

---

## CLI — Perintah yang Tersedia

PERHATIAN: CLI hanya aktif saat bot sedang berjalan (npm run dev atau npm start).
AI tidak bisa mengakses CLI secara langsung.
Gunakan stubs di core/stubs/ sebagai template untuk membuat file baru secara manual.

| Perintah | Keterangan |
|----------|-----------|
| `make:plugin [name]` | Buat plugin baru di workspace |
| `make:command` | Buat file command baru di workspace |
| `make:event` | Buat file event baru di workspace |
| `make:middleware` | Buat file middleware baru di workspace |
| `make:migration` | Buat file migration baru di workspace |
| `plugin:install <key>` | Install plugin dari cloud |
| `plugin:install <key> -w` | Install plugin ke workspace |
| `plugin:uninstall <key>` | Uninstall plugin |
| `plugin:upgrade <key>` | Upgrade plugin ke versi terbaru |
| `plugin:reload <key>` | Reload plugin tanpa restart bot |
| `plugin:list` | Tampilkan daftar plugin yang ter-load |
| `plugin:migrate <key>` | Jalankan migration plugin |
| `plugin:publish <key>` | Publish plugin ke cloud |
| `services:login` | Login ke platform |
| `services:logout` | Logout |
| `lang <code>` | Ganti bahasa CLI |
| `wa:logout` | Logout dari sesi WhatsApp |
| `wa:status` | Status koneksi WhatsApp |
| `help` | Tampilkan semua perintah |
| `exit` | Hentikan bot |

### Membuat File Plugin Secara Manual (untuk AI)

Karena AI tidak bisa akses CLI, buat file langsung di workspace/<nama-plugin>/:

```
workspace/my-plugin/
├── package.json      <- dari core/stubs/package.json.stub
├── commands/
│   └── nama.js       <- dari core/stubs/command.js.stub
├── events/
│   └── nama.js       <- dari core/stubs/event.js.stub
├── middlewares/
│   └── nama.js       <- dari core/stubs/middleware.js.stub
├── migrations/
│   └── 001_create.js <- dari core/stubs/migration.js.stub
└── configs/
    └── nama.json     <- dari core/stubs/config.json.stub
```

---

## Utility yang Bisa Dipakai di Plugin

### Http — HTTP Client

```js
import { Http } from '@lazy/core/utils/http';

// GET request
const res = await Http.get('https://api.example.com/data');
const json = await res.json();
res.ok()     // boolean status 2xx
res.status() // nomor status HTTP

// POST dengan auth
const res2 = await Http.withToken('my-token').post('https://api.example.com/post', { key: 'val' });

// Dengan timeout
const res3 = await Http.timeout(5000).get('https://api.example.com/slow');

// Download file dari URL
const file = await Http.getFromUrl('https://example.com/image.jpg');
// Returns: { buffer, mime, ext, size, filename } atau null jika gagal
```

### Storage — Manajemen File

```js
import { Storage } from '@lazy/core/utils/storage';

// Simpan file permanen
const filePath = await Storage.save(buffer, { filename: 'data.txt', subDir: 'myplugin' });

// Simpan file sementara (auto-delete setelah ttlMs, default 5 menit)
const tmpPath = await Storage.saveTmp(buffer, { filename: 'temp.jpg', ttlMs: 60000 });

// Operasi lainnya
const buf = await Storage.getBuffer(filePath);     // baca sebagai Buffer
const exists = await Storage.exists(filePath);     // cek ada atau tidak
await Storage.delete(filePath);                    // hapus file
```

### Converter — Media Converter (FFmpeg)

```js
import { imageToWebp, videoToWebp, toMp3, videoToMp4 } from '@lazy/core/utils/converter';

const webp = await imageToWebp(imageBuffer);    // gambar -> WebP
const sticker = await videoToWebp(videoBuffer); // video -> WebP animasi (stiker)
const mp3 = await toMp3(audioBuffer);           // audio -> MP3
```

### Helpers Umum

```js
import { delay, retry, getRandomItem, shuffleArray, chunkArray,
         interpolateString, toSlug, truncateText, formatNumber,
         formatCurrency, formatFileSize } from '@lazy/core/utils/helpers';

await delay(1000);                             // tunggu 1 detik
const result = await retry(asyncFn, 3, 1000); // retry 3x dengan delay 1 detik
const item = getRandomItem(['a', 'b', 'c']);
const slug = toSlug('Hello World!');           // -> 'hello-world'
const size = formatFileSize(1048576);          // -> '1 MB'
const text = truncateText('teks panjang...', 50);
const money = formatCurrency(50000);           // -> 'Rp 50.000'
```

### CacheService — Cache (via ctx.cache)

```js
// Sudah ter-inject di context, tidak perlu import manual
await cache.set('key', value, 300);    // TTL 300 detik
const data = await cache.get('key');
await cache.del('key');
const exists = await cache.has('key');

// Pattern cache-or-fetch (paling efisien)
const result = await cache.remember('api-data', 60, async () => {
  return await fetchFromApi(); // hanya dipanggil jika cache miss
});
```

### Debug

```js
import { dump } from '@lazy/core/utils/debug';
dump(msg);   // tampilkan struktur data lengkap di terminal CLI
```

---

## Database (Knex)

> **Penting:** Secara default, gunakan penyimpanan JSON via `configs/*.json` (Config Service) untuk penyimpanan data sederhana. Gunakan Knex database & buat file migration hanya jika data yang dikelola berukuran besar atau memiliki struktur yang kompleks/relasional.

Database di-inject via ctx.db. Tipe: Knex.

```js
// SELECT
const rows = await db('my_table').where({ user_id: '123' }).select();
const row = await db('my_table').where({ id: 1 }).first();

// INSERT
await db('my_table').insert({ user_id: '123', value: 'data' });

// UPDATE
await db('my_table').where({ id: 1 }).update({ value: 'baru' });

// DELETE
await db('my_table').where({ id: 1 }).delete();

// JOIN
const data = await db('table_a').join('table_b', 'table_a.id', 'table_b.a_id').select();
```

Konfigurasi DB via .env:
- DB_CONNECTION=sqlite (default) atau mysql
- MySQL: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE

---

## Environment Variables

| Key | Default | Keterangan |
|-----|---------|-----------|
| WA_AUTH_STATE | file | Penyimpanan session WA |
| WA_USE_PAIRING_CODE | true | Gunakan pairing code (bukan QR) |
| PLUGIN_WATCHER | true | Auto-reload plugin saat file berubah |
| CACHE_DRIVER | lru | lru atau redis |
| DEFAULT_LANG | en | Bahasa default |
| DB_CONNECTION | sqlite | sqlite atau mysql |
| STORE_ENABLED | false | Simpan pesan ke database |
| API_BASE_URL | - | URL platform cloud |

---

## Auth & Workspace

- Plugin di workspace/ hanya ter-load jika user sudah login via services:login
- global.AUTH_TOKEN — JWT token dari platform
- global.AUTH_USER — { id, name, username }
- global.API_BASE_URL — URL API platform
- Plugin workspace diberi key @username/folder-name sesuai user login
- Jika plugin di plugins/ dan workspace/ sama, yang dari plugins/ menang (skip workspace)

---

## Konvensi Kode Plugin

1. Format file: JavaScript ES Module (.js), gunakan `export default`
2. Selalu gunakan defineCommand, defineEvent, defineMiddleware untuk type safety
3. Nama Command vs Alias: Properti `name` pada `defineCommand` adalah identifier unik internal (misal `group-kick`), BUKAN perintah yang diketik oleh user di WhatsApp. Kata kunci perintah yang sebenarnya dipakai oleh user (seperti `kick` atau `add`) didefinisikan di dalam array `aliases` (contoh: `aliases: ['kick', 'remove']`). Pastikan `name` selalu unik di dalam plugin.
4. Jangan import TypeScript dari dalam plugin — gunakan import dari @lazy/core/*
5. Error handling: bungkus operasi async dengan try/catch, gunakan logger.error()
6. Config: simpan di configs/*.json, jangan hardcode nilai di dalam kode
7. Translasi: gunakan lang/*.json + t() untuk semua teks yang tampil ke user
8. Media: gunakan msg.downloadMedia() untuk download, lalu Storage.saveTmp() jika perlu disimpan
9. Penyimpanan Data: Secara default, gunakan `configs/*.json` (via `config.get()`/`config.set()`) untuk data sederhana. Hanya gunakan database (Knex) dan buat migrasi jika data berukuran besar atau kompleks.
10. Priority middleware: nilai negatif = jalan lebih awal (cocok untuk rate limiter, auth guard)
11. Import Library: Selalu gunakan static import di bagian atas file (jangan gunakan dynamic `import()` di dalam scope fungsi) untuk library eksternal agar sesuai standar ES Modules. Untuk Baileys, gunakan `import { ... } from 'baileys'` (bukan `@whiskeysockets/baileys`).
12. Status Code Baileys: Perhatikan bahwa nilai balikan `status` pada response Baileys (misal dari `groupParticipantsUpdate`) bertipe string (misal: `'200'`, `'403'`). Selalu gunakan strict equality dengan string (`status === '200'`) alih-alih number agar tidak memicu error TypeScript.
13. Formatting File Bahasa (`lang/*.json`):
    - Jangan gunakan karakter penutup `└` atau newline ekstra di akhir pesan. Cukup gunakan header (contoh: `┌ *HEADER*\nPesan di sini.`).
    - Jangan gunakan awalan ` › ` untuk pesan teks biasa (satu baris). Awalan ` › ` HANYA boleh digunakan untuk menampilkan baris daftar/list.

---

## Larangan

- JANGAN edit file di core/ kecuali diminta developer
- JANGAN buat file .ts dalam plugin — hanya .js
- JANGAN akses CLI dari AI — buat file manual pakai template stubs
- JANGAN hardcode nomor HP, JID, atau kredensial
- JANGAN return false dari middleware tanpa alasan yang jelas
- JANGAN lupa handle error di setiap operasi async
- JANGAN gunakan require() — hanya ES Module import
