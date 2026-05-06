import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-slate-950/50 px-5 py-5 text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{hint}</p>
    </div>
  );
}
