import { existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

/**
 * Load env before Nest/Prisma init. Supports monorepo cwd (repo root or apps/api).
 * Later files override earlier ones so apps/api/.env.local wins over root .env.
 */
const cwd = process.cwd();
const envPaths = [
  join(cwd, '.env'),
  join(cwd, '.env.local'),
  join(cwd, 'apps', 'api', '.env'),
  join(cwd, 'apps', 'api', '.env.local'),
];

for (const path of envPaths) {
  if (existsSync(path)) {
    config({ path, override: true });
  }
}
