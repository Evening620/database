import Link from "next/link";

import { DatabaseError } from "@/components/database-error";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { ITEM_TEMPLATE_OPTIONS, QUICK_PRICE_OPTIONS } from "@/lib/demo-options";
import {
  formatPrice,
  getCategoryDisplay,
  getFilterDescription,
  getFilterLabel,
  getTodayDateString,
  isItemFilter,
  toErrorMessage,
} from "@/lib/format";
import {
  getAllItems,
  getFilteredItems,
  getNextItemId,
  getUnsoldItemsViewRows,
  getUsersWithStats,
} from "@/lib/queries";
import type { ItemFilter, ItemRecord } from "@/lib/types";

import {
  createItemAction,
  deleteUnsoldItemAction,
  purchaseItemAction,
  updateItemPriceAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;

function getSingleValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[6px] px-3 py-2 text-sm font-semibold ${
        active
          ? "bg-sky-500 text-white shadow-lg shadow-sky-950/25"
          : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function ItemCard({ item }: { item: ItemRecord }) {
  return (
    <article className="group flex min-h-[270px] flex-col rounded-[8px] border border-white/14 bg-slate-800/58 p-4 shadow-[0_18px_36px_rgba(0,0,0,0.16)]">
      <div className="flex h-28 items-center justify-center rounded-[6px] border border-white/10 bg-[linear-gradient(135deg,rgba(71,85,105,0.92),rgba(30,41,59,0.96))] text-slate-300">
        <span className="font-mono text-xs">{item.item_id}</span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold leading-6 text-white">
            {item.item_name}
          </h3>
          <p className="mt-1 break-words text-xs leading-5 text-slate-300">
            {getCategoryDisplay(item.category)}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div>
          <p className="text-xs text-slate-500">卖家</p>
          <p className="mt-1 text-xs font-medium text-slate-300">
            {item.seller_name ?? item.seller_id}
          </p>
        </div>
        <p className="font-mono text-base font-semibold text-rose-300">
          {formatPrice(item.price)}
        </p>
      </div>
    </article>
  );
}

function ItemTable({
  items,
  emptyMessage,
}: {
  items: ItemRecord[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table-base">
        <thead>
          <tr>
            <th>商品编号</th>
            <th>商品名称</th>
            <th>分类</th>
            <th>价格</th>
            <th>状态</th>
            <th>发布用户</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.item_id}>
              <td className="font-mono">{item.item_id}</td>
              <td>{item.item_name}</td>
              <td>{getCategoryDisplay(item.category)}</td>
              <td>{formatPrice(item.price)}</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td>
                <div className="font-medium text-white">
                  {item.seller_name ?? item.seller_id}
                </div>
                <div className="font-mono text-xs text-slate-500">{item.seller_id}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const filterParam = getSingleValue(params.filter);
  const successMessage = getSingleValue(params.success);
  const errorMessage = getSingleValue(params.error);
  const activeFilter: ItemFilter = isItemFilter(filterParam) ? filterParam : "all";
  let allItems: Awaited<ReturnType<typeof getAllItems>>;
  let filteredItems: Awaited<ReturnType<typeof getFilteredItems>>;
  let users: Awaited<ReturnType<typeof getUsersWithStats>>;
  let nextItemId: Awaited<ReturnType<typeof getNextItemId>>;
  let unsoldItemsView: Awaited<ReturnType<typeof getUnsoldItemsViewRows>>;

  try {
    [allItems, filteredItems, users, nextItemId, unsoldItemsView] = await Promise.all([
      getAllItems(),
      getFilteredItems(activeFilter),
      getUsersWithStats(),
      getNextItemId(),
      getUnsoldItemsViewRows(),
    ]);
  } catch (error) {
    return <DatabaseError errorMessage={toErrorMessage(error)} />;
  }

  const hasUnsoldItems = unsoldItemsView.length > 0;
  const today = getTodayDateString();
  const soldItems = allItems.filter((item) => item.status === 1);
  const latestItems = allItems.slice(-5).reverse();

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
        <div className="book-hero min-h-[260px] rounded-[8px] border border-white/14 p-7 shadow-[0_22px_56px_rgba(0,0,0,0.2)] md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Campus Used Books
          </p>
          <h2 className="mt-10 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            校园好物，一键交易
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-100">
            图书、教材、宿舍好物都可以在这里发布和购买。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#publish" className="action-button">
              发布商品
            </a>
            <Link href="/orders" className="secondary-button">
              查看订单
            </Link>
          </div>
        </div>

        <aside className="grid gap-3 rounded-[8px] border border-white/14 bg-slate-800/58 p-5">
          <div>
            <p className="text-xs text-slate-500">全部商品</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-white">
              {allItems.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">待售库存</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-emerald-200">
              {unsoldItemsView.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">已成交</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-rose-200">
              {soldItems.length}
            </p>
          </div>
        </aside>
      </section>

      {successMessage ? <FeedbackBanner type="success" message={successMessage} /> : null}
      {errorMessage ? <FeedbackBanner type="error" message={errorMessage} /> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="glass-panel p-5 md:p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">最新商品</h2>
              <p className="mt-1 text-sm text-slate-400">优先展示最近发布的校园交易商品。</p>
            </div>
            <span className="chip">{getFilterLabel(activeFilter)}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            {latestItems.map((item) => (
              <ItemCard key={item.item_id} item={item} />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="soft-card">
            <p className="text-sm font-semibold text-white">系统公告</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
              <li>购买会写入 orders 表。</li>
              <li>商品售出后状态自动更新。</li>
              <li>同一商品只能成交一次。</li>
            </ul>
          </div>
          <div className="soft-card">
            <p className="text-sm font-semibold text-white">订单入口</p>
            <Link href="/orders" className="mt-3 inline-flex text-sm font-semibold text-cyan-300">
              查看成交明细
            </Link>
          </div>
        </aside>
      </section>

      <div id="filters" className="scroll-mt-5">
        <SectionCard
          title="商品筛选"
          description={getFilterDescription(activeFilter)}
          headerExtra={<span className="chip">当前：{getFilterLabel(activeFilter)}</span>}
        >
          <div className="mb-5 flex flex-wrap gap-3">
            <FilterLink
              href="/items?filter=all#filters"
              label="全部商品"
              active={activeFilter === "all"}
            />
            <FilterLink
              href="/items?filter=unsold#filters"
              label="未售出"
              active={activeFilter === "unsold"}
            />
            <FilterLink
              href="/items?filter=price_gt_30#filters"
              label="价格大于 30"
              active={activeFilter === "price_gt_30"}
            />
            <FilterLink
              href="/items?filter=daily_goods#filters"
              label="生活用品"
              active={activeFilter === "daily_goods"}
            />
            <FilterLink
              href="/items?filter=seller_u001#filters"
              label="u001 发布"
              active={activeFilter === "seller_u001"}
            />
          </div>
          <ItemTable items={filteredItems} emptyMessage="当前筛选条件下没有商品。" />
        </SectionCard>
      </div>

      <SectionCard
        title="用户操作区"
        description="发布、定价、删除和购买操作都会同步到数据库。"
        className="scroll-mt-5"
      >
        <div id="publish" className="grid gap-5 xl:grid-cols-2">
          <form action={createItemAction} className="soft-card space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">发布商品</p>
              <p className="mt-1 text-sm text-slate-400">
                下一条编号预计为 <span className="font-mono">{nextItemId}</span>
              </p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-300">
              上架模板
              <select name="templateId" className="form-field" defaultValue="">
                <option value="">不使用模板，手动填写</option>
                {ITEM_TEMPLATE_OPTIONS.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label} · {template.itemName} · {template.price} 元
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-300">
              商品名称
              <input name="itemName" className="form-field" placeholder="例如 DatabaseBook" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-300">
                分类
                <select name="category" className="form-field" defaultValue="">
                  <option value="">沿用模板分类</option>
                  <option value="Book">书籍</option>
                  <option value="DailyGoods">生活用品</option>
                  <option value="Electronics">电子产品</option>
                  <option value="Furniture">家具</option>
                  <option value="Other">其他</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-300">
                发布用户
                <select name="sellerId" className="form-field" defaultValue="u001">
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name} ({user.user_id})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-300">
                快捷价格
                <select name="quickPrice" className="form-field" defaultValue="">
                  <option value="">沿用模板价格</option>
                  {QUICK_PRICE_OPTIONS.map((price) => (
                    <option key={price} value={price}>
                      {price} 元
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-300">
                手动价格
                <input name="price" type="number" min="0" step="0.01" className="form-field" />
              </label>
            </div>
            <button type="submit" className="action-button">
              发布商品
            </button>
          </form>

          <form action={purchaseItemAction} className="soft-card space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">购买商品</p>
              <p className="mt-1 text-sm text-slate-400">调用数据库 purchase_item 函数。</p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-300">
              商品
              <select
                name="itemId"
                className="form-field"
                defaultValue=""
                disabled={!hasUnsoldItems}
              >
                <option value="" disabled>
                  {hasUnsoldItems ? "请选择商品" : "暂无可购买商品"}
                </option>
                {unsoldItemsView.map((item) => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_name} ({item.item_id})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-300">
                买家
                <select name="buyerId" className="form-field" defaultValue="u001">
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name} ({user.user_id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-300">
                日期
                <input name="orderDate" type="date" defaultValue={today} className="form-field" />
              </label>
            </div>
            <button
              type="submit"
              className={`action-button ${!hasUnsoldItems ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!hasUnsoldItems}
            >
              执行购买
            </button>
          </form>

          <form action={updateItemPriceAction} className="soft-card space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">商品定价</p>
              <p className="mt-1 text-sm text-slate-400">先选商品，再更新价格。</p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-300">
              商品
              <select name="itemId" className="form-field" defaultValue="">
                <option value="" disabled>
                  请选择商品
                </option>
                {allItems.map((item) => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_name} ({item.item_id})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-300">
                快捷价格
                <select name="quickPrice" className="form-field" defaultValue="">
                  <option value="">请选择</option>
                  {QUICK_PRICE_OPTIONS.map((price) => (
                    <option key={price} value={price}>
                      {price} 元
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-300">
                手动价格
                <input name="price" type="number" min="0" step="0.01" className="form-field" />
              </label>
            </div>
            <button type="submit" className="secondary-button">
              更新价格
            </button>
          </form>

          <form action={deleteUnsoldItemAction} className="soft-card space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">删除未售商品</p>
              <p className="mt-1 text-sm text-slate-400">仅允许删除 status = 0 的记录。</p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-300">
              未售商品
              <select
                name="itemId"
                className="form-field"
                defaultValue=""
                disabled={!hasUnsoldItems}
              >
                <option value="" disabled>
                  {hasUnsoldItems ? "请选择商品" : "暂无未售商品"}
                </option>
                {unsoldItemsView.map((item) => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_name} ({item.item_id})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className={`secondary-button ${!hasUnsoldItems ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!hasUnsoldItems}
            >
              删除商品
            </button>
          </form>
        </div>
      </SectionCard>

      <SectionCard title="完整商品表" description="刷新页面后，写操作会直接反映在这里。">
        <ItemTable items={allItems} emptyMessage="当前数据库中还没有商品。" />
      </SectionCard>
    </div>
  );
}
