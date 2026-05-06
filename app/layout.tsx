import type { Metadata } from "next";

import { MainNav } from "@/components/main-nav";
import { formatDate } from "@/lib/format";

import "./globals.css";

export const metadata: Metadata = {
  title: "校园二手图书管理系统",
  description: "校园二手图书发布、购买、订单和用户统计管理系统。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <div className="browser-frame">
            <aside className="sidebar-panel flex flex-col gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Campus Books
                </p>
                <h1 className="mt-3 text-lg font-semibold text-white">
                  校园二手图书管理系统
                </h1>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  发布、浏览、购买和订单查询。
                </p>
              </div>

              <MainNav />

              <div className="mt-auto rounded-[6px] border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-slate-400">今日</p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-100">
                  {formatDate(new Date())}
                </p>
              </div>
            </aside>

            <main className="content-panel">{children}</main>
          </div>

          <footer className="mx-auto mt-4 w-full max-w-[1680px] px-2 text-xs text-slate-300">
            校园二手图书交易数据库课程设计
          </footer>
        </div>
      </body>
    </html>
  );
}
