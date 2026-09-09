-- ==========================================================
-- Addon 4 — รันไฟล์นี้ "ต่อจาก" rental-app-schema-addon-3.sql เดิม
-- เพิ่มระบบร้านค้า (สินค้า + คำสั่งซื้อ + ชำระเงินแยกจากบิลค่าเช่า)
-- ==========================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null,
  photo text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table shop_orders (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'awaiting_confirmation', 'paid')),
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references shop_orders (id) on delete cascade,
  product_name text not null,
  unit_price numeric(10, 2) not null,
  quantity int not null,
  subtotal numeric(10, 2) not null
);

alter table products enable row level security;
alter table shop_orders enable row level security;
alter table shop_order_items enable row level security;

-- products: ทุกคน login แล้วอ่านได้ (ให้ผู้เช่าเห็นสินค้า) / แก้ได้เฉพาะเจ้าของบ้าน
create policy "products: everyone can read" on products
  for select using (auth.uid() is not null);
create policy "products: landlord full access" on products
  for all using (is_landlord()) with check (is_landlord());

-- shop_orders: เจ้าของบ้านทำได้ทุกอย่าง / ผู้เช่าเห็น+สร้าง+อัปเดตเฉพาะของห้องตัวเอง
create policy "shop_orders: landlord full access" on shop_orders
  for all using (is_landlord()) with check (is_landlord());
create policy "shop_orders: tenant view own" on shop_orders
  for select using (room_id in (select id from rooms where tenant_id = auth.uid()));
create policy "shop_orders: tenant insert own" on shop_orders
  for insert with check (room_id in (select id from rooms where tenant_id = auth.uid()));
create policy "shop_orders: tenant update own (notify transferred)" on shop_orders
  for update using (room_id in (select id from rooms where tenant_id = auth.uid()))
  with check (room_id in (select id from rooms where tenant_id = auth.uid()));

-- shop_order_items: เช่นเดียวกับข้างบน แต่เทียบผ่านตาราง shop_orders
create policy "shop_order_items: landlord full access" on shop_order_items
  for all using (is_landlord()) with check (is_landlord());
create policy "shop_order_items: tenant view own" on shop_order_items
  for select using (
    order_id in (
      select so.id from shop_orders so join rooms r on r.id = so.room_id
      where r.tenant_id = auth.uid()
    )
  );
create policy "shop_order_items: tenant insert own" on shop_order_items
  for insert with check (
    order_id in (
      select so.id from shop_orders so join rooms r on r.id = so.room_id
      where r.tenant_id = auth.uid()
    )
  );
