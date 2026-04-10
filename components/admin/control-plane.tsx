import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/shared/utils/utils';

type Tone = 'default' | 'signal' | 'mint';
type ButtonVariant = 'ghost' | 'primary';

export function AdminPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-8 admin-reveal', className)}>{children}</div>;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-reveal flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--admin-text-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-signal-2)]" />
            {eyebrow}
          </div>
        ) : null}
        <div className="space-y-2">
          <h1 className="admin-display text-5xl font-semibold leading-none text-[var(--admin-text)] sm:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--admin-text-soft)] sm:text-lg">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="admin-reveal admin-reveal-delay-1 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

type AdminLinkButtonProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'className' | 'children'> & {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type AdminButtonProps = ComponentPropsWithoutRef<'button'> & {
  href?: undefined;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

export function AdminActionButton(props: AdminLinkButtonProps | AdminButtonProps) {
  const { className, variant = 'ghost' } = props;
  const baseClassName = cn(
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-signal)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    variant === 'primary'
      ? 'border border-[rgba(177,140,255,0.4)] bg-[linear-gradient(135deg,rgba(177,140,255,0.32),rgba(121,224,210,0.14))] text-[var(--admin-text)] shadow-[0_18px_40px_rgba(82,61,140,0.28)] hover:-translate-y-0.5 hover:border-[rgba(177,140,255,0.6)] hover:bg-[linear-gradient(135deg,rgba(177,140,255,0.42),rgba(121,224,210,0.2))]'
      : 'border border-[var(--admin-border)] bg-white/[0.03] text-[var(--admin-text-soft)] hover:-translate-y-0.5 hover:border-[var(--admin-border-strong)] hover:bg-white/[0.07] hover:text-[var(--admin-text)]',
    className
  );

  if ('href' in props && props.href) {
    const { href, children, variant: _variant, className: _className, ...linkProps } =
      props as AdminLinkButtonProps;
    return (
      <Link href={href} className={baseClassName} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { children, variant: _variant, className: _className, type, ...buttonProps } =
    props as AdminButtonProps;
  const buttonType: 'button' | 'submit' | 'reset' =
    type === 'submit' || type === 'reset' ? type : 'button';
  return (
    <button type={buttonType} className={baseClassName} {...buttonProps}>
      {children}
    </button>
  );
}

export function AdminPanel({
  title,
  description,
  aside,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        'admin-panel relative overflow-hidden rounded-[30px] p-5 sm:p-6',
        className
      )}
    >
      {(title || description || aside) ? (
        <div className="admin-ambient-line flex flex-col gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-xl font-semibold tracking-tight text-[var(--admin-text)]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--admin-text-soft)]">{description}</p>
            ) : null}
          </div>
          {aside}
        </div>
      ) : null}
      <div className={cn(title || description || aside ? 'pt-5' : '', contentClassName)}>{children}</div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  href?: string;
  tone?: Tone;
}) {
  return (
    <div className="admin-panel admin-reveal admin-reveal-delay-1 relative overflow-hidden rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[var(--admin-text-muted)]">
            {label}
          </p>
          <div className="flex items-baseline gap-3">
            <p className="admin-display text-4xl font-semibold text-[var(--admin-text)]">{value}</p>
          </div>
          <p className="max-w-[20ch] text-sm leading-6 text-[var(--admin-text-soft)]">{detail}</p>
        </div>
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl border',
            tone === 'signal'
              ? 'border-[rgba(177,140,255,0.24)] bg-[rgba(177,140,255,0.14)] text-[#d8c8ff]'
              : tone === 'mint'
                ? 'border-[rgba(102,223,212,0.2)] bg-[rgba(102,223,212,0.12)] text-[#9ce7dd]'
                : 'border-white/10 bg-white/[0.05] text-[var(--admin-signal-3)]'
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {href ? (
        <div className="mt-6">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-signal)] transition hover:text-[#d8c8ff]"
          >
            Open workspace
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--admin-text-muted)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--admin-text-soft)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminLoadingState({ label = 'Loading workspace' }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[24px] border border-white/10 bg-black/10">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(177,140,255,0.3)] border-t-[var(--admin-signal)]" />
      <p className="text-sm font-medium tracking-[0.18em] uppercase text-[var(--admin-text-muted)]">
        {label}
      </p>
    </div>
  );
}

export const adminInputClassName =
  'admin-input h-13 w-full rounded-2xl px-4 text-sm transition';

export const adminInputWithIconClassName =
  'admin-input h-13 w-full rounded-2xl pl-12 pr-4 text-sm transition';

export const adminSelectClassName =
  'admin-select h-13 rounded-2xl px-4 text-sm transition';

export const adminTextareaClassName =
  'admin-textarea w-full rounded-2xl px-4 py-3 text-sm transition';

export const adminTableShellClassName =
  'admin-panel relative overflow-hidden rounded-[30px]';
