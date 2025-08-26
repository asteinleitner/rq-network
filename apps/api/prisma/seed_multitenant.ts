import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.DEV_ADMIN_EMAIL || "alex@example.com";
  const password = process.env.DEV_ADMIN_PASSWORD || "devpass123";
  const hash = await bcrypt.hash(password, 10);

  // 1) Ensure an Org + Network exist
  let org = await db.org.findFirst();
  if (!org) org = await db.org.create({ data: { name: "Artisan Fertility Corporate" } });

  let network = await db.network.findFirst({ where: { orgId: org.id } });
  if (!network) network = await db.network.create({ data: { name: "Demo Network", orgId: org.id } });

  // 2) Create or update user
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({ data: { email, passwordHash: hash } });
  } else {
    // keep current hash if exists
  }

  // 3) Add memberships (upsert)
  await db.orgMembership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: { role: "ORG_OWNER" },
    create: { userId: user.id, orgId: org.id, role: "ORG_OWNER" },
  });

  await db.networkMembership.upsert({
    where: { userId_networkId: { userId: user.id, networkId: network.id } },
    update: { role: "NETWORK_ADMIN" },
    create: { userId: user.id, networkId: network.id, role: "NETWORK_ADMIN" },
  });

  console.log(JSON.stringify({ user, org, network }, null, 2));
}

main().finally(() => db.$disconnect());
