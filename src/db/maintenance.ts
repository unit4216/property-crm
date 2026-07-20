import "server-only";
import { inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { SESSION_MAX_AGE } from "@/lib/session-cookie";

// Deletes anonymous sessions whose cookie has already expired. The session
// cookie is set once with a SESSION_MAX_AGE lifetime and never refreshed
// (see proxy.ts), so once a row is older than that the visitor can no longer
// present the cookie and the data is permanently orphaned. Removing the
// session cascades to its properties, leases, lease_tenants, and tenants.
export async function deleteExpiredSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - SESSION_MAX_AGE * 1000);
  const deleted = await db
    .delete(sessions)
    .where(lt(sessions.createdAt, cutoff))
    .returning({ id: sessions.id });
  return deleted.length;
}

// Generates throwaway write traffic to keep the database from being paused for
// inactivity (Supabase pauses free-tier projects after a quiet period). Inserts
// a batch of bare session rows, then immediately deletes exactly those rows by
// id. Bare sessions have no dependent properties/tenants, so nothing is orphaned
// even transiently. Invoked by the keep-alive Vercel Cron (see vercel.json).
export async function runKeepAlive(rows = 20): Promise<number> {
  const inserted = await db
    .insert(sessions)
    .values(Array.from({ length: rows }, () => ({})))
    .returning({ id: sessions.id });

  const ids = inserted.map((row) => row.id);
  if (ids.length > 0) {
    await db.delete(sessions).where(inArray(sessions.id, ids));
  }
  return ids.length;
}
