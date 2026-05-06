"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "总览" },
  { href: "/items", label: "图书商品" },
  { href: "/users", label: "用户面板" },
  { href: "/orders", label: "订单中心" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 lg:flex-col">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[6px] px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-sky-500/90 text-white shadow-lg shadow-sky-950/25"
                : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
