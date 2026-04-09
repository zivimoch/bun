# Vibecoding Backend API

Aplikasi ini merupakan contoh _backend web API_ modern yang dibangun khusus untuk menangani proses manajemen user dan autentikasi (Registrasi, Login, Profil User, dan Logout). Proyek ini dirancang sejak awal agar sangat cepat, memiliki _type-safety_ (aman dari sisi tipe data) yang ketat *end-to-end*, serta mendukung arsitektur yang rapi dan mudah untuk dilanjutkan (scalable).

---

## 🛠️ Technology Stack & Library Pendukung

Proyek ini menggunakan _technology stack_ modern dan didukung oleh fungsionalitas dari library terbaik di ekosistem JavaScript/TypeScript:

**Core Stack:**
- **[Bun](https://bun.sh/)**: Runtime JavaScript super cepat pengganti Node.js. Berfungsi sebagai runtime eksekusi, _package manager_, pembuat *password hashing*, dan _test runner_.
- **[ElysiaJS](https://elysiajs.com/)**: Web framework tercepat untuk ekosistem Bun.
- **[MySQL](https://www.mysql.com/)**: Relational Database Management System (RDBMS) tepercaya.

**Library Pendukung (Dependencies):**
- **Drizzle ORM (`drizzle-orm`)**: *TypeScript ORM* yang sangat ringan, terikat kuat dengan SQL, serta memberikan keamanan pengecekan tipe data query database.
- **Typebox (`@sinclair/typebox`)** (Terintegrasi via Elysia): Untuk memvalidasi Object/Body request dari pengguna.
- **`mysql2`**: Driver eksekusi kueri yang menghubungkan aplikasi menuju database MySQL.
- **Drizzle Kit (`drizzle-kit`)**: Toolkit CLI pembantu bagi Drizzle ORM untuk melakukan sinkronisasi maupun pembuatan struktur database secara mulus.
- **`dotenv`**: Pemuat *environment variable* dari sistem file `.env`.

---

## 🏗️ Arsitektur Folder dan Penamaan File

Repository ini memisahkan secara ketat *routing layer* dan *service (Business Logic) layer* ke dalam folder berbeda agar logika kode tetap bersih (Clean Architecture ringan).

| Folder/File | Deskripsi / Tujuan (Architecture Guide) |
| --- | --- |
| `src/index.ts` | **Entry Point Utama:** Menginisialisasi *app instance* ElysiaJS, _health-check_, menyatukan semua _route group_, serta menjalankan server HTTP. |
| `src/routes/` | **Routing/Controller (e.g., `users-route.ts`):** Bertugas semata-mata untuk mengelola alur HTTP (Method, Endpoint), menerima body/param/header requests, memvalidasi _input_ tipe data menggunakan typebox, serta membalas JSON HTTP Status (kembalikan 200, 400). File rute tidak boleh mengandung *query* database. |
| `src/services/` | **Business Logic (e.g., `user-services.ts`):** Mengandung seluruh algoritma bisnis (Hashing, ekstraksi data, komputasi) dan komunikasi query ke database ORM. Servis ini dipanggil oleh *routes*. |
| `src/db/` | **Database Config & Schema:**<br/>- `index.ts` menyimpan koneksi raw driver MySQL (Connection Pool).<br/>- `schema.ts` adalah representasi/definisi cetak biru kerangka seluruh tabel Drizzle ORM. |
| `test/` | **Testing Suite (e.g., `user.test.ts`):** Menampung seluruh kode berkas unit/integration testing sesuai dengan kaidah _Bun Test_. |

---

## 🗄️ Skema Database

Sistem ini memakai dua buah tabel yang terhubung:

### 1. Tabel `users`
Master pencatat profil pengguna secara utuh.
- `id` (Serial/Auto Increment - Primary Key)
- `name` (Varchar 255, _Not Null_)
- `email` (Varchar 255, _Not Null_, _Unique_)
- `password` (Varchar 255, _Not Null_ - Disimpan dalam format terenkripsi/Bcrypt Hash)
- `created_at` (Timestamp, Default *Current Timestamp*)
- `updated_at` (Timestamp, Auto Update)

### 2. Tabel `sessions`
Mencatat rekam jejak token pengguna aktif pada saat proses login.
- `id` (Serial/Auto Increment - Primary Key)
- `token` (Varchar 255, _Not Null_ - UUID String token khusus pengguna login)
- `user_id` (Bigint Unsigned, _Not Null_ - **Foreign Key** yang merujuk pada `users.id`)
- `created_at` (Timestamp, Default *Current Timestamp*)

---

## 🌐 API yang Tersedia

Daftar endpoint layanan yang telah berjalan:

| Aksi | Method & URL Endpoint | Headers Wajib | Keterangan |
| --- | --- | --- | --- |
| **Pengecekan Sistem** | `GET /health` | - | Mengembalikan status OK jika server dan database sehat. |
| **Registrasi User** | `POST /api/users` | - | Mendaftar user baru. Butuh: `name`, `email`, `password`. |
| **Login User** | `POST /api/users/login` | - | Kredensial masuk ke sistem. Butuh: `email`, `password`. Mengembalikan token `UUID`. |
| **Get Profil Aktif** | `POST /api/users/current` | `Authorization: Bearer <token>` | Mendapatkan profil pengguna tanpa *password leak*, diotorisasi oleh *middleware*. |
| **Logout User** | `DELETE /api/users/logout` | `Authorization: Bearer <token>` | Menghapus token dari tabel `sessions`. Token yang hangus tidak lagi dapat dipakai. |

---

## 🚀 Cara Setup dan Menjalankan Aplikasi

Jika ini adalah pertama kalinya menjalankan program di local mesin, ikuti instruksi berikut:

### 1. Requirements Setup (Prasyarat)
Pastikan hal berikut ada di OS Anda:
- [Bun runtime engine](https://bun.sh/)
- MySQL Local Server yang sudah berjalan

### 2. Konfigurasi Awal
*Clone* repo ini, kemudian masuk ke direktori utama, lalu install library:
```bash
bun install
```
Buat file env lokal bernama `.env` di _root_ proyek, lalu atur *database connection string*-nya. Buat database kosong terlebih dahulu di MySQL lokal Anda.
```env
# Format: mysql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE
DATABASE_URL=mysql://root:password@localhost:3306/vibecoding_db
```

### 3. Migrasi Database Skema
Gunakan bantuan `drizzle-kit` guna memanualisasi dan menyinkronkan struktur `schema.ts` secara otomatis ke MySQL:
```bash
bunx drizzle-kit push
```

### 4. Menjalankan Server
Jalankan aplikasi ini di port bawaan `3000`:
```bash
bun run src/index.ts
```
_Catatan: Output konsol `🦊 Elysia is running at localhost:3000` akan muncul jika sukses._

---

## 🛡️ Cara Menguji (Test) Aplikasi

Proyek ini telah dilindungi selimut *Unit Testing / Integration Testing* yang sangat utuh yang bertugas memeriksa kondisi keamanan sesi maupun _error logic_. Untuk melakukan simulasi uji ini, cukup gunakan fasilitas tes dari Bun.

**Jalankan perintah ini di konsol:**
```bash
bun test
```

Hal ini akan langsung mencari file di folder `test/` dan secara terotomatisasi membersihkan dan *mengetes* ratusan skenario validasi, login, auth header dan logout untuk memvalidasi kesiapan dari _business logics_.
