# Tournament + Match Storage Setup

## 1. Run the SQL in Supabase
Open Supabase SQL Editor and run:

- `supabase/migrations/20260327_tournament_match_storage.sql`

If you already created an older manual `matches` table in Supabase, back it up or rename it first before running this migration.

## 2. Verify the new tables exist
You should see:

- `events`
- `matches`
- `event_player_stats`
- `match_details`

## 3. Confirm env vars
Your app needs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VLR_API_BASE_URL`
- `NEXT_PUBLIC_BASE_URL`

## 4. Start the app
Run:

```bash
npm run dev
```

## 5. Run the first sync
Recommended first sync for active events only:

```bash
npm run sync:tournament-storage
```

Target one or more specific VLR event ids:

```bash
node scripts/sync-tournament-match-storage.mjs 2787,2863
```

Include completed events too:

```bash
node scripts/sync-tournament-match-storage.mjs all true
```

## 6. Read stored data
Useful local routes after syncing:

- `GET /api/storage/events`
- `GET /api/storage/matches?vlrEventId=2787`
- `GET /api/storage/event-stats?vlrEventId=2787`
- `GET /api/storage/match-details/639839`
- `POST /api/storage/sync`

## 7. Match detail route
The existing route:

- `GET /api/matches/[id]/[slug]`

now reads from the new storage layer and will refresh a stale match detail on demand.
