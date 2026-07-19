import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** Local disk destination for uploaded files (dev / `local` driver). */
export const UPLOAD_DIR = join(process.cwd(), 'uploads');
export const UPLOAD_ROUTE = '/uploads';

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
