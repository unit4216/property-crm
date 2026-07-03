import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { seedDemoData } from "@/db/seed-data";
import { SESSION_COOKIE } from "@/lib/session-cookie";

// Reads the session id proxy.ts assigned to this visitor and lazily ensures
// a matching row (+ demo data) exists. Memoized per request so repeated
// calls across a render pass only hit the DB once.
export const getSessionId = cache(async (): Promise<string> => {
  const cookieStore = await cookies();
  const id = cookieStore.get(SESSION_COOKIE)?.value;
  if (!id) {
    throw new Error("Missing session_id cookie — is proxy.ts running?");
  }

  const inserted = await db
    .insert(sessions)
    .values({ id })
    .onConflictDoNothing()
    .returning({ id: sessions.id });

  if (inserted.length > 0) {
    await seedDemoData(id);
  }

  return id;
});
