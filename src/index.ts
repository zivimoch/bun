import { Elysia } from "elysia";
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
  .get("/", () => "Hello from Bun + Elysia + Drizzle!")
  .get("/health", async () => {
    try {
      // Test database connection by executing a dummy query
      await db.select().from(users).limit(1);
      return { status: "ok", message: "Server and database are healthy!" };
    } catch (e) {
      return { status: "error", message: "Database connection failed." };
    }
  });

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
