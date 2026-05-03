在线访问地址：待部署（当前缺少可直接写入的 Vercel + 云数据库线上账号配置，请按文末步骤完成后替换为真实 URL）

# 校园二手交易平台数据库系统课程报告

## 1. 项目概述

本项目是一个以数据库课程要求为核心的校园二手交易平台系统。实现重点不是“页面好看即可”，而是：

- 使用真实 PostgreSQL 作为唯一数据源
- 将数据库定义、初始数据、视图、事务化购买逻辑全部显式写入 SQL 文件
- 通过 Next.js App Router 提供一个可部署、可演示、可刷新验证的 Web 界面
- 所有增删改查都直连数据库，不使用本地数组或模拟 JSON

## 2. 架构选择与理由

### 2.1 最终架构

- 前端与服务端一体：Next.js App Router + TypeScript
- UI：Tailwind CSS
- 数据库：PostgreSQL（目标为 Supabase 或 Neon）
- 数据访问：Node `pg` 驱动 + 原生 SQL
- 部署：GitHub + Vercel

### 2.2 为什么适合本次作业

1. 课程重点是数据库设计，因此核心 SQL 对象放在 `sql/` 目录，便于老师直接检查。
2. Next.js 适合部署到 Vercel，便于生成线上公开 URL。
3. PostgreSQL 能完整支持主键、外键、检查约束、唯一约束、视图、函数、触发器和事务。
4. 采用原生 SQL 而不是重 ORM，可以更清楚地展示数据库课程要求。

## 3. 功能页面说明

### 3.1 首页 `/`

- 展示项目标题和导航
- 展示总商品数、平均价格、未售出商品数、发布最多用户
- 展示各分类商品数量
- 预览 `sold_items_view` 与 `unsold_items_view`

### 3.2 商品页 `/items`

- 展示完整商品表
- 提供 4 个基础查询入口
- 提供用户操作区：
  - 新增商品
  - 修改价格
  - 删除未售出商品
  - 购买商品（调用 SQL 函数）
- 展示真实 SQL 视图 `unsold_items_view`

### 3.3 用户页 `/users`

- 展示完整用户列表
- 显示每个用户的发布数、售出数、购买订单数
- 明确展示“发布最多的用户”

### 3.4 订单页 `/orders`

- 展示完整订单明细
- 展示已售商品与买家姓名
- 展示“u001 发布的商品是否已被购买”
- 展示真实 SQL 视图 `sold_items_view`

## 4. 数据库对象实现说明

### 4.1 表结构

已创建三张表：

- `"user"`
- `item`
- `orders`

其中：

- `item.status = 0` 表示未售出
- `item.status = 1` 表示已售出

### 4.2 约束实现

已实现以下约束：

- 主键约束：三张表均有主键
- 非空约束：关键字段全部 `NOT NULL`
- 检查约束：`CHECK (status IN (0,1))`
- 外键约束：
  - `item.seller_id -> "user".user_id`
  - `orders.buyer_id -> "user".user_id`
  - `orders.item_id -> item.item_id`
- 唯一约束：
  - `UNIQUE (orders.item_id)`，保证一个商品最多交易一次

### 4.3 一致性规则实现

对应题目 C 的实现方式如下：

1. 每个商品最多交易一次
   - 通过 `UNIQUE (orders.item_id)` 保证
2. `orders.item_id` 只能出现一次
   - 同样由唯一约束保证
3. 如果商品出现在订单中，则 `item.status` 必须为 1
   - 通过 `orders` 表触发器保证
4. 如果 `item.status = 0`，则不能出现在订单中
   - 通过订单写入触发器和购买函数联合保证
5. `item.seller_id` 引用用户表
   - 外键保证
6. `orders.buyer_id` 引用用户表
   - 外键保证
7. `orders.item_id` 引用商品表
   - 外键保证

### 4.4 为什么表名仍然叫 `user`

题目要求表名是 `user`。在 PostgreSQL 中该名字需要小心处理，因此项目中始终写成 `"user"`，既满足作业要求，也兼容 PostgreSQL。

## 5. SQL 文件说明

- `sql/01_schema.sql`
  - 建表
  - 主键 / 外键 / 检查约束 / 唯一约束
  - 触发器函数
  - `next_item_id()`、`next_order_id()`
- `sql/02_seed.sql`
  - 插入题目要求的初始数据
- `sql/03_views.sql`
  - 创建 `sold_items_view`
  - 创建 `unsold_items_view`
- `sql/04_purchase_logic.sql`
  - 创建 `purchase_item(...)`
- `sql/05_sample_queries.sql`
  - 收录基础查询、连接查询、聚合查询、视图查询示例

## 6. SQL 购买逻辑说明

题目要求购买商品时必须在 SQL 中同时完成：

1. 插入订单
2. 更新商品状态为已售出

本项目的实现方式：

- SQL 函数：`purchase_item(p_item_id, p_buyer_id, p_order_date)`
- 执行步骤：
  1. 先检查买家是否存在
  2. 对目标商品执行 `SELECT ... FOR UPDATE` 锁行
  3. 检查商品是否仍为未售出
  4. 生成新的订单编号 `o003 / o004 / ...`
  5. 更新 `item.status = 1`
  6. 插入 `orders`

这样保证购买逻辑不是前端假动作，而是真实数据库事务逻辑。

## 7. ID 生成策略说明

- 用户编号保持题目固定格式：`u001`
- 商品编号使用数据库函数 `next_item_id()`
- 订单编号使用数据库函数 `next_order_id()`

实现细节：

- 新增商品时，应用在事务中调用 `next_item_id()`，避免简单前端拼接
- 购买商品时，订单号完全由 SQL 函数内部生成

## 8. 基础查询与连接查询实现

### 8.1 基础查询

在商品页可直接通过按钮执行：

1. 查询全部未售出商品
2. 查询价格大于 30 的商品
3. 查询生活用品分类商品
4. 查询用户 `u001` 发布的商品

说明：

- 数据库存储值保持题目要求：`DailyGoods`
- 界面明确显示为：`生活用品 / DailyGoods`

### 8.2 连接查询

在订单页展示：

1. 所有已售商品及买家姓名
2. 每条订单的商品名 + 买家名 + 日期
3. `u001` 卖家发布商品是否已被购买

## 9. 聚合与分组实现

已在首页和用户页明确展示：

1. 商品总数
2. 每类商品数量
3. 商品平均价格
4. 发布商品最多的用户

## 10. 视图实现

已创建真实 SQL 视图：

### 10.1 `sold_items_view`

字段：

- `item_name`
- `buyer_id`

### 10.2 `unsold_items_view`

用于展示所有未售出商品。

这两个视图都已经在页面上直接读取和展示，不是仅在文档中写出。

## 11. 安全性问题回答

### 11.1 如何防止普通用户删除数据

可以使用数据库角色分离：

- 数据库管理角色（仅后端/运维使用）：允许 `INSERT / UPDATE / DELETE`
- 普通查询角色：只允许 `SELECT`

本项目当前为了课堂演示开放了页面写操作，但如果按真实生产环境设计，写接口应只由后端受控调用，不能把数据库高权限凭证暴露到浏览器。

### 11.2 如何限制普通用户只能只读查询

创建只读数据库角色，仅授予：

- `"user"` 表的 `SELECT`
- `item` 表的 `SELECT`
- `orders` 表的 `SELECT`
- 视图的 `SELECT`

不给予任何写权限即可。

## 12. 并发与恢复问题回答

### 12.1 两个人同时购买同一商品会发生什么问题

如果没有并发控制，两个人可能同时读取到“未售出”，然后同时创建订单，造成重复购买。

### 12.2 如何解决

本项目采用：

- 事务
- 行级锁 `FOR UPDATE`
- `UNIQUE (orders.item_id)`
- 购买函数内部的状态检查

因此即使两个请求同时到达，也只能有一个事务成功提交。

### 12.3 系统崩溃后如何恢复订单数据

订单数据保存在 PostgreSQL 中，而不是内存里。恢复方法包括：

- 使用 Neon / Supabase 的自动备份
- 使用 WAL / PITR（时间点恢复）
- 回滚到故障前的数据库快照

## 13. GitHub 与 Vercel 工作流说明

推荐流程：

1. 本地完成代码
2. `git init`
3. 提交到 GitHub 仓库 `campus-second-hand-platform-db`
4. 在 Vercel 导入 GitHub 仓库
5. 在 Vercel 配置环境变量：
   - `DATABASE_URL`
   - `PGSSL=require`
6. 先执行一次数据库初始化
7. 触发部署
8. 获得线上公开 URL
9. 将该 URL 放到本文档最上方

## 14. 从运行代码到得到部署链接的步骤

### 本地运行

1. `npm install`
2. 复制 `.env.example` 为 `.env.local`
3. 填写真实 PostgreSQL 连接串
4. `npm run db:setup`
5. `npm run dev`

### 线上部署

1. 将代码推送到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 将生产库执行一次 `sql/01~04`
5. 重新部署
6. 获得最终线上 URL

## 15. 需求覆盖清单

| 题目要求 | 实现位置 |
| --- | --- |
| 三张表与初始数据 | `sql/01_schema.sql` + `sql/02_seed.sql` |
| 主键/外键/检查/唯一约束 | `sql/01_schema.sql` |
| 新增一个商品 | `/items` 页 + `createItemAction` |
| 修改商品价格 | `/items` 页 + `updateItemPriceAction` |
| 删除一个未售出商品 | `/items` 页 + `deleteUnsoldItemAction` |
| 查询未售出商品 | `/items?filter=unsold` |
| 查询价格大于 30 | `/items?filter=price_gt_30` |
| 查询生活用品 | `/items?filter=daily_goods` |
| 查询 u001 发布商品 | `/items?filter=seller_u001` |
| 已售商品与买家姓名 | `/orders` 页 |
| 订单的商品名+买家名+日期 | `/orders` 页 |
| u001 发布商品是否被购买 | `/orders` 页 |
| 商品总数 / 分类数 / 平均价格 / 发布最多用户 | 首页 + 用户页 |
| 真实 SQL 视图 | `sql/03_views.sql` + 首页/商品页/订单页 |
| SQL 购买逻辑 | `sql/04_purchase_logic.sql` + `/items` 页 |
| 安全性说明 | 本文第 11 节 |
| 并发与恢复说明 | 本文第 12 节 |

## 16. 当前已完成验证

- `npm run build` 已通过
- `npm run lint` 已通过

说明：

- 代码结构、类型检查、Next.js 构建均已验证
- 真实数据库运行验证还需要提供 `DATABASE_URL`
- 最终线上 URL 还需要完成 GitHub / Vercel / PostgreSQL 实际账号配置

## 17. 剩余人工步骤（如果当前机器没有线上账号权限）

1. 准备一个 Neon 或 Supabase PostgreSQL 数据库
2. 获取连接串并填写到 `.env.local` / Vercel 环境变量
3. 执行 `npm run db:setup`
4. 推送到 GitHub
5. 在 Vercel 导入并部署
6. 将生成的线上 URL 写回本文第一行
