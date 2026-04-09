import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const INITIAL_MIGRATION = "20240409000000_init";
const INITIAL_TABLES = [
  "User",
  "UserPassword",
  "Team",
  "Membership",
  "Booking",
  "Attendee",
  "SalonDailyTip",
];

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function shouldResolveInitialMigration() {
  const db = new PrismaClient();

  try {
    const tables = await db.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    const existingTables = new Set(tables.map((row) => row.table_name));
    const schemaAlreadyExists = INITIAL_TABLES.every((tableName) =>
      existingTables.has(tableName),
    );

    if (!schemaAlreadyExists || !existingTables.has("_prisma_migrations")) {
      return false;
    }

    const migrations = await db.$queryRaw`
      SELECT finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name = ${INITIAL_MIGRATION}
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (migrations.length === 0) {
      return false;
    }

    const [migration] = migrations;
    const isFailed =
      migration.finished_at === null && migration.rolled_back_at === null;

    return isFailed;
  } catch (error) {
    console.warn(
      `Skipping migration auto-recovery check: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  } finally {
    await db.$disconnect();
  }
}

async function main() {
  if (await shouldResolveInitialMigration()) {
    console.log(
      `\nDetected a failed ${INITIAL_MIGRATION} entry with the production schema already present. Marking it as applied before deploy.`,
    );
    run("npx", ["prisma", "migrate", "resolve", "--applied", INITIAL_MIGRATION]);
  }

  run("npx", ["prisma", "migrate", "deploy"]);
  run("node", ["prisma/seed.mjs"]);

  const child = spawn("npm", ["run", "start"], {
    env: process.env,
    stdio: "inherit",
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
