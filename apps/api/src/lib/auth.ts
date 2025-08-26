import jwt from "jsonwebtoken";
import type { FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export type AuthClaims = {
  sub: string;
  email: string;
  orgIds: string[];
  networkIds: string[];
};

export async function issueToken(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("user not found");

  const orgs = await db.orgMembership.findMany({ where: { userId } });
  const nets = await db.networkMembership.findMany({ where: { userId } });

  const claims: AuthClaims = {
    sub: user.id,
    email: user.email,
    orgIds: orgs.map(o => o.orgId),
    networkIds: nets.map(n => n.networkId),
  };

  const token = jwt.sign(claims, JWT_SECRET, { algorithm: "HS256", expiresIn: "12h" });
  return { token, claims };
}

export function verifyRequest(req: FastifyRequest): AuthClaims {
  const hdr = req.headers["authorization"];
  if (!hdr || !hdr.toLowerCase().startsWith("bearer ")) throw new Error("missing bearer");
  const token = hdr.slice(7);
  const decoded = jwt.verify(token, JWT_SECRET) as AuthClaims;
  return decoded;
}
