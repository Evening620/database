import Link from "next/link";

interface DatabaseErrorProps {
  title?: string;
  errorMessage: string;
}

export function DatabaseError({
  title = "数据库连接失败",
  errorMessage,
}: DatabaseErrorProps) {
  return (
    <div className="glass-panel space-y-4 px-6 py-8 md:px-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-600">
          Connection Error
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="text-sm leading-7 text-slate-300">
          当前页面只读取真实 PostgreSQL。请确认
          <code className="mx-1 rounded bg-slate-900 px-1.5 py-0.5 text-slate-100">
            DATABASE_URL
          </code>
          配置正确，并且已经执行过数据库初始化脚本。
        </p>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        {errorMessage}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-[6px] bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
        >
          返回首页
        </Link>
        <a
          href="https://vercel.com"
          className="rounded-[6px] border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200"
          target="_blank"
          rel="noreferrer"
        >
          部署说明
        </a>
      </div>
    </div>
  );
}
