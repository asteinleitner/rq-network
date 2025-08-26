import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const email = process.env.ADD_USER_EMAIL || 'alex@artisanfertility.com';
const networkId = process.env.ADD_NETWORK_ID as string;

if (!networkId) {
  console.error('ADD_NETWORK_ID is required');
  process.exit(1);
}

async function main() {
  // Ensure the user already exists (created via /auth/login earlier)
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`User ${email} not found. Log in once via /auth/login to create it.`);
  }

  // Create membership if missing, with NETWORK_ADMIN role
  await db.networkMembership.upsert({
    where: { userId_networkId: { userId: user.id, networkId } },
    update: { role: 'NETWORK_ADMIN' },
    create: { userId: user.id, networkId, role: 'NETWORK_ADMIN' },
  });

  console.log(JSON.stringify({ userId: user.id, networkId, role: 'NETWORK_ADMIN' }, null, 2));
}

main().finally(() => db.$disconnect());
