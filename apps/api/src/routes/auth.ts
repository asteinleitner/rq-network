import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { issueToken, verifyRequest } from "../lib/auth.js";

const db = new PrismaClient();

export default async function authRoutes(app: FastifyInstance) {
  // Dev-only register
  app.post("/auth/register", async (req, reply) => {
    if (process.env.DEV_AUTH !== "1") return reply.code(403).send({ ok: false, error: "disabled" });
    const body = (req.body ?? {}) as any;
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return reply.code(400).send({ ok: false, error: "email/password required" });

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return reply.code(400).send({ ok: false, error: "email exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({ data: { email, passwordHash } });
    const { token, claims } = await issueToken(user.id);
    return reply.send({ ok: true, token, claims });
  });

  // Login
  app.post("/auth/login", async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return reply.code(400).send({ ok: false, error: "email/password required" });

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ ok: false, error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ ok: false, error: "invalid credentials" });

    const { token, claims } = await issueToken(user.id);
    return reply.send({ ok: true, token, claims });
  });

  // Me
  app.get("/me", async (req, reply) => {
    try {
      const claims = verifyRequest(req);
      return reply.send({ ok: true, me: claims });
    } catch {
      return reply.code(401).send({ ok: false, error: "unauthorized" });
    }
  });

  // Tenant-scoped networks (for Console)
  app.get("/my/networks", async (req, reply) => {
    try {
      const claims = verifyRequest(req);
      const nets = await db.network.findMany({
        where: {
          OR: [
            { id: { in: claims.networkIds } },
            { orgId: { in: claims.orgIds } },
          ]
        },
        orderBy: { name: "asc" }
      });
      return reply.send(nets);
    } catch {
      return reply.code(401).send({ ok: false, error: "unauthorized" });
    }
  });
}
