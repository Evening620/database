import { DatabaseError } from "@/components/database-error";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, toErrorMessage } from "@/lib/format";
import {
  getOrdersWithDetails,
  getSellerU001PurchaseStatus,
  getSoldItemsViewRows,
  getSoldItemsWithBuyerNames,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  let orders: Awaited<ReturnType<typeof getOrdersWithDetails>>;
  let soldItemsWithBuyers: Awaited<ReturnType<typeof getSoldItemsWithBuyerNames>>;
  let soldItemsView: Awaited<ReturnType<typeof getSoldItemsViewRows>>;
  let sellerPurchaseStatus: Awaited<ReturnType<typeof getSellerU001PurchaseStatus>>;

  try {
    [orders, soldItemsWithBuyers, soldItemsView, sellerPurchaseStatus] = await Promise.all([
      getOrdersWithDetails(),
      getSoldItemsWithBuyerNames(),
      getSoldItemsViewRows(),
      getSellerU001PurchaseStatus(),
    ]);
  } catch (error) {
    return <DatabaseError errorMessage={toErrorMessage(error)} />;
  }

  const latestOrderDate = formatDate(orders[0]?.order_date ?? null);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Orders"
        title="订单中心"
        description="查看成交明细、连接查询结果和卖家商品成交状态。"
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="订单总数" value={orders.length} hint="当前 orders 表记录数。" />
        <StatCard
          label="已售商品"
          value={soldItemsWithBuyers.length}
          hint="与成交视图的记录数保持一致。"
        />
        <StatCard
          label="u001 发布"
          value={sellerPurchaseStatus.length}
          hint="用于观察指定卖家的商品成交情况。"
        />
        <StatCard label="最新成交日" value={latestOrderDate} hint="按订单日期倒序读取。" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <SectionCard
          title="成交明细"
          description="每条订单都展示商品、买家和日期。"
        >
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>订单编号</th>
                  <th>商品编号</th>
                  <th>商品名称</th>
                  <th>买家编号</th>
                  <th>买家姓名</th>
                  <th>订单日期</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td className="font-mono">{order.order_id}</td>
                    <td className="font-mono">{order.item_id}</td>
                    <td>{order.item_name}</td>
                    <td className="font-mono">{order.buyer_id}</td>
                    <td>{order.buyer_name}</td>
                    <td>{formatDate(order.order_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="最近成交" description="最新订单快速浏览。">
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.order_id}
                className="rounded-[22px] border border-black/5 bg-white/85 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{order.item_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.order_id} · 买家 {order.buyer_name}
                    </p>
                  </div>
                  <span className="chip">{formatDate(order.order_date)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="已售商品与买家" description="连接 item、orders、user 后的结果。">
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>商品编号</th>
                  <th>商品名称</th>
                  <th>买家编号</th>
                  <th>买家姓名</th>
                </tr>
              </thead>
              <tbody>
                {soldItemsWithBuyers.map((row) => (
                  <tr key={row.item_id}>
                    <td className="font-mono">{row.item_id}</td>
                    <td>{row.item_name}</td>
                    <td className="font-mono">{row.buyer_id}</td>
                    <td>{row.buyer_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="成交视图" description="直接读取 sold_items_view。">
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

      <SectionCard
        title="u001 发布商品状态"
        description="观察卖家 u001 的商品是否已成交。"
      >
        <div className="table-wrap">
          <table className="table-base">
            <thead>
              <tr>
                <th>商品编号</th>
                <th>商品名称</th>
                <th>状态</th>
                <th>购买情况</th>
                <th>买家姓名</th>
                <th>订单日期</th>
              </tr>
            </thead>
            <tbody>
              {sellerPurchaseStatus.map((row) => (
                <tr key={row.item_id}>
                  <td className="font-mono">{row.item_id}</td>
                  <td>{row.item_name}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>{row.purchase_status}</td>
                  <td>{row.buyer_name ?? "暂无"}</td>
                  <td>{formatDate(row.order_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
