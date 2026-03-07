import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'animate-pulse rounded-2xl bg-gray-200/80 dark:bg-gray-700/70',
        className
      )}
      {...props}
    />
  );
}
