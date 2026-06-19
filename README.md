# Sejajar API — Content Management System Backend

Backend REST API untuk Sejajar Content Management System yang mengelola kontrak, konten, task, penugasan, review, serta analitik media sosial.

---

## 🚀 Fitur Utama

- **Autentikasi & Session:** JWT Bearer Token dengan rotasi refresh token otomatis, proteksi route, dan pembatasan berdasarkan hierarki role.
- **Manajemen Transaksional:** CRUD lengkap untuk Kontrak, Konten, dan Kanban Board Tasks.
- **Kolaborasi Tim:** Sistem upload task outputs, komentar task, dan workflow review konten multi-step.
- **Dashboard Kustom per Role:** Summary statistik, metrics uptime, visualisasi chart, dan widget interaktif (seperti calendar event) berdasarkan hak akses pengguna.
- **Audit & Logs:** Pencatatan otomatis setiap aksi tulis (audit trail) pada tabel `audit.activity_logs`.
- **API Documentation:** Interaktif Swagger UI tersedia langsung di `/api/docs`.

---

## 🛠️ Stack Teknologi

- **Core Framework:** Node.js, Express.js (v5)
- **Database:** PostgreSQL (dengan driver `pg`)
- **Keamanan:** Helmet, CORS, Express Rate Limit, bcryptjs
- **Token:** JSON Web Token (JWT)
- **Validasi:** Express Validator
- **Upload:** Multer (Limit 50MB)
- **Logging:** Winston, Morgan

---

## 📁 Struktur Direktori

```
express-sejajar/
├── src/
│   ├── config/          # Pengaturan db, logger, env, swagger
│   ├── database/        # Migrations SQL dan seeder data
│   ├── middlewares/     # Auth, error handler, rate limit, logging
│   ├── modules/         # Modul fitur (controller, service, routes, validator)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── clients/
│   │   ├── platforms/
│   │   ├── content-types/
│   │   ├── pillars/
│   │   ├── contracts/
│   │   ├── contents/
│   │   ├── tasks/
│   │   ├── reviews/
│   │   ├── task-outputs/
│   │   ├── task-comments/
│   │   ├── analytics/
│   │   ├── portfolio/
│   │   ├── activity-logs/
│   │   ├── notifications/
│   │   └── dashboard/
│   ├── routes/          # Healthcheck router
│   └── app.js           # Express App setup & mounting routes
├── server.js            # Entry point server
└── package.json         # Dependencies & NPM Scripts
```

---

## ⚙️ Persyaratan Sistem & Instalasi

### 1. Prasyarat

- Node.js versi `>= 18.0.0`
- PostgreSQL Server berjalan

### 2. Instalasi Dependensi

Jalankan perintah berikut di direktori root backend:

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env` lalu lengkapi isinya:

```bash
cp .env.example .env
```

Sesuaikan parameter database Anda:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` dan `JWT_REFRESH_SECRET`

---

## 🗄️ Database Migrations & Seeding

Proyek ini menggunakan SQL migrations murni. Jalankan perintah NPM berikut untuk menginisiasi database:

- **Menjalankan Migrasi Baru:**
  ```bash
  npm run migrate
  ```
- **Reset Database (Hapus semua tabel & migrasi ulang):**
  ```bash
  npm run migrate:fresh
  ```
- **Menjalankan Seeder (Mengisi dummy data untuk uji coba UI):**
  ```bash
  npm run seed
  ```

---

## 🏃 Menjalankan Aplikasi

- **Mode Development (dengan Hot-Reload nodemon):**
  ```bash
  npm run dev
  ```
- **Mode Production:**
  ```bash
  npm start
  ```

Secara default, server akan berjalan di `http://localhost:3000`.

---

## 📖 API Documentation (Swagger)

Saat server berjalan, Anda dapat mengakses dokumentasi API interaktif di:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## 🔒 Skema Autentikasi & Authorization

### Rate Limiting

Sistem menerapkan rate limiting untuk menjaga performa dan keamanan:

- `POST /api/auth/login` → Maksimal 5x percobaan per 15 menit.
- `POST /api/auth/refresh` → Maksimal 20x request per 1 jam.
- Endpoint API lainnya `/api/*` → Maksimal 100x request per 15 menit.

### Hierarki Role Akses

Hierarki kekuasaan role pengguna diatur secara linier:

```
superadmin → owner → content_lead → content_editor / script_writer / admin_social_media
```

Setiap endpoint REST API telah diproteksi menggunakan middleware `authorize()` untuk mencocokkan hak akses minimum dari JWT payload pengguna.
