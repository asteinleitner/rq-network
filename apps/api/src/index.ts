import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import authRoutes from './routes/auth.js';

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });
await fastify.register(authRoutes);

const prisma = new PrismaClient();

/* =============== UTIL =============== */
// Very light bearer token extractor (authRoutes defines /auth/login etc.)
// Use on endpoints that should be protected later.
function bearer(req: any): string | null {
  const h = req.headers['authorization'] as string | undefined;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/.exec(h);
  return m ? m[1] : null;
}

/* =============== HEALTH =============== */
fastify.get('/health', async () => ({ ok: true }));

/* =============== ORGS =============== */
fastify.get('/orgs', async () =>
  prisma.org.findMany({ orderBy: { createdAt: 'asc' } })
);

fastify.get('/orgs/:id/networks', async (req: any) =>
  prisma.network.findMany({
    where: { orgId: req.params.id },
    orderBy: { createdAt: 'asc' },
  })
);

// Drafts (Org scope)
fastify.get('/orgs/:id/draft', async (req: any) =>
  prisma.draft.findFirst({
    where: {
      OR: [
        { orgId: req.params.id },
        { AND: [{ scope: 'org' }, { scopeId: req.params.id }] },
      ],
    },
  })
);

fastify.put('/orgs/:id/draft', async (req: any) => {
  const id = req.params.id;
  const body = req.body ?? {};
  const existing = await prisma.draft.findFirst({
    where: {
      OR: [
        { orgId: id },
        { AND: [{ scope: 'org' }, { scopeId: id }] },
      ],
    },
  });
  if (existing) {
    return prisma.draft.update({
      where: { id: existing.id },
      data: { data: body, scope: 'org', scopeId: id, orgId: id },
    });
  }
  return prisma.draft.create({
    data: { data: body, scope: 'org', scopeId: id, orgId: id },
  });
});

// Publish bundle (Org scope) and set current on Org
const OrgPublishSchema = z.object({
  meta: z.object({
    title: z.string().default('Untitled'),
    author: z.string().default('Corporate Admin'),
    version: z.string().default('1.0.0'),
  }).passthrough(),
  data: z.object({}).passthrough(),
});

fastify.post('/orgs/:id/bundles', async (req: any, reply) => {
  const id = req.params.id as string;
  const parsed = OrgPublishSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: parsed.error.flatten() });
  }

  const b = await prisma.bundle.create({
    data: {
      meta: parsed.data.meta as any,
      data: parsed.data.data as any,
    },
  });

  await prisma.org.update({
    where: { id },
    data: { currentBundleId: b.id },
  });

  return b;
});

fastify.get('/orgs/:id/current', async (req: any) => {
  const o = await prisma.org.findUnique({ where: { id: req.params.id } });
  return { currentBundleId: o?.currentBundleId ?? null };
});

fastify.put('/orgs/:id/current', async (req: any, reply) => {
  const id = req.params.id as string;
  const { bundleId } = (req.body ?? {}) as { bundleId?: string };
  if (!bundleId) {
    return reply.code(400).send({ ok: false, error: 'bundleId required' });
  }
  await prisma.org.update({ where: { id }, data: { currentBundleId: bundleId } });
  return { ok: true };
});

/* =============== NETWORKS =============== */
fastify.get('/networks', async () =>
  prisma.network.findMany({ orderBy: { createdAt: 'asc' } })
);

fastify.get('/networks/:id/practices', async (req: any) =>
  prisma.practice.findMany({
    where: { networkId: req.params.id },
    orderBy: { name: 'asc' },
  })
);

// Drafts (Network scope)
fastify.get('/networks/:id/draft', async (req: any) =>
  prisma.draft.findFirst({
    where: {
      OR: [
        { networkId: req.params.id },
        { AND: [{ scope: 'network' }, { scopeId: req.params.id }] },
      ],
    },
  })
);

fastify.put('/networks/:id/draft', async (req: any) => {
  const id = req.params.id;
  const body = req.body ?? {};
  const existing = await prisma.draft.findFirst({
    where: {
      OR: [
        { networkId: id },
        { AND: [{ scope: 'network' }, { scopeId: id }] },
      ],
    },
  });
  if (existing) {
    return prisma.draft.update({
      where: { id: existing.id },
      data: { data: body, scope: 'network', scopeId: id, networkId: id },
    });
  }
  return prisma.draft.create({
    data: { data: body, scope: 'network', scopeId: id, networkId: id },
  });
});

// Publish bundle (Network scope) and set current on Network
const NetPublishSchema = z.object({
  meta: z.object({
    title: z.string().default('Untitled'),
    author: z.string().default('Network Admin'),
    version: z.string().default('1.0.0'),
  }).passthrough(),
  data: z.object({}).passthrough(),
});

fastify.post('/networks/:id/bundles', async (req: any, reply) => {
  const networkId = req.params.id as string;
  const parsed = NetPublishSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ ok: false, error: parsed.error.flatten() });
  }

  const b = await prisma.bundle.create({
    data: {
      meta: parsed.data.meta as any,
      data: parsed.data.data as any,
    },
  });

  await prisma.network.update({
    where: { id: networkId },
    data: { currentBundleId: b.id },
  });

  return b;
});

fastify.get('/networks/:id/current', async (req: any) => {
  const n = await prisma.network.findUnique({ where: { id: req.params.id } });
  return { currentBundleId: n?.currentBundleId ?? null };
});

/* =============== PRACTICE KEYS =============== */
fastify.get('/practices/:id/public-key', async (req: any) => {
  const key = await prisma.practiceKey.findFirst({
    where: { practiceId: req.params.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return key ? { publicKeyPem: key.publicKeyPem } : { publicKeyPem: null };
});

fastify.post('/practices/:id/public-key', async (req: any, reply) => {
  const practiceId = req.params.id as string;
  const { publicKeyPem } = (req.body ?? {}) as { publicKeyPem?: string };
  if (!publicKeyPem) {
    return reply.code(400).send({ ok: false, error: 'publicKeyPem required' });
  }
  // Deactivate old keys, activate the new one
  await prisma.practiceKey.updateMany({
    where: { practiceId, isActive: true },
    data: { isActive: false },
  });
  const created = await prisma.practiceKey.create({
    data: { practiceId, publicKeyPem, isActive: true },
  });
  return { ok: true, id: created.id };
});

/* =============== SUBMISSIONS =============== */
// Recent submissions for a practice (metadata only)
fastify.get('/practices/:id/submissions', async (req: any) => {
  const limit = Number(req.query?.limit ?? 10);
  return prisma.submission.findMany({
    where: { practiceId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 100)),
    select: { id: true, createdAt: true, bundleId: true, bundleHash: true },
  });
});

// Encrypted blob (doctor fetches to decrypt locally)
fastify.get('/submissions/:id/blob', async (req: any, reply) => {
  const s = await prisma.submission.findUnique({ where: { id: req.params.id } });
  if (!s) return reply.code(404).send({ ok: false, error: 'not found' });
  // Assuming you store ciphertext, iv, tag, wrappedDEK as integer arrays or strings
  return {
    id: s.id,
    bundleId: s.bundleId,
    bundleHash: (s as any).bundleHash ?? null,
    createdAt: s.createdAt,
    ciphertext: (s as any).ciphertext,
    iv: (s as any).iv,
    tag: (s as any).tag,
    wrappedDEK: (s as any).wrappedDEK,
  };
});

/* =============== START =============== */
const PORT = Number(process.env.PORT ?? 8787);
await fastify.listen({ host: '127.0.0.1', port: PORT });
fastify.log.info(`API on http://127.0.0.1:${PORT}`);
