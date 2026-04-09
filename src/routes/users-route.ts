import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../services/user-services";

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
    }
  );
