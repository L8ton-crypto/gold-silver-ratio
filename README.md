# GoldSilverRatio

Live gold/silver ratio with 12-month band. One number tells you whether silver is screaming buy, screaming sell, or noise.

## Stack
Next.js 15 (App Router) - Tailwind dark - @neondatabase/serverless - Chart.js - Stooq spot feed.

## Endpoints
- `GET /api/gsr` - current spot + 12-month history + bands + interpretation
- `GET /api/gsr?force=1` - forces a live refresh ignoring the 30-minute cache
- `GET /api/cron` - daily snapshot, scheduled via vercel.json at 06:00 UTC

## Env
- `DATABASE_URL` - Neon Postgres connection (pooled, sslmode=require)
- `CRON_SECRET` - optional; if set, the cron endpoint requires `Authorization: Bearer <secret>`

## Notes
- Companion to SpotPremium (task-118) - uses the same Stooq path because Yahoo blocks Vercel egress.
- ensureDb() lazily creates the gsr_snapshots table on first request.
- Bands are mean +/- 1 sigma and +/- 2 sigma over the trailing 365 days.
