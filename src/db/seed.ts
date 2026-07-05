import { db } from "./index";
import { properties, tenants, sessions } from "./schema";
import {
  seedDemoData,
  sampleCount,
  tenantCount,
  unitCount,
  leaseCount,
} from "./seed-data";

const DEV_SESSION_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  await db.insert(sessions).values({ id: DEV_SESSION_ID }).onConflictDoNothing();

  // Clear demo data everywhere. Deleting properties cascades to leases and
  // lease_tenants; tenants are session-scoped and cleared separately.
  await db.delete(properties);
  await db.delete(tenants);

  // Reseed *every* existing session, not just the dev one. Each browser gets
  // its own session id via a cookie, so seeding only DEV_SESSION_ID would
  // leave real visitors staring at an empty app after a reseed.
  const allSessions = await db.select({ id: sessions.id }).from(sessions);
  for (const session of allSessions) {
    await seedDemoData(session.id);
  }

  console.log(
    `Seeded ${sampleCount} properties, ${unitCount} units, ${tenantCount} tenants, ` +
      `and ${leaseCount} leases into ${allSessions.length} session(s).`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
