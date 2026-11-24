-- NEON PHARMA — Supabase schema
-- Urutan pemasangan:
--   1) Buat project Supabase
--   2) Jalankan file ini di SQL Editor
--   3) Jalankan supabase/seed.sql (katalog kategori + produk)
--   4) Buat user admin, lalu set role-nya (lihat bagian akhir file)
--   5) Isi .env.local dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  role text not null default 'customer'
    check (role in ('customer', 'staff', 'pharmacist', 'admin')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- catalog
create table if not exists public.categories (
  slug text primary key,
  name text not null,
  short text not null,
  emoji text not null default '💊',
  tone text not null default 'bg-primary-soft',
  blurb text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  category_slug text not null references public.categories(slug) on update cascade,
  price integer not null check (price >= 0),
  original_price integer,
  stock integer not null default 0 check (stock >= 0),
  requires_prescription boolean not null default false,
  description text not null default '',
  ingredients text,
  usage text,
  storage text,
  warning text,
  emoji text not null default '💊',
  tone text not null default 'bg-primary-soft',
  rating numeric(2,1) not null default 4.5,
  reviews integer not null default 0,
  sold integer not null default 0,
  badges text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_slug);

-- --------------------------------------------------------------- addresses
create table if not exists public.addresses (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  recipient text not null,
  phone text not null,
  detail text not null,
  city text not null,
  province text not null,
  postal text not null check (postal ~ '^[0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses(user_id);

-- ------------------------------------------------------------ prescriptions
create table if not exists public.prescriptions (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null,
  file_path text not null,
  doctor_name text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ orders
create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('transfer', 'ewallet', 'cod')),
  subtotal integer not null check (subtotal >= 0),
  shipping integer not null default 0 check (shipping >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  address jsonb not null,
  prescription_id text references public.prescriptions(id) on delete set null,
  requires_prescription boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  brand text not null,
  price integer not null check (price >= 0),
  quantity integer not null check (quantity > 0),
  emoji text not null default '💊',
  tone text not null default 'bg-primary-soft'
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- ----------------------------------------------------------- notifications
create table if not exists public.notifications (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'system'
    check (type in ('order', 'promo', 'system', 'prescription')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id);

-- ------------------------------------------------------ helper functions
-- Ketiganya SECURITY DEFINER supaya membaca public.profiles tanpa memicu RLS
-- profiles lagi. Tanpa itu policy profiles → is_staff() → policy profiles →
-- rekursi tak berujung (error "stack depth limit exceeded").
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'guest');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('admin', 'staff', 'pharmacist');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

-- Profil otomatis saat pendaftaran
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ------------------------------------------------------------ place order
create or replace function public.place_order(p_order jsonb, p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := p_order->>'id';
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if (p_order->>'user_id')::uuid <> v_uid then
    raise exception 'forbidden';
  end if;

  insert into public.orders (
    id, user_id, customer_name, email, status, payment_method,
    subtotal, shipping, discount, total, address, prescription_id,
    requires_prescription, note, created_at
  ) values (
    v_id, v_uid, p_order->>'customer_name', p_order->>'email',
    coalesce(p_order->>'status', 'pending'),
    p_order->>'payment_method',
    (p_order->>'subtotal')::int,
    (p_order->>'shipping')::int,
    (p_order->>'discount')::int,
    (p_order->>'total')::int,
    coalesce(p_order->'address', '{}'::jsonb),
    nullif(p_order->>'prescription_id', ''),
    coalesce((p_order->>'requires_prescription')::boolean, false),
    nullif(p_order->>'note', ''),
    coalesce((p_order->>'created_at')::timestamptz, now())
  )
  on conflict (id) do nothing;

  insert into public.order_items (order_id, product_id, name, brand, price, quantity, emoji, tone)
  select
    v_id,
    item->>'product_id',
    item->>'name',
    item->>'brand',
    (item->>'price')::int,
    (item->>'quantity')::int,
    coalesce(item->>'emoji', '💊'),
    coalesce(item->>'tone', 'bg-primary-soft')
  from jsonb_array_elements(p_items) as item;

  update public.products p
  set stock = greatest(0, p.stock - aggregated.qty),
      sold = p.sold + aggregated.qty,
      updated_at = now()
  from (
    select item->>'product_id' as product_id,
           sum((item->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) as item
    group by 1
  ) as aggregated
  where p.id = aggregated.product_id;

  return v_id;
end;
$$;

-- ----------------------------------------------------------- cancel order
create or replace function public.cancel_order(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
    and (user_id = auth.uid() or public.is_staff());

  if not found then
    raise exception 'order not found';
  end if;
  if v_order.status in ('delivered', 'cancelled') then
    raise exception 'order cannot be cancelled';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id;

  update public.products p
  set stock = p.stock + items.qty,
      sold = greatest(0, p.sold - items.qty)
  from (
    select product_id, sum(quantity) as qty
    from public.order_items
    where order_id = p_order_id
    group by product_id
  ) as items
  where p.id = items.product_id;
end;
$$;

-- ------------------------------------------------------ row level security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.prescriptions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profil sendiri atau staf" on public.profiles;
create policy "profil sendiri atau staf" on public.profiles
for select using (id = auth.uid() or public.is_staff());

drop policy if exists "buat profil sendiri" on public.profiles;
create policy "buat profil sendiri" on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "ubah profil sendiri" on public.profiles;
create policy "ubah profil sendiri" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "kategori publik" on public.categories;
create policy "kategori publik" on public.categories
for select using (true);

drop policy if exists "kategori dikelola staf" on public.categories;
create policy "kategori dikelola staf" on public.categories
for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "produk publik" on public.products;
create policy "produk publik" on public.products
for select using (true);

drop policy if exists "produk dikelola staf" on public.products;
create policy "produk dikelola staf" on public.products
for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "alamat milik sendiri" on public.addresses;
create policy "alamat milik sendiri" on public.addresses
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "resep sendiri atau staf" on public.prescriptions;
create policy "resep sendiri atau staf" on public.prescriptions
for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists "unggah resep sendiri" on public.prescriptions;
create policy "unggah resep sendiri" on public.prescriptions
for insert with check (user_id = auth.uid());

drop policy if exists "verifikasi resep oleh staf" on public.prescriptions;
create policy "verifikasi resep oleh staf" on public.prescriptions
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "pesanan sendiri atau staf" on public.orders;
create policy "pesanan sendiri atau staf" on public.orders
for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists "buat pesanan sendiri" on public.orders;
create policy "buat pesanan sendiri" on public.orders
for insert with check (user_id = auth.uid());

drop policy if exists "staf mengubah pesanan" on public.orders;
create policy "staf mengubah pesanan" on public.orders
for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "item pesanan dapat dibaca" on public.order_items;
create policy "item pesanan dapat dibaca" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid() or public.is_staff())
  )
);

drop policy if exists "item pesanan dibuat bersama pesanan" on public.order_items;
create policy "item pesanan dibuat bersama pesanan" on public.order_items
for insert with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "notifikasi sendiri atau staf" on public.notifications;
create policy "notifikasi sendiri atau staf" on public.notifications
for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists "buat notifikasi" on public.notifications;
create policy "buat notifikasi" on public.notifications
for insert with check (user_id = auth.uid() or public.is_staff());

drop policy if exists "ubah notifikasi sendiri" on public.notifications;
create policy "ubah notifikasi sendiri" on public.notifications
for update using (user_id = auth.uid() or public.is_staff())
with check (user_id = auth.uid() or public.is_staff());

-- --------------------------------------------------- izin data api (grants)
-- Tabel yang dibuat lewat SQL tidak otomatis terbuka untuk Data API (PostgREST).
-- Tanpa GRANT di bawah, anon/authenticated akan kena "permission denied"
-- walaupun policy RLS-nya sudah benar. RLS tetap yang membatasi barisnya.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;

-- Pengunjung tanpa login hanya boleh membaca katalog.
grant select on public.categories, public.products to anon;

grant execute on function public.current_role(), public.is_staff(), public.is_admin()
  to anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb), public.cancel_order(text)
  to authenticated;

-- --------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false)
on conflict (id) do nothing;

drop policy if exists "unggah resep ke folder sendiri" on storage.objects;
create policy "unggah resep ke folder sendiri" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'prescriptions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "baca resep sendiri atau staf" on storage.objects;
create policy "baca resep sendiri atau staf" on storage.objects
for select to authenticated
using (
  bucket_id = 'prescriptions'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
);

-- ------------------------------------------------------------------- admin
-- Setelah mendaftar lewat aplikasi, jadikan akun pertama sebagai admin:
--   update public.profiles set role = 'admin' where email = 'admin@emailkamu.com';
-- Peran lain yang tersedia: 'staff', 'pharmacist', 'customer'.
