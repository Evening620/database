import Link from "next/link";

import { DatabaseError } from "@/components/database-error";
import { FeedbackBanner } from "@/components/feedback-banner";
import { PageHeader } from "@/components/page-header";
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
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
          : "bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
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
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
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
                <div className="font-medium text-slate-900">
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
  const highestPrice = allItems.length
    ? Math.max(...allItems.map((item) => item.price))
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Items"
        title="商品中心"
        description="浏览库存、发布商品、定价、删除未售商品，并直接完成购买。"
        actions={
          <>
            <Link href="/orders" className="secondary-button">
              查看订单结果
            </Link>
            <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">
              用户自助操作已开启
            </span>
          </>
        }
      />

      {successMessage ? <FeedbackBanner type="success" message={successMessage} /> : null}
      {errorMessage ? <FeedbackBanner type="error" message={errorMessage} /> : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="soft-card">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">全部商品</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-slate-950">
            {allItems.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">当前商品表中的总记录数。</p>
        </div>
        <div className="soft-card">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">待售库存</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-slate-950">
            {unsoldItemsView.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">仍可购买的商品数量。</p>
        </div>
        <div className="soft-card">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">已成交</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-slate-950">
            {soldItems.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">已有订单的商品数量。</p>
        </div>
        <div className="soft-card">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">最高价</p>
          <p className="mt-3 font-mono text-3xl font-semibold text-slate-950">
            {formatPrice(highestPrice)}
          </p>
          <p className="mt-2 text-sm text-slate-500">用于快速查看当前价位区间。</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <SectionCard
          title="筛选浏览"
          description={getFilterDescription(activeFilter)}
          headerExtra={<span className="chip">当前：{getFilterLabel(activeFilter)}</span>}
        >
          <div className="mb-5 flex flex-wrap gap-3">
            <FilterLink href="/items?filter=all" label="全部商品" active={activeFilter === "all"} />
            <FilterLink
              href="/items?filter=unsold"
              label="未售出"
              active={activeFilter === "unsold"}
            />
            <FilterLink
              href="/items?filter=price_gt_30"
              label="价格大于 30"
              active={activeFilter === "price_gt_30"}
            />
            <FilterLink
              href="/items?filter=daily_goods"
              label="生活用品"
              active={activeFilter === "daily_goods"}
            />
            <FilterLink
              href="/items?filter=seller_u001"
              label="u001 发布"
              active={activeFilter === "seller_u001"}
            />
          </div>

          <ItemTable items={filteredItems} emptyMessage="当前筛选条件下没有查询到商品。" />
        </SectionCard>

        <SectionCard title="库存快照" description="优先展示当前最适合交易的商品。">
          <div className="space-y-3">
            {unsoldItemsView.slice(0, 4).map((item) => (
              <div
                key={item.item_id}
                className="rounded-[22px] border border-black/5 bg-white/85 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{item.item_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.item_id} · {item.seller_name}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>{getCategoryDisplay(item.category)}</span>
                  <span className="font-mono font-semibold text-slate-950">
                    {formatPrice(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="用户操作区"
        description="所有写操作都开放给用户使用，优先用下拉与模板来减少输入。"
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <form action={createItemAction} className="soft-card space-y-4">
            <div>
              <p className="text-lg font-semibold text-slate-950">发布商品</p>
              <p className="mt-1 text-sm text-slate-500">
                下一条编号预计为 <span className="font-mono">{nextItemId}</span>
              </p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
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
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              商品名称
              <input
                name="itemName"
                className="form-field"
                placeholder="模板可自动带出，需自定义时再填写"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
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
              <label className="space-y-2 text-sm font-medium text-slate-700">
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
              <label className="space-y-2 text-sm font-medium text-slate-700">
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
              <label className="space-y-2 text-sm font-medium text-slate-700">
                手动价格
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-field"
                  placeholder="需要覆盖时再填写"
                />
              </label>
            </div>
            <button type="submit" className="action-button">
              发布商品
            </button>
          </form>

          <form action={updateItemPriceAction} className="soft-card space-y-4">
            <div>
              <p className="text-lg font-semibold text-slate-950">给商品定价</p>
              <p className="mt-1 text-sm text-slate-500">先选商品，再选快捷价格或手动输入。</p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
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
              <label className="space-y-2 text-sm font-medium text-slate-700">
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
              <label className="space-y-2 text-sm font-medium text-slate-700">
                手动价格
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-field"
                  placeholder="优先于快捷价格"
                />
              </label>
            </div>
            <button type="submit" className="action-button">
              更新价格
            </button>
          </form>

          <form action={deleteUnsoldItemAction} className="soft-card space-y-4">
            <div>
              <p className="text-lg font-semibold text-slate-950">删除未售商品</p>
              <p className="mt-1 text-sm text-slate-500">只允许删除 status = 0 的记录。</p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              选择未售商品
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
              className={`action-button ${!hasUnsoldItems ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!hasUnsoldItems}
            >
              删除商品
            </button>
          </form>

          <form action={purchaseItemAction} className="soft-card space-y-4 bg-slate-950 text-white">
            <div>
              <p className="text-lg font-semibold">购买商品</p>
              <p className="mt-1 text-sm text-slate-300">
                购买会直接调用数据库中的 `purchase_item(...)` 函数。
              </p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-slate-200">
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
              <label className="space-y-2 text-sm font-medium text-slate-200">
                买家
                <select name="buyerId" className="form-field" defaultValue="u001">
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name} ({user.user_id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-200">
                日期
                <input
                  name="orderDate"
                  type="date"
                  defaultValue={today}
                  className="form-field"
                />
              </label>
            </div>
            <button
              type="submit"
              className={`rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 ${
                !hasUnsoldItems ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={!hasUnsoldItems}
            >
              执行购买
            </button>
          </form>
        </div>
      </SectionCard>

      <SectionCard title="完整商品表" description="刷新页面后，所有写操作都会直接反映在这里。">
        <ItemTable items={allItems} emptyMessage="当前数据库中还没有商品。" />
      </SectionCard>
    </div>
  );
}
