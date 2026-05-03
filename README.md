# Online URL
Pending deployment. Configure a real PostgreSQL database and connect the repo to Vercel to obtain the final public URL.

# Campus Second-Hand Trading Platform Database System

This project is a database-first university course assignment built with Next.js App Router, TypeScript, Tailwind CSS, and real PostgreSQL. It is intentionally designed so the SQL work is explicit and easy to explain in class:

- The database schema, seed data, views, and purchase logic live in `sql/`
- The web app reads live PostgreSQL data on the server side
- All write operations modify the real database
- The purchase flow calls a PostgreSQL function instead of frontend-only logic

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- PostgreSQL (`pg` driver)
- Raw SQL for schema, seed, views, and business logic
- Vercel-ready deployment structure

## Implemented Features

- Home dashboard with analytics
- Item list page with:
  - full item table
  - required basic queries
  - add item
  - update price
  - delete unsold item
  - purchase item through SQL function
- User list page with seller statistics and top publisher
- Order list page with required join queries and sold-items view
- Real SQL views:
  - `sold_items_view`
  - `unsold_items_view`
- Real SQL purchase function:
  - `purchase_item(item_id, buyer_id, order_date)`

## Database Design Notes

### Tables

- `"user"`: `user_id`, `user_name`, `phone`
- `item`: `item_id`, `item_name`, `category`, `price`, `status`, `seller_id`
- `orders`: `order_id`, `item_id`, `buyer_id`, `order_date`

### Integrity Constraints

- primary keys on all three tables
- `NOT NULL` on required columns
- `CHECK (status IN (0,1))`
- `UNIQUE (orders.item_id)` to guarantee one item can be traded at most once
- foreign keys:
  - `item.seller_id -> "user".user_id`
  - `orders.buyer_id -> "user".user_id`
  - `orders.item_id -> item.item_id`

### Additional Defensive SQL Logic

- trigger on `orders` to ensure an ordered item must already be marked as sold
- trigger on `item` to prevent changing an ordered item back to `status = 0`
- helper functions:
  - `next_item_id()`
  - `next_order_id()`

### Why `"user"` Is Quoted

PostgreSQL treats `user` as a special identifier. The assignment requires the table name to remain `user`, so the project keeps the required name and always references it as `"user"` in SQL.

## Project Structure

```text
app/
  page.tsx
  items/
    page.tsx
    actions.ts
  users/page.tsx
  orders/page.tsx
components/
lib/
  db.ts
  queries.ts
  format.ts
  types.ts
sql/
  01_schema.sql
  02_seed.sql
  03_views.sql
  04_purchase_logic.sql
  05_sample_queries.sql
scripts/
  setup-db.mjs
  check-db.mjs
README.md
REPORT_CN.md
.env.example
```

## Environment Variables

Copy `.env.example` to `.env.local` and set a real PostgreSQL connection string.

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
PGSSL=require
```

For Supabase or Neon, keep SSL enabled with `PGSSL=require`. Do not add `sslmode=require` into the connection string, because this project already applies SSL in code.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure PostgreSQL:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill `DATABASE_URL`.

3. Initialize the database:

```bash
npm run db:setup
```

This executes:

- `sql/01_schema.sql`
- `sql/02_seed.sql`
- `sql/03_views.sql`
- `sql/04_purchase_logic.sql`

4. Optional database verification:

```bash
npm run db:check
```

5. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment Steps to Vercel

### Option A: GitHub + Vercel recommended workflow

1. Initialize Git locally if needed:

```bash
git init
git add .
git commit -m "feat: campus second-hand platform db system"
```

2. Create a GitHub repository, for example:

```text
campus-second-hand-platform-db
```

3. Push the code to GitHub:

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

4. Import the GitHub repository into Vercel.

5. In Vercel project settings, add:

- `DATABASE_URL`
- `PGSSL=require`

6. Initialize the target database once before the first demo:

- run `npm run db:setup` locally against the production database URL, or
- paste the SQL files into Neon / Supabase SQL editor in order

7. Trigger a production deployment in Vercel.

8. Copy the generated public URL and place it at the top of `REPORT_CN.md`.

### Option B: Direct Vercel import without GitHub

Possible, but GitHub is recommended because the assignment explicitly requests a GitHub + Vercel workflow.

## SQL Business Logic

The required purchase operation is implemented in PostgreSQL, not in frontend JavaScript.

File: `sql/04_purchase_logic.sql`

Behavior:

1. lock the target item row with `FOR UPDATE`
2. verify the item exists
3. verify the item is still unsold
4. generate a new order id with `next_order_id()`
5. update `item.status` to `1`
6. insert into `orders`

The `UNIQUE (orders.item_id)` constraint provides an extra safety net against double purchase.

## ID Strategy

- user ids stay in the `u001` style
- item ids are generated from `next_item_id()`
- order ids are generated from `next_order_id()`

For new items, the app obtains the next id inside a transaction before insertion. For purchases, the SQL function generates the order id on the database side.

## Security Explanation

### How to prevent ordinary users from deleting data

Use separate PostgreSQL roles:

- a management/service role used only by trusted server-side actions or maintenance scripts
- a read-only role for ordinary users

Grant `DELETE`, `INSERT`, and `UPDATE` only to the management role. The public-facing application should never expose direct SQL credentials in the browser.

### How to restrict ordinary users to read-only querying

Create a PostgreSQL role with only `SELECT` privileges on tables and views:

- `"user"`
- `item`
- `orders`
- `sold_items_view`
- `unsold_items_view`

Do not grant write privileges. In a real production deployment, the frontend should call only restricted server endpoints or use a read-only connection for public queries. This demo repository keeps the write actions open in the UI for classroom demonstration, but the database-role design should still follow least privilege.

## Concurrency and Recovery Explanation

### If two users try to buy the same item at the same time

Without transaction control, both requests might read the item as unsold and both try to create an order, causing a classic race condition.

### How this project solves it

- `purchase_item(...)` locks the row with `SELECT ... FOR UPDATE`
- the function checks the current status after the lock is acquired
- `UNIQUE (orders.item_id)` blocks duplicate orders even if two transactions race
- the whole function runs as one database transaction

This ensures only one buyer can successfully purchase a given item.

### How to recover order data after a crash

Use managed PostgreSQL backups and WAL-based recovery from the cloud provider:

- Neon branch restore / point-in-time recovery
- Supabase backups / PITR depending on plan

Because orders are stored in PostgreSQL, they can be recovered from backups or write-ahead logs rather than from application memory.

## Notes for Demo

- All pages use server-side data fetching
- No mocked JSON is used as the source of truth
- After any mutation, the pages are revalidated and reflect the latest database state
- The UI maps `DailyGoods` to `生活用品 / DailyGoods` so the stored seed data remains exactly as required

## Verified Locally

- `npm run build`
- `npm run lint`

Database runtime verification still requires a real `DATABASE_URL`.
