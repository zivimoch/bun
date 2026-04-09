# Issue: Implementasi Unit Test untuk Seluruh API

## Deskripsi Tugas
Kita membutuhkan _test coverage_ yang komprehensif untuk seluruh endpoint API yang berjalan saat ini. Pengujian ini bertujuan untuk memastikan setiap endpoint berfungsi sesuai spesifikasi, baik pada skenario sukses (Happy Path) maupun pada skenario kegagalan (Error/Edge Cases).

Silakan implementasikan unit test menggunakan *test runner* bawaan dari Bun yaitu `bun test`.

---

## Aturan Utama Pengujian
1. **Lokasi File**: Seluruh file test harus diletakkan di dalam direktori `test/` pada root proyek (contoh: `test/users.test.ts`).
2. **Isolasi Data (Konsistensi)**: Sebelum **setiap** skenario (atau sebelum block `describe` yang terkait), **WAJIB** membersihkan/menghapus data target di database secara terprogram (membersihkan isi tabel `users` dan `sessions`). Hal ini penting agar satu pengujian tidak diinterferensi oleh sisa data dari pengujian sebelumnya.
3. Gunakan integrasi request dengan instance server Elysia atau langsung hit menggunakan HTTP request secara lokal ke aplikasi.

---

## Daftar Skenario Pengujian yang Harus Dibuat

Berikut adalah rincian skenario yang wajib Anda tulis tesnya, jangan membuat implementasi kode dari saya, melainkan wujudkan langsung *assertions* berdasarkan daftar berikut:

### 1. Registrasi User (`POST /api/users`)
- **[Success]** Berhasil melakukan registrasi dengan payload user yang valid (mengembalikan response `{"data": "OK"}`).
- **[Error]** Gagal melakukan registrasi karena format body payload tidak valid (misalnya field `email` bukan format email yang benar).
- **[Error]** Gagal melakukan registrasi karena email sudah terdaftar sebelumnya (menghasilkan status HTTP 400).

### 2. Login User (`POST /api/users/login`)
- **[Success]** Berhasil login menggunakan email dan password yang valid (menghasilkan token berbasis UUID, status HTTP 200).
- **[Success]** Verifikasi Database: Pastikan token yang dikembalikan dari login tersebut berhasil masuk ke tabel `sessions` dengan relasi `user_id` yang tepat.
- **[Error]** Gagal login karena format email atau body rekues salah.
- **[Error]** Gagal login karena email belum didaftarkan di sistem (status 401).
- **[Error]** Gagal login karena pengguna memberikan kombinasi password yang salah (status 401).

### 3. Get Current User Profil (`POST /api/users/current`)
- **[Success]** Berhasil membaca data profil pengguna dengan memasukkan Authorization header Bearer token yang valid (response mengandung `id`, `name`, `email`, dan `createdAt`, tetapi **HARUS dipastikan kolom `password` tidak bocor**).
- **[Error]** Akses ditolak jika tidak membawa header `Authorization` sama sekali (status 401).
- **[Error]** Akses ditolak karena Bearer token berformat salah atau menggunakan token sembarang/invalid (status 401).
- **[Error]** Akses ditolak jika menggunakan string yang tampak seperti token UUID tetapi record-nya tidak dapat ditemukan/sudah tidak valid di tabel `sessions`.

### 4. Logout User (`DELETE /api/users/logout`)
- **[Success]** Berhasil membatalkan token/logout menggunakan Bearer token yang valid (response OK).
- **[Success]** Verifikasi Database: Setelah operasi logout berhasil, token terkait harus **sepenuhnya terhapus (tidak ada)** dari tabel `sessions`.
- **[Error]** Proses logout gagal akibat tidak ada header Authorization (Status 401).
- **[Error]** Akses ditolak saat mencoba logout dua kali berturut-turut *(Double Logout)* dengan token yang sama (Status 401 pada percobaan kedua karena token pertama kali sudah sukses terhapus).
