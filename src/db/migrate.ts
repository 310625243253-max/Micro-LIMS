import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, query, getClient, isUsingMemoryDb } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  console.log('[MIGRATIONS] Initializing database migration runner...');
  await initDb();

  // Create schema_migrations table if not exists
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL,
      version VARCHAR(255),
      applied_at TIMESTAMPTZ
    );
  `);

  const migrationsDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[MIGRATIONS] Directory not found: ${migrationsDir}`);
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`[MIGRATIONS] Found ${files.length} migration file(s).`);

  for (const file of files) {
    const checkRes = await query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      console.log(`[MIGRATIONS] Skipping already applied: ${file}`);
      continue;
    }

    console.log(`[MIGRATIONS] Applying migration: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');

    const client = await getClient();
    try {
      if (isUsingMemoryDb()) {
        // In-memory mode: Remove DO blocks, PL/pgSQL functions and triggers before splitting
        let preprocessed = sqlContent
          .replace(/DO\s+\$\$[\s\S]*?\$\$;/gi, '')
          .replace(/CREATE\s+OR\s+REPLACE\s+FUNCTION[\s\S]*?\$\$\s*LANGUAGE\s+plpgsql;/gi, '')
          .replace(/DROP\s+TRIGGER[\s\S]*?;/gi, '')
          .replace(/CREATE\s+TRIGGER[\s\S]*?;/gi, '')
          .replace(/CREATE\s+EXTENSION[\s\S]*?;/gi, '');

        const statements = preprocessed
          .split(/;\s*(?=\r?\n|$)/)
          .map(s => s.trim())
          .filter(s => {
            if (!s || s.length === 0) return false;
            const withoutComments = s.replace(/--.*$/gm, '').trim();
            return withoutComments.length > 0;
          });

        for (const stmt of statements) {
          const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
          if (cleanStmt) {
            try {
              await client.query(cleanStmt);
            } catch (stmtErr: any) {
              // If extension or type creation fails in memory, continue
              if (!cleanStmt.includes('CREATE EXTENSION')) {
                console.warn(`[MIGRATIONS] Statement warning in memory mode: ${stmtErr.message}`);
              }
            }
          }
        }
      } else {
        // Live PostgreSQL mode: Execute complete transactional script
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query('COMMIT');
      }

      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      console.log(`[MIGRATIONS] Successfully applied: ${file}`);
    } catch (err: any) {
      if (!isUsingMemoryDb()) {
        await client.query('ROLLBACK');
      }
      console.error(`[MIGRATIONS] Failed applying ${file}:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('[MIGRATIONS] All database migrations are up to date.');
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[MIGRATIONS] Fatal error during migration:', err);
      process.exit(1);
    });
}
