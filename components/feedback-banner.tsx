interface FeedbackBannerProps {
  type: "success" | "error";
  message: string;
}

export function FeedbackBanner({ type, message }: FeedbackBannerProps) {
  const palette =
    type === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
      : "border-rose-400/25 bg-rose-400/10 text-rose-100";

  return (
    <div className={`rounded-[8px] border px-4 py-3 text-sm font-medium ${palette}`}>
      {message}
    </div>
  );
}
