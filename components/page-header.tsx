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
    <div className="glass-panel relative overflow-hidden px-5 py-6 md:px-6">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(14,165,233,0.18),rgba(244,63,94,0.08),transparent)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {title}
          </h1>
          <p className="text-sm leading-7 text-slate-300 md:text-base">{description}</p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
