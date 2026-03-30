'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/** 卡片基础样式：三层微阴影 + 圆角 + 边框 */
const cardBaseStyles =
  'bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--shadow-card)]';

/**
 * 卡片容器组件
 *
 * @example
 * <Card>
 *   <CardHeader>标题</CardHeader>
 *   <CardBody>内容</CardBody>
 *   <CardFooter>底部操作</CardFooter>
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(cardBaseStyles, className)} {...props}>
      {children}
    </div>
  )
);
Card.displayName = 'Card';

/** 卡片头部：带底部间距 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

/** 卡片主体内容 */
export const CardBody = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = 'CardBody';

/** 卡片底部：带顶部间距和分隔线 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-4 pt-4 border-t border-[var(--color-border)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
