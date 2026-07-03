import { db } from "./index";
import { properties, sessions } from "./schema";
import { seedDemoData, sampleCount } from "./seed-data";

const DEV_SESSION_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  await db.insert(sessions).values({ id: DEV_SESSION_ID }).onConflictDoNothing();

  await db.delete(properties);
  await seedDemoData(DEV_SESSION_ID);
  console.log(`Seeded ${sampleCount} properties for dev session ${DEV_SESSION_ID}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
