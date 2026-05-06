import "server-only";

import type { QueryResultRow } from "pg";

import { query, withTransaction } from "@/lib/db";
import type {
  CategoryCountRecord,
  DashboardSummary,
  DateLike,
  ItemFilter,
  ItemRecord,
  OrderRecord,
  SellerPurchaseStatusRecord,
  SoldItemBuyerRecord,
  SoldItemsViewRecord,
  TopSellerRecord,
  UserStatsRecord,
} from "@/lib/types";

type NumericLike = string | number | null;

interface ItemJoinRow extends QueryResultRow {
  item_id: string;
  item_name: string;
  category: string;
  price: NumericLike;
  status: number;
  seller_id: string;
  seller_name: string;
}

interface SummaryRow extends QueryResultRow {
  total_items: number;
  average_price: NumericLike;
  sold_items: number;
  unsold_items: number;
}

interface CategoryRow extends QueryResultRow {
  category: string;
  item_count: number;
}

interface TopSellerRow extends QueryResultRow {
  user_id: string;
  user_name: string;
  published_count: number;
}

interface UserStatsRow extends QueryResultRow {
  user_id: string;
  user_name: string;
  phone: string;
  published_count: number;
  sold_count: number;
  bought_count: number;
  average_price: NumericLike;
}

interface OrderRow extends QueryResultRow {
  order_id: string;
  item_id: string;
  item_name: string;
  buyer_id: string;
  buyer_name: string;
  order_date: DateLike;
}

interface SoldItemBuyerRow extends QueryResultRow {
  item_id: string;
  item_name: string;
  buyer_id: string;
  buyer_name: string;
}

interface SellerPurchaseStatusRow extends QueryResultRow {
  item_id: string;
  item_name: string;
  status: number;
  purchase_status: string;
  buyer_name: string | null;
  order_date: DateLike | null;
}

interface NextIdRow extends QueryResultRow {
  next_item_id: string;
}

interface PurchaseRow extends QueryResultRow {
  order_id: string;
  item_id: string;
  buyer_id: string;
  order_date: DateLike;
}

interface SoldItemsViewRow extends QueryResultRow {
  item_name: string;
  buyer_id: string;
}

function toNumber(value: NumericLike): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function mapItemRow(row: ItemJoinRow): ItemRecord {
  return {
    item_id: row.item_id,
    item_name: row.item_name,
    category: row.category,
    price: toNumber(row.price),
    status: row.status === 1 ? 1 : 0,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
  };
}

const itemBaseSelect = `
  SELECT
    i.item_id,
    i.item_name,
    i.category,
    i.price,
    i.status,
    i.seller_id,
    u.user_name AS seller_name
  FROM item AS i
  JOIN "user" AS u ON u.user_id = i.seller_id
`;

export async function getAllItems(): Promise<ItemRecord[]> {
  const result = await query<ItemJoinRow>(`${itemBaseSelect} ORDER BY i.item_id;`);
  return result.rows.map(mapItemRow);
}

export async function getFilteredItems(filter: ItemFilter): Promise<ItemRecord[]> {
  const filterMap: Record<ItemFilter, { clause: string; params: unknown[] }> = {
    all: { clause: "", params: [] },
    unsold: { clause: "WHERE i.status = 0", params: [] },
    price_gt_30: { clause: "WHERE i.price > 30", params: [] },
    daily_goods: { clause: "WHERE i.category = 'DailyGoods'", params: [] },
    seller_u001: { clause: "WHERE i.seller_id = 'u001'", params: [] },
  };

  const selected = filterMap[filter];
  const sql = `${itemBaseSelect} ${selected.clause} ORDER BY i.item_id;`;
  const result = await query<ItemJoinRow>(sql, selected.params);
  return result.rows.map(mapItemRow);
}

export async function getDashboardData(): Promise<{
  summary: DashboardSummary;
  categoryCounts: CategoryCountRecord[];
  topSeller: TopSellerRecord | null;
}> {
  const [summaryResult, categoryResult, topSellerResult] = await Promise.all([
    query<SummaryRow>(`
      SELECT
        COUNT(*)::INT AS total_items,
        COALESCE(AVG(price), 0)::NUMERIC(10, 2) AS average_price,
        COUNT(*) FILTER (WHERE status = 1)::INT AS sold_items,
        COUNT(*) FILTER (WHERE status = 0)::INT AS unsold_items
      FROM item;
    `),
    query<CategoryRow>(`
      SELECT
        category,
        COUNT(*)::INT AS item_count
      FROM item
      GROUP BY category
      ORDER BY category;
    `),
    query<TopSellerRow>(`
      SELECT
        u.user_id,
        u.user_name,
        COUNT(i.item_id)::INT AS published_count
      FROM "user" AS u
      LEFT JOIN item AS i ON i.seller_id = u.user_id
      GROUP BY u.user_id, u.user_name
      ORDER BY published_count DESC, u.user_id ASC
      LIMIT 1;
    `),
  ]);

  const summaryRow = summaryResult.rows[0];
  const topSellerRow = topSellerResult.rows[0];

  return {
    summary: {
      total_items: summaryRow.total_items,
      average_price: toNumber(summaryRow.average_price),
      sold_items: summaryRow.sold_items,
      unsold_items: summaryRow.unsold_items,
    },
    categoryCounts: categoryResult.rows.map((row) => ({
      category: row.category,
      item_count: row.item_count,
    })),
    topSeller: topSellerRow
      ? {
          user_id: topSellerRow.user_id,
          user_name: topSellerRow.user_name,
          published_count: topSellerRow.published_count,
        }
      : null,
  };
}

export async function getUsersWithStats(): Promise<UserStatsRecord[]> {
  const result = await query<UserStatsRow>(`
    SELECT
      u.user_id,
      u.user_name,
      u.phone,
      COALESCE(item_stats.published_count, 0)::INT AS published_count,
      COALESCE(item_stats.sold_count, 0)::INT AS sold_count,
      COALESCE(order_stats.bought_count, 0)::INT AS bought_count,
      COALESCE(item_stats.average_price, 0)::NUMERIC(10, 2) AS average_price
    FROM "user" AS u
    LEFT JOIN (
      SELECT
        seller_id,
        COUNT(*)::INT AS published_count,
        COUNT(*) FILTER (WHERE status = 1)::INT AS sold_count,
        AVG(price)::NUMERIC(10, 2) AS average_price
      FROM item
      GROUP BY seller_id
    ) AS item_stats ON item_stats.seller_id = u.user_id
    LEFT JOIN (
      SELECT
        buyer_id,
        COUNT(*)::INT AS bought_count
      FROM orders
      GROUP BY buyer_id
    ) AS order_stats ON order_stats.buyer_id = u.user_id
    ORDER BY u.user_id;
  `);

  return result.rows.map((row) => ({
    user_id: row.user_id,
    user_name: row.user_name,
    phone: row.phone,
    published_count: row.published_count,
    sold_count: row.sold_count,
    bought_count: row.bought_count,
    average_price: toNumber(row.average_price),
  }));
}

export async function getOrdersWithDetails(): Promise<OrderRecord[]> {
  const result = await query<OrderRow>(`
    SELECT
      o.order_id,
      o.item_id,
      i.item_name,
      o.buyer_id,
      u.user_name AS buyer_name,
      o.order_date
    FROM orders AS o
    JOIN item AS i ON i.item_id = o.item_id
    JOIN "user" AS u ON u.user_id = o.buyer_id
    ORDER BY o.order_date DESC, o.order_id DESC;
  `);

  return result.rows.map((row) => ({
    order_id: row.order_id,
    item_id: row.item_id,
    item_name: row.item_name,
    buyer_id: row.buyer_id,
    buyer_name: row.buyer_name,
    order_date: row.order_date,
  }));
}

export async function getSoldItemsWithBuyerNames(): Promise<SoldItemBuyerRecord[]> {
  const result = await query<SoldItemBuyerRow>(`
    SELECT
      i.item_id,
      i.item_name,
      o.buyer_id,
      u.user_name AS buyer_name
    FROM item AS i
    JOIN orders AS o ON o.item_id = i.item_id
    JOIN "user" AS u ON u.user_id = o.buyer_id
    WHERE i.status = 1
    ORDER BY i.item_id;
  `);

  return result.rows.map((row) => ({
    item_id: row.item_id,
    item_name: row.item_name,
    buyer_id: row.buyer_id,
    buyer_name: row.buyer_name,
  }));
}

export async function getSellerU001PurchaseStatus(): Promise<SellerPurchaseStatusRecord[]> {
  const result = await query<SellerPurchaseStatusRow>(`
    SELECT
      i.item_id,
      i.item_name,
      i.status,
      CASE
        WHEN o.order_id IS NULL THEN '未购买'
        ELSE '已购买'
      END AS purchase_status,
      buyer.user_name AS buyer_name,
      o.order_date
    FROM item AS i
    LEFT JOIN orders AS o ON o.item_id = i.item_id
    LEFT JOIN "user" AS buyer ON buyer.user_id = o.buyer_id
    WHERE i.seller_id = 'u001'
    ORDER BY i.item_id;
  `);

  return result.rows.map((row) => ({
    item_id: row.item_id,
    item_name: row.item_name,
    status: row.status === 1 ? 1 : 0,
    purchase_status: row.purchase_status,
    buyer_name: row.buyer_name,
    order_date: row.order_date,
  }));
}

export async function getSoldItemsViewRows(): Promise<SoldItemsViewRecord[]> {
  const result = await query<SoldItemsViewRow>(`
    SELECT
      item_name,
      buyer_id
    FROM sold_items_view
    ORDER BY item_name;
  `);

  return result.rows.map((row) => ({
    item_name: row.item_name,
    buyer_id: row.buyer_id,
  }));
}

export async function getUnsoldItemsViewRows(): Promise<ItemRecord[]> {
  const result = await query<ItemJoinRow>(`
    SELECT
      v.item_id,
      v.item_name,
      v.category,
      v.price,
      v.status,
      v.seller_id,
      u.user_name AS seller_name
    FROM unsold_items_view AS v
    JOIN "user" AS u ON u.user_id = v.seller_id
    ORDER BY v.item_id;
  `);

  return result.rows.map(mapItemRow);
}

export async function getNextItemId(): Promise<string> {
  const result = await query<NextIdRow>(`
    SELECT next_item_id() AS next_item_id;
  `);

  return result.rows[0].next_item_id;
}

export async function insertCustomItem(input: {
  itemName: string;
  category: string;
  price: number;
  sellerId: string;
}): Promise<string> {
  return withTransaction(async (client) => {
    await client.query("LOCK TABLE item IN EXCLUSIVE MODE;");

    const nextIdResult = await client.query<NextIdRow>(`
      SELECT next_item_id() AS next_item_id;
    `);

    const nextItemId = nextIdResult.rows[0].next_item_id;

    const insertResult = await client.query<{ item_id: string }>(
      `
        INSERT INTO item (item_id, item_name, category, price, status, seller_id)
        VALUES ($1, $2, $3, $4, 0, $5)
        RETURNING item_id;
      `,
      [nextItemId, input.itemName, input.category, input.price, input.sellerId],
    );

    return insertResult.rows[0].item_id;
  });
}

export async function updateItemPrice(itemId: string, price: number): Promise<void> {
  const result = await query<{ item_id: string }>(
    `
      UPDATE item
      SET price = $2
      WHERE item_id = $1
        AND status = 0
      RETURNING item_id;
    `,
    [itemId, price],
  );

  if (result.rowCount === 0) {
    throw new Error(`商品 ${itemId} 不存在，或该商品已经售出，不能修改价格。`);
  }
}

export async function deleteUnsoldItem(itemId: string): Promise<void> {
  const result = await query<{ item_id: string }>(
    `
      DELETE FROM item
      WHERE item_id = $1
        AND status = 0
      RETURNING item_id;
    `,
    [itemId],
  );

  if (result.rowCount === 0) {
    throw new Error(`商品 ${itemId} 不存在，或该商品已经售出，不能删除。`);
  }
}

export async function purchaseItem(input: {
  itemId: string;
  buyerId: string;
  orderDate: string;
}): Promise<PurchaseRow> {
  const result = await query<PurchaseRow>(
    `
      SELECT *
      FROM purchase_item($1, $2, $3::DATE);
    `,
    [input.itemId, input.buyerId, input.orderDate],
  );

  return result.rows[0];
}
