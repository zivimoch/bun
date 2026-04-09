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
      .post("/current", async ({ token, set }) => {
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
      })
      .delete("/logout", async ({ token, set }) => {
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
      })
  );
