BEGIN;

DROP VIEW IF EXISTS sold_items_view;
DROP VIEW IF EXISTS unsold_items_view;

DROP FUNCTION IF EXISTS purchase_item(VARCHAR, VARCHAR, DATE);
DROP FUNCTION IF EXISTS next_item_id();
DROP FUNCTION IF EXISTS next_order_id();
DROP FUNCTION IF EXISTS ensure_order_item_status_consistency();
DROP FUNCTION IF EXISTS prevent_unsold_item_with_order();

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS "user";

CREATE TABLE "user" (
  user_id VARCHAR(10) PRIMARY KEY,
  user_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  CONSTRAINT user_id_format_chk CHECK (user_id ~ '^u[0-9]{3,}$'),
  CONSTRAINT user_phone_format_chk CHECK (phone ~ '^[0-9]{11}$')
);

CREATE TABLE item (
  item_id VARCHAR(10) PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status INTEGER NOT NULL CHECK (status IN (0, 1)),
  seller_id VARCHAR(10) NOT NULL REFERENCES "user"(user_id),
  CONSTRAINT item_id_format_chk CHECK (item_id ~ '^i[0-9]{3,}$')
);

CREATE TABLE orders (
  order_id VARCHAR(10) PRIMARY KEY,
  item_id VARCHAR(10) NOT NULL UNIQUE REFERENCES item(item_id),
  buyer_id VARCHAR(10) NOT NULL REFERENCES "user"(user_id),
  order_date DATE NOT NULL,
  CONSTRAINT order_id_format_chk CHECK (order_id ~ '^o[0-9]{3,}$')
);

CREATE INDEX idx_item_seller_id ON item(seller_id);
CREATE INDEX idx_item_status ON item(status);
CREATE INDEX idx_item_category ON item(category);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);

CREATE OR REPLACE FUNCTION next_item_id()
RETURNS VARCHAR
LANGUAGE SQL
AS $$
  SELECT 'i' || LPAD((COALESCE(MAX(SUBSTRING(item_id FROM 2)::INT), 0) + 1)::TEXT, 3, '0')
  FROM item;
$$;

CREATE OR REPLACE FUNCTION next_order_id()
RETURNS VARCHAR
LANGUAGE SQL
AS $$
  SELECT 'o' || LPAD((COALESCE(MAX(SUBSTRING(order_id FROM 2)::INT), 0) + 1)::TEXT, 3, '0')
  FROM orders;
$$;

CREATE OR REPLACE FUNCTION ensure_order_item_status_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_item_status INTEGER;
BEGIN
  SELECT status
  INTO v_item_status
  FROM item
  WHERE item_id = NEW.item_id;

  IF v_item_status IS NULL THEN
    RAISE EXCEPTION '商品 % 不存在。', NEW.item_id;
  END IF;

  IF v_item_status <> 1 THEN
    RAISE EXCEPTION '商品 % 必须先标记为已售出，才能写入订单。', NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_unsold_item_with_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 0 AND EXISTS (
    SELECT 1
    FROM orders
    WHERE item_id = NEW.item_id
  ) THEN
    RAISE EXCEPTION '商品 % 已有订单，不能改回未售出。', NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_item_status
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION ensure_order_item_status_consistency();

CREATE TRIGGER trg_item_status_consistency
BEFORE UPDATE OF status ON item
FOR EACH ROW
EXECUTE FUNCTION prevent_unsold_item_with_order();

COMMIT;
