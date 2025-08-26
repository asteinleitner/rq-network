import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const DEMO_PEM = `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJbq6vJzZbmiD7RVi3YbTqv1rtiQ2KJr
H5I0YQcyF8m3lgKLuVwzCkVxB7G4t3kVjvJc2mKp+q1iFq4eZrVh7IsCAwEAAQ==
-----END PUBLIC KEY-----`;

async function main() {
  // 1) Org
  const org = await db.org.upsert({
    where: { name: 'Artisan Fertility Corporate' },
    update: {},
    create: { name: 'Artisan Fertility Corporate' }
  });

  // 2) Network under org
  let net = await db.network.findFirst({ where: { orgId: org.id } });
  if (!net) {
    net = await db.network.create({
      data: { name: 'Demo Network', orgId: org.id }
    });
  }

  // 3) Practice in that network
  let prac = await db.practice.findFirst({ where: { networkId: net.id } });
  if (!prac) {
    prac = await db.practice.create({ data: { name: 'Demo OB/GYN', networkId: net.id } });
  }

  // 4) Active practice key
  const key = await db.practiceKey.findFirst({ where: { practiceId: prac.id, isActive: true } });
  if (!key) {
    await db.practiceKey.create({
      data: { practiceId: prac.id, publicKeyPem: DEMO_PEM, isActive: true }
    });
  }

  // 5) Patient + active care episode to this practice
  const patientId = 'patient_demo_001';
  await db.patient.upsert({ where: { id: patientId }, update: {}, create: { id: patientId } });

  const active = await db.careEpisode.findFirst({ where: { patientId, endAt: null } });
  if (!active) {
    await db.careEpisode.create({ data: { patientId, practiceId: prac.id } });
  }

  console.log(JSON.stringify({
    orgId: org.id,
    networkId: net.id,
    practiceId: prac.id,
    patientId
  }, null, 2));
}

main().finally(() => db.$disconnect());
