import type { ItemFilter } from "@/lib/types";

const categoryMap: Record<string, string> = {
  Book: "书籍",
  DailyGoods: "生活用品",
  Electronics: "电子产品",
  Furniture: "家具",
  Other: "其他",
};

export function getCategoryDisplay(category: string): string {
  const zhLabel = categoryMap[category];
  return zhLabel ? `${zhLabel} / ${category}` : `自定义分类 / ${category}`;
}

export function getStatusLabel(status: number): string {
  return status === 1 ? "已售出" : "未售出";
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | Date | null): string {
  if (!value) {
    return "暂无";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
  }).format(new Date());
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error:\s*/, "");
  }

  return "数据库操作失败，请稍后重试。";
}

export function isItemFilter(value: string | undefined): value is ItemFilter {
  return (
    value === "all" ||
    value === "unsold" ||
    value === "price_gt_30" ||
    value === "daily_goods" ||
    value === "seller_u001"
  );
}

export function getFilterLabel(filter: ItemFilter): string {
  const labels: Record<ItemFilter, string> = {
    all: "全部商品",
    unsold: "未售出",
    price_gt_30: "价格大于 30",
    daily_goods: "生活用品",
    seller_u001: "u001 发布",
  };

  return labels[filter];
}

export function getFilterDescription(filter: ItemFilter): string {
  const descriptions: Record<ItemFilter, string> = {
    all: "查看当前商品表中的完整数据。",
    unsold: "仅显示仍可交易的未售出商品。",
    price_gt_30: "筛出价格大于 30 元的商品。",
    daily_goods: "筛出数据库中 category = DailyGoods 的商品。",
    seller_u001: "查看用户 u001 发布的全部商品。",
  };

  return descriptions[filter];
}
