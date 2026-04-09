import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

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
