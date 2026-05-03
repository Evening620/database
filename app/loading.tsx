export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="glass-panel h-40 animate-pulse bg-white/60" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel h-40 animate-pulse bg-white/60" />
        <div className="glass-panel h-40 animate-pulse bg-white/60" />
        <div className="glass-panel h-40 animate-pulse bg-white/60" />
      </div>
      <div className="glass-panel h-96 animate-pulse bg-white/60" />
    </div>
  );
}
