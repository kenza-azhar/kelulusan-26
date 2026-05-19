# Sistem Pengumuman Kelulusan - Vercel + Neon Database

Aplikasi modern untuk pengumuman kelulusan siswa dengan database online Neon (PostgreSQL) dan deployment di Vercel.

## Fitur

✅ **Landing Page** dengan countdown timer pengumuman
✅ **Login Siswa** menggunakan NISN dan password
✅ **Login Admin** untuk mengelola data
✅ **Dashboard Admin** lengkap dengan statistik
✅ **CRUD Data Siswa** (Create, Read, Update, Delete)
✅ **Pengaturan Sekolah** (nama, logo, countdown, dll)
✅ **Unduh Surat Kelulusan** (PDF)
✅ **Database Online Neon** PostgreSQL
✅ **API Serverless** dengan Vercel Functions
✅ **Autentikasi JWT** yang aman
✅ **Responsive Design** menggunakan Tailwind CSS

## Struktur Proyek

```
├── api/                          # API Routes (Vercel Functions)
│   ├── db.ts                     # Database connection & schema
│   ├── auth.ts                   # Authentication endpoint
│   ├── settings.ts               # Settings management
│   ├── students.ts               # Student CRUD operations
│   └── init.ts                   # Database initialization
├── src/
│   ├── components/               # React components
│   │   ├── LandingPage.tsx      # Landing page with countdown
│   │   ├── StudentDashboard.tsx # Student dashboard
│   │   └── AdminDashboard.tsx   # Admin dashboard
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication context
│   ├── App.tsx                  # Main App component
│   └── main.tsx                 # Entry point
├── public/                      # Static assets
├── vercel.json                  # Vercel configuration
├── .env.example                 # Environment variables template
└── package.json                 # Dependencies
```

## Prasyarat

- Node.js 16+ 
- Akun Neon (https://neon.tech)
- Akun Vercel (https://vercel.com)
- Akun GitHub

## Setup Lokal

### 1. Clone Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Neon Database

1. Login ke [Neon Dashboard](https://console.neon.tech/)
2. Buat project baru
3. Copy **Pooled Connection String** (penting: harus yang ada `-pooler`)
4. Buat file `.env.local`:

```bash
cp .env.example .env.local
```

5. Edit `.env.local` dengan connection string dari Neon:

```env
VITE_API_URL=/api
DATABASE_URL="postgresql://username:password@ep-xxxxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
```

### 4. Jalankan Aplikasi

```bash
# Mode development
npm run dev

# Build untuk production
npm run build
```

### 5. Inisialisasi Database

Browser: `http://localhost:5173/api/init`

Atau gunakan curl:

```bash
curl -X POST http://localhost:5173/api/init
```

Ini akan membuat:
- Tabel `settings` dengan data default
- Tabel `admins` dengan username: `admin`, password: `Min1ciamis!`
- Tabel `students` (kosong)

## Deployment ke Vercel

### Metode 1: Import dari GitHub (Rekomendasi)

1. Push kode ke GitHub
2. Login ke [Vercel Dashboard](https://vercel.com/)
3. Klik "Add New Project"
4. Import dari GitHub
5. Configure Environment Variables:
   - `DATABASE_URL`: Dari Neon (gunakan pooled connection)
   - `JWT_SECRET`: Buat string acak minimal 32 karakter
6. Deploy!

### Metode 2: CLI Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

## Konfigurasi Database Neon

### Connection Pooling (Penting!)

Selalu gunakan **Pooled Connection String** untuk serverless:

```
❌ Salah: ep-xxxxx.region.aws.neon.tech
✅ Benar:  ep-xxxxx-pooler.region.aws.neon.tech
```

### Branching (Opsional)

Neon mendukung database branching seperti Git:

```bash
# Install neonctl
npm install -g neonctl

# Login
neonctl auth

# Buat branch untuk development
neonctl branches create --name dev
```

## Penggunaan

### Login Admin

- **Username**: `admin`
- **Password**: `Min1ciamis!`

### Login Siswa

1. Tambah data siswa di menu "Data Siswa"
2. NISN = username
3. Password = yang diatur saat tambah data
4. Login di halaman utama

### Mengubah Password Admin

1. Login ke Neon Dashboard
2. Buka SQL Editor
3. Jalankan:

```sql
UPDATE admins SET password_hash = 'hash-baru' WHERE username = 'admin';
```

Untuk generate hash password, gunakan:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password-baru', 10);
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxxxx-pooler...` |
| `JWT_SECRET` | Secret key untuk JWT | `min-32-characters-secret-key-here` |
| `VITE_API_URL` | Base URL API | `/api` |

## API Endpoints

### Authentication
- `POST /api/auth` - Login user

### Settings
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings (Admin only)

### Students
- `GET /api/students` - Get students (Auth required)
- `POST /api/students` - Add student (Admin only)
- `PUT /api/students` - Update student (Admin only)
- `DELETE /api/students?id=` - Delete student (Admin only)

### Database
- `POST /api/init` - Initialize database

## Troubleshooting

### Error: "connection pool exhausted"

✅ **Solusi**: Pastikan menggunakan pooled connection string (`-pooler`)

### Error: "SSL connection required"

✅ **Solusi**: Tambahkan `?sslmode=require` di akhir DATABASE_URL

### Error: "JWT_SECRET is not defined"

✅ **Solusi**: Set JWT_SECRET di environment variables Vercel

### Database belum terisi data

✅ **Solusi**: Jalankan endpoint `/api/init` dengan method POST

## Keamanan

- Selalu gunakan HTTPS di production
- JWT secret minimal 32 karakter
- Password di-hash menggunakan bcrypt
- CORS diaktifkan untuk semua origin (bisa disesuaikan)

## Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -am 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## Lisensi

MIT License

## Dukungan

Jika ada masalah atau pertanyaan:

1. Buka issue di GitHub
2. Email: support@min1ciamis.sch.id
3. WhatsApp: +62 8xx-xxxx-xxxx

---

**Dibuat dengan ❤️ menggunakan React, TypeScript, Neon & Vercel**
