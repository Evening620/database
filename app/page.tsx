import Link from "next/link";

import { DatabaseError } from "@/components/database-error";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { formatPrice, getCategoryDisplay, toErrorMessage } from "@/lib/format";
import {
  getDashboardData,
  getSoldItemsViewRows,
  getUnsoldItemsViewRows,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    title: "商品中心",
    href: "/items",
    summary: "查看筛选结果、未售库存与用户操作区。",
  },
  {
    title: "用户面板",
    href: "/users",
    summary: "查看卖家排行、购买记录与发布统计。",
  },
  {
    title: "订单中心",
    href: "/orders",
    summary: "查看成交明细、连接查询与视图结果。",
  },
];

export default async function HomePage() {
  let summaryData: Awaited<ReturnType<typeof getDashboardData>>;
  let soldItemsView: Awaited<ReturnType<typeof getSoldItemsViewRows>>;
  let unsoldItemsView: Awaited<ReturnType<typeof getUnsoldItemsViewRows>>;

  try {
    [summaryData, soldItemsView, unsoldItemsView] = await Promise.all([
      getDashboardData(),
      getSoldItemsViewRows(),
      getUnsoldItemsViewRows(),
    ]);
  } catch (error) {
    return <DatabaseError errorMessage={toErrorMessage(error)} />;
  }

  const { summary, categoryCounts, topSeller } = summaryData;
  const soldRate = summary.total_items
    ? Math.round((summary.sold_items / summary.total_items) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="平台总览"
        description="在一个界面里快速查看库存、成交、分类结构和核心入口。"
        actions={
          <>
            <Link href="/items" className="action-button">
              进入商品中心
            </Link>
            <Link href="/orders" className="secondary-button">
              查看成交记录
            </Link>
          </>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="商品总数"
          value={summary.total_items}
          hint="当前商品表中的全部记录。"
        />
        <StatCard label="已成交" value={summary.sold_items} hint={`成交率 ${soldRate}%`} />
        <StatCard
          label="待售库存"
          value={summary.unsold_items}
          hint="仍可购买的库存数量。"
        />
        <StatCard
          label="均价"
          value={formatPrice(summary.average_price)}
          hint="用户可直接在商品中心发布、定价、删除和购买。"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="运营脉搏"
          description="分类分布、成交结构和头部卖家。"
        >
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="soft-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">分类分布</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    当前共 {categoryCounts.length} 个分类
                  </p>
                </div>
                <span className="chip">实时读取</span>
              </div>
              <div className="space-y-3">
                {categoryCounts.map((category) => {
                  const percent = summary.total_items
                    ? Math.round((category.item_count / summary.total_items) * 100)
                    : 0;

                  return (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">
                          {getCategoryDisplay(category.category)}
                        </span>
                        <span className="font-mono text-slate-500">
                          {category.item_count} / {percent}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-amber-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="soft-card">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">头部卖家</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {topSeller ? topSeller.user_name : "暂无数据"}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {topSeller
                    ? `${topSeller.user_id} 当前发布 ${topSeller.published_count} 件商品。`
                    : "数据库中暂时没有可用的卖家统计。"}
                </p>
              </div>

              <div className="soft-card">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">成交情况</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-100 px-4 py-4">
                    <p className="text-xs text-slate-500">已售</p>
                    <p className="mt-1 font-mono text-xl font-semibold text-slate-950">
                      {summary.sold_items}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-4">
                    <p className="text-xs text-slate-500">未售</p>
                    <p className="mt-1 font-mono text-xl font-semibold text-slate-950">
                      {summary.unsold_items}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="快捷入口" description="从这里进入不同工作区。">
          <div className="space-y-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="soft-card block hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.summary}</p>
                  </div>
                  <span className="chip">进入</span>
                </div>
              </Link>
            ))}
            <div className="soft-card bg-slate-950 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">当前模式</p>
              <p className="mt-3 text-xl font-semibold">用户自助交易</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                商品页已经开放发布、定价、删除和购买，所有操作都会直接同步到数据库。
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="待售池" description="来自 unsold_items_view 的实时库存。">
          <div className="space-y-3">
            {unsoldItemsView.map((item) => (
              <div
                key={item.item_id}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-black/5 bg-white/80 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-slate-950">{item.item_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {getCategoryDisplay(item.category)} · 卖家 {item.seller_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-semibold text-slate-950">
                    {formatPrice(item.price)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{item.item_id}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="成交视图" description="来自 sold_items_view 的成交结果。">
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>商品名称</th>
                  <th>买家编号</th>
                </tr>
              </thead>
              <tbody>
                {soldItemsView.map((row) => (
                  <tr key={`${row.item_name}-${row.buyer_id}`}>
                    <td>{row.item_name}</td>
                    <td className="font-mono">{row.buyer_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
