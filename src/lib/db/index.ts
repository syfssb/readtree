import * as schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = any;

let _db: DrizzleDb | null = null;

/**
 * 获取数据库连接。
 * - 本地开发：使用 better-sqlite3（文件型 SQLite）
 * - Vercel/云端：使用 Turso（TURSO_DATABASE_URL 环境变量）
 */
export function getDb(): DrizzleDb {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

function createDb(): DrizzleDb {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    return createTursoDb(tursoUrl);
  }

  return createLocalDb();
}

function createTursoDb(url: string): DrizzleDb {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@libsql/client');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/libsql');

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}

function createLocalDb(): DrizzleDb {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path');

  const dbPath = path.resolve(process.cwd(), 'data', 'readtree.db');
  const sqlite = new Database(dbPath);

  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return drizzle(sqlite, { schema });
}

export type DbInstance = DrizzleDb;
