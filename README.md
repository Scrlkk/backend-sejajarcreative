# Sejajar API — Content Management System Backend

![Sejajar Creative Logo](assets/logos/DashboardLogo.svg)

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

### Core & Framework

- **Node.js** & **Express.js (v5)**: Engine runtime JavaScript sisi server dan framework web RESTful API utama.
- **PostgreSQL (`pg` pool)**: Sistem manajemen basis data relasional transaksional lengkap dengan pool koneksi dinamis.

### Keamanan & Autentikasi

- **JSON Web Token (`jsonwebtoken`)**: Digunakan untuk penerbitan token sesi aman (AccessToken & RefreshToken) dan autentikasi stateless.
- **`bcryptjs`**: Library hashing password satu arah dengan garam (salt) tinggi untuk proteksi akun.
- **`helmet`**: Proteksi header HTTP untuk mencegah eksploitasi celah keamanan web umum.
- **`cors`**: Middleware untuk mengonfigurasi Cross-Origin Resource Sharing agar API aman diakses oleh frontend.
- **`express-rate-limit`**: Membatasi laju request untuk mencegah serangan Brute Force dan Denial-of-Service (DoS).

### Validasi & File Management

- **`express-validator`**: Middleware validasi parameter input body, query, dan params secara deklaratif.
- **`multer`**: Penanganan upload file multipart/form-data untuk menyimpan output tugas (dokumen/gambar/video) dengan batas ukuran tertentu.

### Dokumentasi & Observabilitas

- **`swagger-ui-express`** & **`swagger-jsdoc`**: Pembuatan dokumentasi API interaktif berbasis OpenAPI/Swagger.
- **`winston`** & **`morgan`**: Framework pencatatan log (logging) sistem terstruktur dikombinasikan dengan HTTP request logger.

---

## 📁 Struktur Direktori

```text
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

### 📋 Prasyarat

Sebelum memulai, pastikan perangkat Anda telah memasang:

- **Node.js** (versi `>= 18.0.0` direkomendasikan)
- **npm** (versi `v9.x` atau yang lebih baru)
- **PostgreSQL Database** (aktif berjalan di port `5432`)

---

### 📥 Langkah Instalasi

1. **Unduh/Masuk ke Direktori Backend**:

   ```bash
   cd express-sejajar
   ```

2. **Instal Dependensi NPM**:

   Jalankan perintah ini di root direktori backend:

   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:

   Salin berkas `.env.example` menjadi `.env`:

   ```bash
   cp .env.example .env
   ```

   Buka berkas `.env` dan konfigurasikan sesuai dengan database PostgreSQL lokal Anda:

   ```env
   # APP CONFIGURATION
   NODE_ENV=development
   PORT=3000

   # DATABASE CONFIGURATION
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=sejajar_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password

   # JWT AUTHENTICATION
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   JWT_REFRESH_EXPIRES_IN=30d

   # SECURITY & CORS
   BCRYPT_ROUNDS=12
   CORS_ORIGIN=http://localhost:5173
   LOG_LEVEL=info

   # FILE UPLOAD LIMITS
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=52428800
   STORAGE_LIMIT_MB=2048
   ```

4. **Siapkan Database PostgreSQL**:

   Buat database baru di PostgreSQL Anda (misalnya menggunakan pgAdmin, DBeaver, Laragon, atau command line):

   ```sql
   CREATE DATABASE sejajar_db;
   ```

5. **Jalankan Migrasi Skema & Seeder**:

   Inisialisasi tabel-tabel database dan isi data sampel awal untuk uji coba:

   ```bash
   # Jalankan semua berkas migrasi database
   npm run migrate

   # Masukkan data tiruan (seperti admin, platforms, roles, dan contoh konten)
   npm run seed
   ```

6. **Jalankan Server API**:

   ```bash
   # Mode Development (dengan hot reload nodemon)
   npm run dev
   ```

   Server backend Anda sekarang aktif di **`http://localhost:3000`**.

---

## 💻 Referensi Perintah NPM (Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server lokal dalam mode development dengan Nodemon (reload otomatis). |
| `npm start` | Menjalankan server dalam mode production (Node murni). |
| `npm run migrate` | Menjalankan migrasi tabel-tabel baru ke database PostgreSQL. |
| `npm run migrate:fresh` | Menghapus semua tabel (*drop*) lalu membuat ulang skema migrasi dari awal. |
| `npm run seed` | Mengisi database dengan dummy data/seeder awal (akun user, pilar, dan tugas). |

---

## 📖 API Documentation (Swagger)

Backend ini dilengkapi dokumentasi API interaktif menggunakan Swagger. Ketika server berjalan, buka tautan berikut di peramban Anda untuk melihat daftar endpoint, payload, dan melakukan pengujian API secara langsung:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## 🔒 Skema Keamanan & Otorisasi

### Pembatasan Laju Request (Rate Limiting)

Untuk melindungi API dari serangan brute force dan flooding, batasan berikut diterapkan:

- `POST /api/auth/login` → Maksimal 5x percobaan per 15 menit.
- `POST /api/auth/refresh` → Maksimal 20x request per 1 jam.
- Endpoint API umum lainnya `/api/*` → Maksimal 100x request per 15 menit.

### Hirarki Peran (Role Hierarchy)

Akses endpoint diatur berdasarkan hierarki peran pengguna secara linier:

```text
superadmin ➔ owner ➔ content_lead ➔ content_editor / script_writer / admin_social_media
```

Setiap request ke route terproteksi wajib menyertakan token JWT pada header `Authorization: Bearer <token>`. Middleware `authorize()` di backend akan memeriksa peran pengguna secara real-time sebelum mengizinkan aksi.
