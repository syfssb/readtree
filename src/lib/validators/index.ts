import { z } from 'zod';

export const wereadUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => url.includes('weread.qq.com'),
    { message: '请输入有效的微信读书链接' }
  );

export const bookIdSchema = z.string().min(1, '书籍 ID 不能为空');

export const summaryUpdateSchema = z.object({
  summary: z.string().max(10000, '总结不能超过 10000 字'),
});

export const manualQuoteSchema = z.object({
  text: z.string().min(1, '引用内容不能为空').max(2000, '引用不能超过 2000 字'),
});

export const cookieConfigSchema = z.object({
  cookie: z.string().min(1, 'Cookie 不能为空'),
});

export const addBookSchema = z.object({
  url: wereadUrlSchema,
});
