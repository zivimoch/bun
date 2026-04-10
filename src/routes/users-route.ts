import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/user-services";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    try {
      const data = await registerUser(body);
      return { data };
    } catch (error: any) {
      if (error.message === "email sudah terdaftar") {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
    response: {
      200: t.Object({
        data: t.String({ default: "OK" }),
      }, { description: "Registrasi berhasil" }),
      400: t.Object({
        error: t.String({ default: "email sudah terdaftar" }),
      }, { description: "Email sudah terdaftar" }),
      422: t.Object({
        error: t.String({ default: "invalid email format" }),
      }, { description: "Payload tidak valid (format email/field kurang)" }),
      500: t.Object({
        error: t.String({ default: "Internal Server Error" }),
      }, { description: "Internal Server Error" }),
    },
    detail: {
      tags: ["User"],
      summary: "Mendaftarkan pengguna baru ke sistem",
      responses: {
        200: {
          description: "Registrasi berhasil",
          content: { "application/json": { example: { data: "OK" } } }
        },
        400: {
          description: "Email sudah terdaftar",
          content: { "application/json": { example: { error: "email sudah terdaftar" } } }
        },
        422: {
          description: "Payload tidak valid",
          content: { "application/json": { example: { error: "invalid email format" } } }
        },
        500: {
          description: "Internal Server Error",
          content: { "application/json": { example: { error: "Internal Server Error" } } }
        }
      }
    },
  })
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const data = await loginUser(body);
        return { data };
      } catch (error: any) {
        if (error.message === "email atau password salah") {
          set.status = 401;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
      response: {
        200: t.Object({
          data: t.String(),
        }),
        401: t.Object({
          error: t.String(),
        }),
        500: t.Object({
          error: t.String(),
        }),
      },
      detail: {
        tags: ["User"],
        summary: "Melakukan login untuk mendapatkan session token",
        responses: {
          200: {
            description: "Login berhasil, mengembalikan session token",
            content: { "application/json": { example: { data: "8c4e4264-3c76-4b16-899c-1be70d91108c" } } }
          },
          401: {
            description: "Kredensial salah",
            content: { "application/json": { example: { error: "email atau password salah" } } }
          },
          500: {
            description: "Internal Server Error",
            content: { "application/json": { example: { error: "Internal Server Error" } } }
          }
        }
      },
    }
  )
  .onError(({ error, set }) => {
    if (error && (error as any).message === "unauthorized") {
      set.status = 401;
      return { error: "unauthorized" };
    }
  })
  .group("", (app) =>
    app
      .derive(({ headers }) => {
        const auth = headers.authorization;
        if (!auth || !auth.startsWith("Bearer ")) {
          throw new Error("unauthorized");
        }
        const token = auth.split(" ")[1];
        if (!token) {
          throw new Error("unauthorized");
        }
        return { token };
      })
      .post(
        "/current",
        async ({ token, set }) => {
          try {
            const data = await getCurrentUser(token);
            return { data };
          } catch (error: any) {
            if (error.message === "unauthorized") {
              set.status = 401;
              return { error: error.message };
            }
            set.status = 500;
            return { error: "Internal Server Error" };
          }
        },
        {
          response: {
            200: t.Object({
              data: t.Object({
                id: t.Number(),
                name: t.String(),
                email: t.String(),
                createdAt: t.Nullable(t.Date()),
              }),
            }),
            401: t.Object({
              error: t.String(),
            }),
            500: t.Object({
              error: t.String(),
            }),
          },
          detail: {
            tags: ["User"],
            summary: "Mendapatkan profil data user yang sedang login",
            security: [{ bearerAuth: [] }],
            responses: {
              200: {
                description: "Profil pengguna berhasil diambil",
                content: { "application/json": { example: { data: { id: 1, name: "John Doe", email: "john@example.com", createdAt: new Date().toISOString() } } } }
              },
              401: {
                description: "Akses ditolak (token tidak valid)",
                content: { "application/json": { example: { error: "unauthorized" } } }
              },
              500: {
                description: "Internal Server Error",
                content: { "application/json": { example: { error: "Internal Server Error" } } }
              }
            }
          },
        }
      )
      .delete(
        "/logout",
        async ({ token, set }) => {
          try {
            const data = await logoutUser(token);
            return { data };
          } catch (error: any) {
            if (error.message === "unauthorized") {
              set.status = 401;
              return { error: error.message };
            }
            set.status = 500;
            return { error: "Internal Server Error" };
          }
        },
        {
          response: {
            200: t.Object({
              data: t.String(),
            }),
            401: t.Object({
              error: t.String(),
            }),
            500: t.Object({
              error: t.String(),
            }),
          },
          detail: {
            tags: ["User"],
            summary: "Menghapus session token (Logout)",
            security: [{ bearerAuth: [] }],
            responses: {
              200: {
                description: "Logout berhasil (sesi dihapus)",
                content: { "application/json": { example: { data: "OK" } } }
              },
              401: {
                description: "Akses ditolak (token tidak valid)",
                content: { "application/json": { example: { error: "unauthorized" } } }
              },
              500: {
                description: "Internal Server Error",
                content: { "application/json": { example: { error: "Internal Server Error" } } }
              }
            }
          },
        }
      )
  );
