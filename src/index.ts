import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";
import { swagger } from "@elysiajs/swagger";

export const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Vibecoding Backend API',
        description: 'Pusat Dokumentasi API Management User',
        version: '1.0.0'
      },
      tags: [
        { name: 'User', description: 'Endpoint penanganan profil dan otentikasi' }
      ]
    }
  }))
  .use(usersRoute)
  .get("/", () => "Hello from Bun + Elysia + Drizzle!", {
    response: {
      200: t.String({ default: "Hello from Bun + Elysia + Drizzle!" })
    },
    detail: {
      tags: ["System"],
      summary: "Pesan selamat datang"
    }
  })
  .get("/health", async () => {
    try {
      await db.select().from(users).limit(1);
      return { status: "ok", message: "Server and database are healthy!" };
    } catch (e) {
      return { status: "error", message: "Database connection failed." };
    }
  }, {
    response: {
      200: t.Object({
        status: t.String(),
        message: t.String()
      }),
      500: t.Object({
        status: t.String(),
        message: t.String()
      })
    },
    detail: {
      tags: ["System"],
      summary: "Pengecekan kesehatan sistem & database",
      responses: {
        200: {
          description: "Server sehat",
          content: {
            "application/json": {
              example: { status: "ok", message: "Server and database are healthy!" }
            }
          }
        },
        500: {
          description: "Koneksi database gagal",
          content: {
            "application/json": {
              example: { status: "error", message: "Database connection failed." }
            }
          }
        }
      }
    }
  });

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
