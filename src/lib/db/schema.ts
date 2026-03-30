import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  coverUrl: text('cover_url'),
  wereadBookId: text('weread_book_id').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const chapters = sqliteTable('chapters', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  chapterUid: integer('chapter_uid').notNull(),
  title: text('title').notNull(),
  level: integer('level').notNull(),
  orderIndex: integer('order_index').notNull(),
  summary: text('summary'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const highlights = sqliteTable('highlights', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  range: text('range'),
  colorStyle: integer('color_style').notNull().default(0),
  wereadBookmarkId: text('weread_bookmark_id').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  abstract: text('abstract'),
  wereadReviewId: text('weread_review_id').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const manualQuotes = sqliteTable('manual_quotes', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const userConfig = sqliteTable('user_config', {
  id: text('id').primaryKey().$defaultFn(() => 'default'),
  wereadCookie: text('weread_cookie').notNull(),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
