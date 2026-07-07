import fs from 'fs';
import os from 'os';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const tmpDbPath = path.join(os.tmpdir(), 'dev.db');

let resolvedDbPath = sourceDbPath;
if (process.env.DATABASE_URL) {
  resolvedDbPath = process.env.DATABASE_URL.replace(/^file:/, '');
} else if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
  resolvedDbPath = tmpDbPath;
}

if (!process.env.DATABASE_URL && resolvedDbPath !== sourceDbPath) {
  if (!fs.existsSync(resolvedDbPath)) {
    if (fs.existsSync(sourceDbPath)) {
      fs.copyFileSync(sourceDbPath, resolvedDbPath);
    } else {
      fs.writeFileSync(resolvedDbPath, '');
    }
  }
}

const databaseUrl = process.env.DATABASE_URL ?? `file:${resolvedDbPath}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
