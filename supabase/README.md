# Setup Supabase — NEON PHARMA

Aplikasi otomatis memakai Supabase bila `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
tersedia. Tanpa keduanya, aplikasi berjalan dalam mode demo lokal (localStorage).

## 1. Buat project

1. Masuk ke [supabase.com](https://supabase.com) → **New project**.
2. Buka **Project Settings → API**, salin **Project URL** dan **anon public key**.
3. Salin `.env.example` menjadi `.env.local`, lalu isi kedua nilai tersebut:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Anon key aman dipakai di browser **selama RLS aktif** (sudah disiapkan di skema).
Jangan pernah memakai `service_role` key di frontend.

## 2. Jalankan SQL

Di **SQL Editor**, jalankan berurutan:

1. `supabase/schema.sql` — tabel, index, RLS, trigger profil, RPC `place_order` & `cancel_order`,
   bucket privat `prescriptions` beserta policy storage.
2. `supabase/seed.sql` — 6 kategori dan 26 produk awal.

## 3. Buat akun staf

1. Daftar melalui halaman **/register** di aplikasi.
2. Ubah peran akun di SQL Editor:

```sql
update public.profiles set role = 'admin'      where email = 'emailkamu@gmail.com';
update public.profiles set role = 'pharmacist' where email = 'apoteker@email.com';
update public.profiles set role = 'staff'      where email = 'pegawai@email.com';
```

Peran yang tersedia: `customer`, `staff`, `pharmacist`, `admin`.

## 4. Pengaturan Auth (opsional)

- **Authentication → Providers → Email**: matikan *Confirm email* bila ingin langsung masuk
  setelah mendaftar. Bila dibiarkan aktif, aplikasi meminta pengguna mengonfirmasi email dulu.
- **Authentication → URL Configuration**: tambahkan `http://127.0.0.1:5173` dan URL produksi
  ke *Site URL* / *Redirect URLs* agar tautan reset password bekerja.
- Template email reset password memakai tautan dari Supabase; tetap perlu penyedia email
  bila ingin pengiriman sungguhan.

## 5. Verifikasi

```bash
npm run dev
```

- Halaman login tidak lagi menampilkan tombol akun demo (mode Supabase aktif).
- **Pengaturan apotek** menampilkan "Supabase Postgres / Supabase Auth".
- Buat pesanan baru, lalu pastikan stok produk berkurang di tabel `products` dan baris
  pesanan muncul di `orders` + `order_items`.
- Unggah resep saat checkout, lalu cek objek tersimpan di bucket `prescriptions`
  pada folder `{user_id}/...` dan baris baru di tabel `prescriptions`.
