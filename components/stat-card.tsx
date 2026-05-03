import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-slate-950 px-5 py-5 text-white shadow-[0_24px_48px_rgba(15,23,42,0.16)]">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{hint}</p>
    </div>
  );
}
