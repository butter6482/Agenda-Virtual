/**
 * Seed script for CoquiBook standalone app.
 * Run: node prisma/seed.mjs
 *
 * Creates 3 users (1 owner + 2 staff) and links them in a team.
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

const SALT_ROUNDS = 12;

const USERS = [
  { email: "hbstyle@hb.pr",           name: "HB Style & Hair Gallery", password: "Kata123",          teamRole: "OWNER"  },
  { email: "marielis@coquibook.pr",    name: "Marielis",                 password: "Marielis@CQ2025!", teamRole: "MEMBER" },
  { email: "yasmary@coquibook.pr",     name: "Yasmary",                  password: "Yasmary@CQ2025!", teamRole: "MEMBER" },
];

async function main() {
  console.log("🌺 Seeding CoquiBook...\n");

  const createdUsers = [];

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);

    const user = await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        email: u.email,
        name: u.name,
        timeZone: "America/Puerto_Rico",
        password: { create: { hash } },
      },
    });

    // Update password hash on upsert-update path
    await db.userPassword.upsert({
      where: { userId: user.id },
      create: { userId: user.id, hash },
      update: { hash },
    });

    console.log(`✅  ${u.email} (id=${user.id})`);
    createdUsers.push({ ...user, teamRole: u.teamRole });
  }

  // Create team
  let team = await db.team.findFirst({ where: { name: "HB Style Salón" } });
  if (!team) {
    team = await db.team.create({ data: { name: "HB Style Salón" } });
    console.log(`\n✅  Team: ${team.name} (id=${team.id})`);
  } else {
    console.log(`\n⏭️  Team exists: ${team.name} (id=${team.id})`);
  }

  // Add memberships
  for (const u of createdUsers) {
    await db.membership.upsert({
      where: { userId_teamId: { userId: u.id, teamId: team.id } },
      create: { userId: u.id, teamId: team.id, role: u.teamRole, accepted: true },
      update: { role: u.teamRole, accepted: true },
    });
    console.log(`  👥 ${u.name} → ${u.teamRole}`);
  }

  await db.$disconnect();

  console.log(`
✨ Listo! Credenciales:

┌─────────────────────────────────────────────────────┐
│  CUENTA PRINCIPAL (HB Style & Hair Gallery)         │
│  Email:    hbstyle@hb.pr                            │
│  Password: Kata123                                  │
├─────────────────────────────────────────────────────┤
│  MARIELIS (empleada)                                │
│  Email:    marielis@coquibook.pr                    │
│  Password: Marielis@CQ2025!                         │
├─────────────────────────────────────────────────────┤
│  YASMARY (empleada)                                 │
│  Email:    yasmary@coquibook.pr                     │
│  Password: Yasmary@CQ2025!                          │
└─────────────────────────────────────────────────────┘
`);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
