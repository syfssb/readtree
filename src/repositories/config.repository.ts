/**
 * Config Repository
 * 负责 user_config 表的数据访问操作（单行配置模式）
 */
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { userConfig } from '@/lib/db/schema';
import type { UserConfig } from '@/types/api';

/** 获取用户配置，不存在返回 null */
export async function getConfig(): Promise<UserConfig | null> {
  const rows = await getDb()
    .select()
    .from(userConfig)
    .where(eq(userConfig.id, 'default'));
  return (rows[0] ?? null) as UserConfig | null;
}

/** Upsert 用户配置（始终使用 id='default'） */
export async function upsertConfig(cookie: string): Promise<UserConfig> {
  const now = new Date().toISOString();
  const rows = await getDb()
    .insert(userConfig)
    .values({
      id: 'default',
      wereadCookie: cookie,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userConfig.id,
      set: {
        wereadCookie: cookie,
        updatedAt: now,
      },
    })
    .returning();
  return rows[0] as UserConfig;
}
