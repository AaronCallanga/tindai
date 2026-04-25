import type * as SQLite from 'expo-sqlite';

import { LOCAL_INDEX_STATEMENTS, getCreateTableStatements } from './localSchema';

async function ensureColumn(database: SQLite.SQLiteDatabase, tableName: string, columnName: string, definition: string) {
  const columns = await database.getAllAsync<{ name: string }>(`pragma table_info(${tableName})`);
  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await database.execAsync(`alter table ${tableName} add column ${columnName} ${definition}`);
}

export async function runLocalMigrations(database: SQLite.SQLiteDatabase) {
  await database.execAsync('pragma foreign_keys = on');

  for (const statement of getCreateTableStatements()) {
    await database.execAsync(statement);
  }

  await ensureColumn(database, 'app_state', 'onboarding_completed', "integer not null default 0");
  await ensureColumn(database, 'app_state', 'auth_mode', 'text');
  await ensureColumn(database, 'app_state', 'microphone_permission', "text not null default 'pending'");
  await ensureColumn(database, 'app_state', 'storage_permission', "text not null default 'pending'");
  await ensureColumn(database, 'app_state', 'tutorial_shown', "integer not null default 0");
  await ensureColumn(database, 'app_state', 'guest_converted', "integer not null default 0");

  for (const statement of LOCAL_INDEX_STATEMENTS) {
    await database.execAsync(statement);
  }
}
