import { DatabaseError } from "@/components/database-error";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { formatPrice, toErrorMessage } from "@/lib/format";
import { getUsersWithStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof getUsersWithStats>>;

  try {
    users = await getUsersWithStats();
  } catch (error) {
    return <DatabaseError errorMessage={toErrorMessage(error)} />;
  }

  const ranking = [...users].sort(
    (a, b) => b.published_count - a.published_count || a.user_id.localeCompare(b.user_id),
  );
  const topSeller = ranking[0];
  const totalPublished = users.reduce((sum, user) => sum + user.published_count, 0);
  const totalSold = users.reduce((sum, user) => sum + user.sold_count, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Users"
        title="用户面板"
        description="查看发布排行、购买记录和每位用户的交易表现。"
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="用户总数" value={users.length} hint="当前 user 表记录数。" />
        <StatCard label="发布总量" value={totalPublished} hint="全部卖家发布数汇总。" />
        <StatCard label="售出总量" value={totalSold} hint="status = 1 的商品数。" />
        <StatCard
          label="头部卖家"
          value={topSeller ? topSeller.user_name : "暂无"}
          hint={
            topSeller
              ? `${topSeller.user_id} 当前发布 ${topSeller.published_count} 件商品。`
              : "数据库中暂时没有排行数据。"
          }
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="卖家榜首" description="发布数量最多的用户。">
          {topSeller ? (
            <div className="soft-card bg-amber-50/90">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Top Seller</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-amber-950">
                {topSeller.user_name}
              </h3>
              <p className="mt-2 text-sm text-amber-900">
                用户编号 <span className="font-mono">{topSeller.user_id}</span>
              </p>
              <p className="mt-3 text-sm leading-7 text-amber-900">
                当前累计发布 <span className="font-mono">{topSeller.published_count}</span> 件商品。
              </p>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              暂无排行数据。
            </div>
          )}
        </SectionCard>

        <SectionCard title="发布排行" description="按发布数倒序排列。">
          <div className="grid gap-4 md:grid-cols-2">
            {ranking.map((user, index) => (
              <div key={user.user_id} className="soft-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Rank {index + 1}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {user.user_name}
                    </p>
                  </div>
                  <span className="chip">{user.user_id}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-slate-100 px-3 py-3">
                    <p className="text-xs text-slate-500">发布</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-slate-950">
                      {user.published_count}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-3 py-3">
                    <p className="text-xs text-slate-500">售出</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-slate-950">
                      {user.sold_count}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-3 py-3">
                    <p className="text-xs text-slate-500">购买</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-slate-950">
                      {user.bought_count}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="用户总表" description="带有发布数、售出数和购买数的完整视图。">
        <div className="table-wrap">
          <table className="table-base">
            <thead>
              <tr>
                <th>用户编号</th>
                <th>用户名</th>
                <th>手机号</th>
                <th>发布数</th>
                <th>售出数</th>
                <th>购买订单数</th>
                <th>平均发布价格</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="font-mono">{user.user_id}</td>
                  <td className="font-medium text-slate-900">{user.user_name}</td>
                  <td className="font-mono">{user.phone}</td>
                  <td>{user.published_count}</td>
                  <td>{user.sold_count}</td>
                  <td>{user.bought_count}</td>
                  <td>{formatPrice(user.average_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
