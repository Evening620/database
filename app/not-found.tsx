import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass-panel space-y-4 px-6 py-8 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
        404
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
        页面不存在
      </h2>
      <p className="text-sm leading-7 text-slate-600">
        请从导航栏返回首页、商品页、用户页或订单页继续查看数据库内容。
      </p>
      <Link href="/" className="action-button">
        返回首页
      </Link>
    </div>
  );
}
