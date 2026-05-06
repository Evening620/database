import { getStatusLabel } from "@/lib/format";

interface StatusBadgeProps {
  status: number;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isSold = status === 1;

  return (
    <span
      className={`inline-flex rounded-[6px] px-2.5 py-1 text-xs font-semibold ${
        isSold
          ? "bg-rose-500/15 text-rose-200"
          : "bg-emerald-400/15 text-emerald-200"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
