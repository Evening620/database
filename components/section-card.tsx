import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  headerExtra?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  description,
  headerExtra,
  className,
  children,
}: SectionCardProps) {
  return (
    <section className={`glass-panel px-6 py-6 md:px-8 ${className ?? ""}`}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
          ) : null}
        </div>
        {headerExtra}
      </div>
      {children}
    </section>
  );
}
