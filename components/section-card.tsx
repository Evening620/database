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
    <section className={`glass-panel px-5 py-5 md:px-6 ${className ?? ""}`}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-slate-400">{description}</p>
          ) : null}
        </div>
        {headerExtra}
      </div>
      {children}
    </section>
  );
}
