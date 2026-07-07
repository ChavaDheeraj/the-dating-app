import fs from 'fs';
import os from 'os';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const tmpDbPath = path.join(os.tmpdir(), 'dev.db');
const isHostedRuntime = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

const resolveFileDatabasePath = (databaseUrl: string) => {
  const filePath = databaseUrl.replace(/^file:/, '');
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
};

const copyBundledDatabaseToTmp = (sourcePath: string) => {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `SQLite database file was not found at ${sourcePath}. ` +
      "Make sure prisma/dev.db is committed and included in Next output tracing."
    );
  }

  const shouldCopy = !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0;
  if (shouldCopy) {
    fs.copyFileSync(sourcePath, tmpDbPath);
  }

  return tmpDbPath;
};

let databaseUrl = process.env.DATABASE_URL ?? `file:${sourceDbPath}`;

if (isHostedRuntime && databaseUrl.startsWith('file:')) {
  const configuredPath = resolveFileDatabasePath(databaseUrl);
  const sourcePath = fs.existsSync(configuredPath) ? configuredPath : sourceDbPath;
  databaseUrl = `file:${copyBundledDatabaseToTmp(sourcePath)}`;
}

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
