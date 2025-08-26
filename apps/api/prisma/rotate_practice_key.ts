import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const db = new PrismaClient();

async function main() {
  // 1) Find first network & practice (matches your seeded demo)
  const net = await db.network.findFirst({});
  if (!net) throw new Error('No network found');
  const practice = await db.practice.findFirst({ where: { networkId: net.id } });
  if (!practice) throw new Error('No practice found in network');

  // 2) Read public key from absolute path
  const pemPath = resolve(process.env.HOME || '', 'rq-network', 'secrets', 'practice_public.pem');
  const pem = readFileSync(pemPath, 'utf8');

  // 3) Deactivate previous active keys
  await db.practiceKey.updateMany({
    where: { practiceId: practice.id, isActive: true },
    data: { isActive: false }
  });

  // 4) Insert new active key
  const key = await db.practiceKey.create({
    data: { practiceId: practice.id, publicKeyPem: pem, isActive: true }
  });

  console.log(JSON.stringify({ practiceId: practice.id, keyId: key.id }, null, 2));
}

main().finally(() => db.$disconnect());
