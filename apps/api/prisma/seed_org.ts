import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const org = await db.org.upsert({
    where: { name: 'Artisan Fertility Corporate' },
    update: {},
    create: { name: 'Artisan Fertility Corporate' }
  });

  // Attach any networks without an org to this org
  const nets = await db.network.findMany({ where: { orgId: null } });
  for (const n of nets) {
    await db.network.update({ where: { id: n.id }, data: { orgId: org.id } });
  }

  console.log('Org seeded:', org.name, '• attached networks:', nets.length);
}
main().finally(() => db.$disconnect());
