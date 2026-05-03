"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="glass-panel space-y-4 px-6 py-8 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
        Runtime Error
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
        页面渲染失败
      </h2>
      <p className="text-sm leading-7 text-slate-600">
        请先检查数据库环境变量、SQL 初始化状态，或重试当前请求。
      </p>
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        {error.message}
      </div>
      <button type="button" onClick={reset} className="action-button">
        重新加载
      </button>
    </div>
  );
}
