# MLBB Shop API

Project Express 5, TypeScript, Prisma ORM 7, dan PostgreSQL (Neon) untuk tugas Modul 4.

## Persiapan

1. Install dependency dengan `npm install`.
2. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` pooled dan `DATABASE_URL_UNPOOLED` direct dari Neon.
3. Buat tabel dan Prisma Client:

   ```powershell
   npm run db:migrate -- --name init
   npm run db:generate
   ```

4. Isi database dari dataset:

   ```powershell
   npm run db:seed
   ```

5. Jalankan server dengan `npm run dev`. Server menggunakan port `3000` jika `PORT` tidak diatur.

Seed mengosongkan tabel `PlayerHero`, `Player`, `Skin`, dan `Hero`, lalu memasukkan 133 hero, 892 skin, serta tiga player awal. Jalankan pada database tugas yang memang boleh di-reset.

`data/heroes.json` dan `data/skins.json` dibuat dari `heroes.csv` dan `skins.csv` pada folder dataset yang diberikan. File JSON hanya memuat kolom sesuai soal; urutan CSV dipertahankan agar ID hasil seed sesuai testcase.

## Endpoint Anggota 1

- `GET /health`
- `GET /api/heroes?page=1&limit=10&search=la&role=MARKSMAN`
- `GET /api/heroes/:hero_id`
- `POST /api/heroes`
- `GET /api/skins?page=1&limit=10&heroId=18&rarity=GRAND`
- `GET /api/skins/:skin_id`

## Endpoint Anggota 2

- `POST /api/players`
- `GET /api/players/:player_id`
- `PATCH /api/players/:player_id`
- `DELETE /api/players/:player_id`
- `POST /api/players/:player_id/topup` 
- `POST /api/players/:player_id/matches` 

Pagination menggunakan default `page=1` dan `limit=10`, dengan batas `limit` 100. Response daftar menyertakan `metadata` dengan `currentPage`, `limit`, `totalItems`, dan `totalPages`.

Jalankan `npm run typecheck` untuk memeriksa tipe TypeScript. Prisma Client harus dibuat ulang dengan `npm run db:generate` setelah clone atau perubahan schema.
