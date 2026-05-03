BEGIN;

DROP VIEW IF EXISTS sold_items_view;
DROP VIEW IF EXISTS unsold_items_view;

CREATE VIEW sold_items_view AS
SELECT
  i.item_name,
  o.buyer_id
FROM item AS i
JOIN orders AS o ON o.item_id = i.item_id;

CREATE VIEW unsold_items_view AS
SELECT
  item_id,
  item_name,
  category,
  price,
  status,
  seller_id
FROM item
WHERE status = 0;

COMMIT;
