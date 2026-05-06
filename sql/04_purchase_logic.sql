BEGIN;

CREATE OR REPLACE FUNCTION purchase_item(
  p_item_id VARCHAR,
  p_buyer_id VARCHAR,
  p_order_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  order_id VARCHAR,
  item_id VARCHAR,
  buyer_id VARCHAR,
  order_date DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_status INTEGER;
  v_order_id VARCHAR(10);
BEGIN
  PERFORM 1
  FROM "user"
  WHERE user_id = p_buyer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '买家 % 不存在。', p_buyer_id;
  END IF;

  SELECT i.status
  INTO v_status
  FROM item AS i
  WHERE i.item_id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '商品 % 不存在。', p_item_id;
  END IF;

  IF v_status = 1 THEN
    RAISE EXCEPTION '商品 % 已售出，不能重复购买。', p_item_id;
  END IF;

  v_order_id := next_order_id();

  UPDATE item AS i
  SET status = 1
  WHERE i.item_id = p_item_id;

  INSERT INTO orders (order_id, item_id, buyer_id, order_date)
  VALUES (v_order_id, p_item_id, p_buyer_id, COALESCE(p_order_date, CURRENT_DATE));

  RETURN QUERY
  SELECT
    o.order_id,
    o.item_id,
    o.buyer_id,
    o.order_date
  FROM orders AS o
  WHERE o.order_id = v_order_id;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION '商品 % 已生成订单，不能重复购买。', p_item_id;
END;
$$;

COMMIT;
