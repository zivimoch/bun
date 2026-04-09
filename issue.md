# Issue: Implementasi Fitur Logout User

## Deskripsi Tugas
Kita perlu menambahkan fitur logout untuk mengakhiri sesi pengguna yang saat ini sedang login. Fitur ini akan menerima token sesi (UUID) melalui HTTP Header `Authorization`, lalu menghapus record session tersebut dari database sehingga token tersebut tidak dapat digunakan lagi.

---

## 1. Spesifikasi API

Buat endpoint API untuk melakukan proses logout user.

- **Endpoint:** `DELETE /api/users/logout`

**Headers Request:**
- `Authorization`: `Bearer <token_uuid_dari_table_sessions>`

**Response Body (Success 200):**
```json
{
    "data" : "OK"
}
```
*(Catatan: Setelah response sukses ini diberikan, pastikan record session di tabel database sudah terhapus).*

**Response Body (Error - Token Tidak Valid/Tidak Ada 401):**
```json
{
    "error" : "unauthorized"
}
```

---

## 2. Struktur Folder dan Penamaan File

Kode harus diletakkan pada folder dan file yang sudah ada:

- `src/routes`: Folder ini berisi file routing ElysiaJS.
  - File: `users-route.ts`
- `src/services`: Folder ini berisi logika bisnis aplikasi.
  - File: `user-services.ts`

---

## 3. Tahapan Implementasi (Step-by-Step)

Untuk mengimplementasikan fitur ini, ikuti langkah-langkah berurutan berikut:

### Langkah 1: Buat Logic Logout di Service (`src/services/user-services.ts`)
1. Buka file `src/services/user-services.ts`.
2. Buat fungsi baru, misalnya `logoutUser(token: string)`. Fungsi ini wajib bersifat async.
3. Di dalam fungsi tersebut, hubungkan ke tabel `sessions` menggunakan Drizzle ORM.
4. Pertama, cek apakah token ada di database. Anda bisa menggunakan `db.query.sessions.findFirst`. Jika tidak ada, lempar error: `throw new Error("unauthorized")`.
5. Jika ada, lakukan penghapusan token tersebut dari tabel `sessions` menggunakan perintah delete Drizzle, misal: `await db.delete(sessions).where(eq(sessions.token, token))`.
6. Kembalikan (return) string `"OK"` yang menandakan penghapusan sukses.

### Langkah 2: Buat Route Handler & Ekstraksi Token (`src/routes/users-route.ts`)
1. Buka file `users-route.ts`.
2. Pada instance route utama Elysia (`/api/users`), tambahkan metode handler `DELETE` untuk endpoint `/logout`. Contoh: `.delete("/logout", async ({ headers, set }) => { ... })`.
3. Ambil isi dari header `Authorization` (`headers.authorization`). Elysia melempar header strings menjadi format huruf kecil secara default.
4. Lakukan validasi:
   - Jika header `authorization` tidak ada, segera lempar peringatan error atau kembalikan response objek error yang akan ditangkap di `catch`.
   - Pastikan header yang dikirim berformat `"Bearer <token>"`.
   - Lakukan pemisahan teks spasi (`split(" ")`) untuk mengamankan string asli token. Jika gagal ekstrak token, lempar error `"unauthorized"`.
5. Di dalam blok `try...catch`, panggil fungsi `logoutUser(token_yang_diekstrak)` dari servis yang telah Anda buat di Langkah 1.
6. Apabila servis dieksekusi dengan baik, balas objek format JSON kepada klien `{ "data": hasil_kembalian_service_yaitu_OK }`.
7. Jika ditangkap oleh blok `catch` atau gagal divalidasi, jadikan objek JSON bernilai `{ "error": "unauthorized" }` dan set HTTP status ditaruh pada posisi *401 Unauthorized* (misal `set.status = 401`). Kembalikan generic error 500 jika error yang dilempar bukan "unauthorized" untuk berjaga-jaga.

### Langkah 4: Testing
1. Hidupkan runtime local aplikasi server.
2. Login sebagai pengguna untuk memperoleh token di proses login awal. 
3. Hit `DELETE /api/users/logout` menggunakan token yang benar di header `Authorization: Bearer <token>`. Pastikan ia merespons sukses `{"data": "OK"}`.
4. Segera cek database tabel `sessions`, pastikan record token tersebut sudah tuntas terhapus.
5. Coba hit ulang profil `POST /api/users/current` menggunakan token yang baru saja dilogout tadi. Pastikan request ditolak (Unauthorized) karena session-nya sudah tidak ada di dalam database.
