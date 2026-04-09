import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("User API Tests", () => {
  beforeEach(async () => {
    // Clear sessions first because it has FK to users
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users (Registration)", () => {
    it("should register a new user successfully", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.data).toBe("OK");
    });

    it("should fail registration with invalid email format", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "invalid-email",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should fail registration if email already exists", async () => {
      // Pre-register user
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Original User",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      const res = await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Duplicate User",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as any;
      expect(body.error).toBe("email sudah terdaftar");
    });
  });

  describe("POST /api/users/login", () => {
    beforeEach(async () => {
      // Register a user for login tests
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("should login successfully with valid credentials", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.data).toBeDefined(); // Token

      // Verify session in DB
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, body.data),
      });
      expect(session).toBeDefined();
    });

    it("should fail login with wrong password", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(res.status).toBe(401);
      const body = (await res.json()) as any;
      expect(body.error).toBe("email atau password salah");
    });

    it("should fail login with non-existent email", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/users/current", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Profile User",
            email: "profile@example.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "profile@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = (await loginRes.json()) as any;
      token = loginBody.data;
    });

    it("should get current user profile successfully", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.data.name).toBe("Profile User");
      expect(body.data.email).toBe("profile@example.com");
      expect(body.data.password).toBeUndefined(); // Security check
    });

    it("should fail getting profile without Authorization header", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
        })
      );

      expect(res.status).toBe(401);
    });

    it("should fail getting profile with invalid token", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "POST",
          headers: { Authorization: "Bearer invalid-token" },
        })
      );

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/users/logout", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost:3000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );

      const loginRes = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );
      const loginBody = (await loginRes.json()) as any;
      token = loginBody.data;
    });

    it("should logout successfully", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.data).toBe("OK");

      // Verify session is deleted in DB
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.token, token),
      });
      expect(session).toBeUndefined();
    });

    it("should fail logout with invalid token", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: "Bearer invalid-token" },
        })
      );

      expect(res.status).toBe(401);
    });

    it("should fail logout twice with same token", async () => {
      // First logout
      await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      // Second logout
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/logout", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(res.status).toBe(401);
    });
  });
});
