import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="glass-panel relative overflow-hidden px-6 py-7 md:px-8">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(13,148,136,0.14),rgba(249,115,22,0.08),transparent)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            {title}
          </h1>
          <p className="text-sm leading-7 text-slate-600 md:text-base">{description}</p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
