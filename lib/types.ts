export type ItemFilter =
  | "all"
  | "unsold"
  | "price_gt_30"
  | "daily_goods"
  | "seller_u001";

export type DateLike = string | Date;

export interface ItemRecord {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
  status: 0 | 1;
  seller_id: string;
  seller_name?: string;
}

export interface UserStatsRecord {
  user_id: string;
  user_name: string;
  phone: string;
  published_count: number;
  sold_count: number;
  bought_count: number;
  average_price: number;
}

export interface OrderRecord {
  order_id: string;
  item_id: string;
  item_name: string;
  buyer_id: string;
  buyer_name: string;
  order_date: DateLike;
}

export interface SoldItemBuyerRecord {
  item_id: string;
  item_name: string;
  buyer_id: string;
  buyer_name: string;
}

export interface SellerPurchaseStatusRecord {
  item_id: string;
  item_name: string;
  status: 0 | 1;
  purchase_status: string;
  buyer_name: string | null;
  order_date: DateLike | null;
}

export interface CategoryCountRecord {
  category: string;
  item_count: number;
}

export interface TopSellerRecord {
  user_id: string;
  user_name: string;
  published_count: number;
}

export interface DashboardSummary {
  total_items: number;
  average_price: number;
  sold_items: number;
  unsold_items: number;
}

export interface SoldItemsViewRecord {
  item_name: string;
  buyer_id: string;
}
