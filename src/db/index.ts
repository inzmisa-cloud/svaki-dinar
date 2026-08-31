import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;

export const db = drizzle(
  createClient({
    url: url ?? "file::memory:?cache=shared",
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
  { schema },
);
