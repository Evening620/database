import type { Metadata } from "next";

import { MainNav } from "@/components/main-nav";
import { formatDate } from "@/lib/format";

import "./globals.css";

export const metadata: Metadata = {
  title: "校园二手交易平台",
  description: "校园二手交易平台数据总览。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
          <header className="glass-panel relative mb-8 overflow-hidden px-6 py-6 md:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_22%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
                    Campus Trade Console
                  </p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                    用户自助交易
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    校园二手交易平台
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    商品、订单、用户与统计总览。
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <div className="soft-card w-full min-w-0 lg:w-[280px]">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">今日概览</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-slate-950">
                    {formatDate(new Date())}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">发布、定价、删除和购买均已开放。</p>
                </div>
                <MainNav />
              </div>
            </div>
          </header>

          <main>{children}</main>

          <footer className="mt-8 px-2 text-sm text-slate-500">
            校园二手交易平台数据看板
          </footer>
        </div>
      </body>
    </html>
  );
}
