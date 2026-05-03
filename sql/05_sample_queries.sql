-- F. Basic queries

-- 1. Query all unsold items
SELECT *
FROM item
WHERE status = 0
ORDER BY item_id;

-- 2. Query items with price greater than 30
SELECT *
FROM item
WHERE price > 30
ORDER BY item_id;

-- 3. Query items in the DailyGoods category
SELECT *
FROM item
WHERE category = 'DailyGoods'
ORDER BY item_id;

-- 4. Query all items published by user u001
SELECT *
FROM item
WHERE seller_id = 'u001'
ORDER BY item_id;

-- G. Join queries

-- 1. Query all sold items and their buyer names
SELECT
  i.item_id,
  i.item_name,
  u.user_name AS buyer_name
FROM item AS i
JOIN orders AS o ON o.item_id = i.item_id
JOIN "user" AS u ON u.user_id = o.buyer_id
WHERE i.status = 1
ORDER BY i.item_id;

-- 2. Query each order as item name + buyer name + date
SELECT
  i.item_name,
  u.user_name AS buyer_name,
  o.order_date
FROM orders AS o
JOIN item AS i ON i.item_id = o.item_id
JOIN "user" AS u ON u.user_id = o.buyer_id
ORDER BY o.order_date DESC, o.order_id DESC;

-- 3. Query whether the items whose seller is u001 have been purchased
SELECT
  i.item_id,
  i.item_name,
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

-- H. Aggregation / grouping

-- 1. Total number of items
SELECT COUNT(*) AS total_items
FROM item;

-- 2. Number of items in each category
SELECT
  category,
  COUNT(*) AS item_count
FROM item
GROUP BY category
ORDER BY category;

-- 3. Average price of all items
SELECT AVG(price) AS average_price
FROM item;

-- 4. The user who has published the most items
SELECT
  u.user_id,
  u.user_name,
  COUNT(i.item_id) AS published_count
FROM "user" AS u
LEFT JOIN item AS i ON i.seller_id = u.user_id
GROUP BY u.user_id, u.user_name
ORDER BY published_count DESC, u.user_id ASC
LIMIT 1;

-- I. Views

SELECT *
FROM sold_items_view
ORDER BY item_name;

SELECT *
FROM unsold_items_view
ORDER BY item_id;
