# Issue: Tambahkan Fitur Dokumentasi Swagger (OpenAPI)

## Deskripsi Tugas
Agar spesifikasi API dapat digunakan, diuji, dan dibaca dengan mudah oleh pengguna maupun tim Frontend (bahkan pihak ketiga), aplikasi ini memerlukan sistem dokumentasi UI yang interaktif. Di ekosistem ElysiaJS, kita bisa mencapai ini sangat cepat menggunakan plugin resmi **Swagger**.

Fitur ini akan secara otomatis membuat halaman web (seperti `/swagger`) di mana seluruh API Route beserta request body, parameter, dan status balasan akan terdokumentasi otomatis ke standar OpenAPI.

---

## 1. Lokasi Aplikasi dan Target
- **Plugin Tambahan**: `@elysiajs/swagger`
- **Entry Point File**: `src/index.ts`
- **URL Dokumentasi (Target)**: `http://localhost:3000/swagger`

---

## 2. Tahapan Implementasi (Step-by-Step)

Anggap ini sebagai tutorial atau _checklist_ rincinya. Lakukan instalasi hingga uji integrasinya:

### Langkah 1: Instalasi Library
Kita wajib menggunakan _framework plugin_ bawaan dari ekosistem pembuat Elysia itu sendiri agar 100% kompatibel dan ringan.
- Jalankan perintah instalasi berikut di terminal (pastikan berada di dalam folder proyek utama):
  ```bash
  bun add @elysiajs/swagger
  ```

### Langkah 2: Registrasikan Plugin ke Aplikasi Utama
- Buka file *entry point* di `src/index.ts`.
- Tambahkan baris impor _(import)_ untuk library yang baru saja kita instal di bagian paling atas:
  ```typescript
  import { swagger } from "@elysiajs/swagger";
  ```
- Cari variabel utama server yang mendefinisikan instance Elysia (misalnya `const app = new Elysia()` atau `export const app = new Elysia()`).
- Daftarkan plugin Swagger dengan memanggil metode `use()` **sebelum** mendefinisikan router bawaan lainnya, seperti ini:
  ```typescript
  export const app = new Elysia()
    .use(swagger({
        documentation: {
            info: {
                title: 'Vibecoding Backend API',
                version: '1.0.0',
                description: 'Dokumentasi lengkap API Management User.'
            }
        }
    }))
    // ... lalu lanjutkan dengan app.use(usersRoute) dan route lainnya dibawahnya
  ```
_*(Penjelasan: Setting `documentation.info` di dalam argumen swagger bersifat opsional namun memberikan tampilan identitas web yang lebih estetik dan profesional ketimbang UI Polos).*_

### Langkah 3: Penambahan Keterangan Endpoint (Opsional tapi Direkomendasikan)
Elysia secara pintar membaca tipe validasi Typebox yang ada di _route parameter_ secara ajaib. Tetapi jika ingin mempercantik UI, masuklah ke file route misal `src/routes/users-route.ts`.
- Di setiap parameter argumen (di mana blok validasi `t.Object` berada), tambahkan properti `detail: { summary: "Fungsi x", tags: ["Users"] }`.
- Contoh penerapan kasarnya (opsional):
  ```typescript
  {
      body: t.Object({ ... }),
      detail: { 
          summary: 'Mendaftarkan User Baru', 
          tags: ['Authentication'] 
      }
  }
  ```
  Langkah 3 ini bisa di-skip jika Anda ingin implementasi _bare minimum_ terlebih dahulu.

### Langkah 4: Testing & Verifikasi
1. Pastikan tidak ada error Type pada Typescript.
2. Jalankan aplikasi seperti biasa dengan menjalankan skrip eksekusi lokal: `bun run src/index.ts`.
3. Buka browser dan pergi ke tautan uji fungsi: **http://localhost:3000/swagger**.
4. Verifikasi bahwa Anda melihat tampilan _User Interface_ (UI) khas Swagger UI abu-abu/hijau.
5. Coba salah satu tombol test endpoint "Try it out" untuk memastikan request API dari Swagger bisa merespons data yang semestinya dikembalikan backend.
