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

export const logoutUser = async (token: string) => {
  // Delete session directly and check if any row was affected
  const [result] = await db.delete(sessions).where(eq(sessions.token, token));

  if (result.affectedRows === 0) {
    throw new Error("unauthorized");
  }

  return "OK";
};
