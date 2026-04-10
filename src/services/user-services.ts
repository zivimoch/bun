import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini akan mengecek ketersediaan email, melakukan hashing password menggunakan bcrypt,
 * dan menyimpan entri pengguna baru ke dalam database tabel `users`.
 * 
 * @param {any} payload - Objek payload dari request body yang berisi name, email, dan password.
 * @returns {Promise<string>} - Mengembalikan string "OK" jika pendaftaran berhasil.
 * @throws {Error} - Melempar error "email sudah terdaftar" jika email tersebut menduplikasi data yang sudah ada.
 */
export const registerUser = async (payload: any) => {
  const { name, email, password } = payload;

  // Check if email already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw new Error("email sudah terdaftar");
  }

  // Hash password using bcrypt
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // Insert user
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return "OK";
};

/**
 * Melakukan proses log in pengguna dan menghasilkan token sesi (session token).
 * Fungsi ini mencari pengguna berdasarkan email, memverifikasi kata sandi,
 * membuat token UUID, dan menyimpannya di tabel `sessions`.
 * 
 * @param {any} payload - Objek payload dari request body yang berisi email dan password.
 * @returns {Promise<string>} - Mengembalikan token sesi bertipe UUID yang berlaku untuk autentikasi.
 * @throws {Error} - Melempar error "email atau password salah" jika kredensial tidak valid.
 */
export const loginUser = async (payload: any) => {
  const { email, password } = payload;

  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error("email atau password salah");
  }

  // Verify password
  const isMatch = await Bun.password.verify(password, user.password);

  if (!isMatch) {
    throw new Error("email atau password salah");
  }

  // Create session token (UUID)
  const token = crypto.randomUUID();

  // Save session to database
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
};

/**
 * Mendapatkan data profil pengguna yang saat ini sedang aktif (login) secara aman (tanpa password).
 * Fungsi ini mencocokkan token sesi dari database `sessions` dan menarik data dasar pengguna 
 * dari tabel `users` (id, name, email, createdAt).
 * 
 * @param {string} token - Token bearer yang diekstrak dari header otorisasi.
 * @returns {Promise<object>} - Mengembalikan list data objek pengguna jika sesi/token memang valid.
 * @throws {Error} - Melempar error "unauthorized" jika sesi gagal ditemui.
 */
export const getCurrentUser = async (token: string) => {
  // Find session
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, token),
  });

  if (!session) {
    throw new Error("unauthorized");
  }

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("unauthorized");
  }

  return user;
};

/**
 * Mengakhiri sesi pengguna aktif (Logout).
 * Fungsi ini mencoba menghapus token unik dari tabel `sessions` secara langsung.
 * Jika tidak ada baris yang terpengaruh (affectedRows === 0), artinya token tersebut sudah tidak sah.
 * 
 * @param {string} token - Token yang aktif yang akan dihanguskan.
 * @returns {Promise<string>} - Mengembalikan respon text "OK" saat sesi sukses terhapus.
 * @throws {Error} - Melempar error "unauthorized" apabila token memang tidak terdaftar.
 */
export const logoutUser = async (token: string) => {
  // Delete session directly and check if any row was affected
  const [result] = await db.delete(sessions).where(eq(sessions.token, token));

  if (result.affectedRows === 0) {
    throw new Error("unauthorized");
  }

  return "OK";
};
