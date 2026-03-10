# Rezz — Recipe & Meal Planner: Project Roadmap & Handoff

## Project Summary

A personal household PWA for managing cooking recipes, planning weekly menus, and generating shopping lists. Built for 2 Android users (shared login in v1). Simple, private, no community features.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Client | Solid.js + TypeScript | Functional, reducer-based state, JSX |
| Build tool | Vite | Standard setup |
| Testing | Vitest | Already wired in template |
| Styling | TBD — not yet added | Tailwind recommended |
| Routing | TBD — not yet added | TanStack Router recommended |
| FP utilities | Remeda | For shopping list pipeline |
| PWA | vite-plugin-pwa | Not yet configured |
| Hosting | Vercel | Auto-deploys from GitHub on push to main |
| Database | Supabase (Postgres) | Schema: `cooking` |
| Auth | Supabase Auth | Email + password, not yet implemented |
| API | Supabase JS client | Direct from client, no custom backend |

### Key decisions made
- **No custom backend** — Solid.js app talks directly to Supabase via JS client. No Express, no controllers, no ORM.
- **No state management library** — Solid.js built-in reactivity + reducer pattern is sufficient.
- **Reducer pattern for UI state** — `action(state) -> newState`, pure functions, fully unit testable without framework.
- **Remeda** over Ramda — same FP/pipe style but designed for TypeScript from scratch.
- **PWA over native** — Android-first users, no hardware access needed, installs to home screen via Chrome.
- **Single Supabase project, multiple schemas** — `cooking` schema for this app, room for future side projects in other schemas. Auth is shared across schemas.
- **Unit normalization in code, not DB** — `unit` is a plain `TEXT` column. Conversion map lives in TypeScript and grows without schema changes.
- **Shopping list as snapshot** — `shopping_items.name` is denormalized plain text. Changing a recipe later does not affect existing lists.
- **Multiple shopping lists per menu allowed** — regenerating creates a new list. App shows latest by `generated_at`.

---

## Repository

- **GitHub repo**: `rezz` (owner: nbarrera)
- **Vercel**: connected to GitHub, auto-deploys on push to `main`
- **Local dev**: MacBook, using Bun as package manager and runtime

### Project structure
```
rezz/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          ← Supabase client (done)
│   │   └── database.types.ts    ← Generated types from schema (done)
│   ├── App.tsx
│   └── index.tsx
├── supabase/
│   └── migrations/
│       └── 001_cooking_schema.sql   ← Full schema + RLS (done, run in prod)
├── .env.local                   ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (not committed)
├── .gitignore
└── vite.config.ts
```

### Environment variables
```
VITE_SUPABASE_URL=https://yygjgdepvhwvsoqkvzkk.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key — safe to expose to browser>
```
Same vars added to Vercel environment variables for production.

---

## Supabase Setup

- **Project ID**: `yygjgdepvhwvsoqkvzkk`
- **Schema**: `cooking`
- **Migration 001 already run in production**
- **RLS enabled on all tables** — policies enforce ownership via `auth.uid()`
- **TypeScript types generated** into `src/lib/database.types.ts`

To regenerate types after schema changes:
```bash
SUPABASE_ACCESS_TOKEN=xxx npx supabase gen types typescript \
  --project-id yygjgdepvhwvsoqkvzkk \
  --schema cooking \
  > src/lib/database.types.ts
```
Note: use `npx` not `bunx` — Supabase CLI postinstall has a Bun compatibility issue.

---

## Data Model

### Tables (all in `cooking` schema)

**`recipes`** — `id, user_id, name, description, servings, created_at`

**`ingredient_catalog`** — `id, user_id, name, created_at`
- `UNIQUE (user_id, name)` — no duplicates
- Names normalized to lowercase + trimmed **in application code** before insert

**`ingredients`** — `id, recipe_id, catalog_ingredient_id, quantity (NUMERIC), unit (TEXT)`

**`weekly_menus`** — `id, user_id, week_start_date (DATE), created_at`
- `UNIQUE (user_id, week_start_date)`

**`menu_slots`** — `id, menu_id, recipe_id, day_of_week (1-7), meal_type ('lunch'|'dinner')`
- `UNIQUE (menu_id, day_of_week, meal_type)` — one recipe per meal per day
- Absence of a row = empty slot (no nulls needed)

**`shopping_lists`** — `id, menu_id, generated_at`
- Multiple allowed per menu — no unique constraint on `menu_id`

**`shopping_items`** — `id, shopping_list_id, name (TEXT snapshot), total_quantity (NUMERIC), unit (TEXT), is_bought (BOOLEAN)`

---

## Shopping List Generation

Pure function pipeline — no side effects, no Supabase calls inside. Lives in `src/lib/shoppingList.ts` (not yet created).

```
menu_slots
→ collect recipes
→ collect ingredients (with catalog names)
→ normalize units to base unit
→ group by (ingredient_name + base_unit)
→ sum quantities
→ format output (e.g. 1000g → 1kg)
→ insert into shopping_items
```

### Unit normalization — Phase 1 (implement now)
```typescript
const conversionMap = {
  mg: { base: 'g',  factor: 0.001 },
  kg: { base: 'g',  factor: 1000  },
  ml: { base: 'l',  factor: 0.001 },
  cl: { base: 'l',  factor: 0.01  },
  dl: { base: 'l',  factor: 0.1   },
}
// Unknown units: sum as-is, no crash
```

### Phase 2 (designed for, not yet built)
```typescript
tsp:  { base: 'tbsp', factor: 0.333 },
// 'unit', 'can', 'slice', 'pinch' → sum as-is
```

---

## Owner Scope Pattern

**Critical convention** — never use raw `user_id` scattered in queries. Always use a helper:

```typescript
// src/lib/ownerScope.ts
export const getOwnerScope = (userId: string) => ({ user_id: userId })
```

When households are added later, this becomes:
```typescript
export const getOwnerScope = (householdId: string) => ({ household_id: householdId })
```

Tables that will migrate to `household_id`: `recipes`, `ingredient_catalog`, `weekly_menus`.
Tables unaffected (reference via FK): `ingredients`, `menu_slots`, `shopping_lists`, `shopping_items`.

---

## Ingredient Catalog — UX Convention

When user types an ingredient name in a recipe form:
1. Trim whitespace + lowercase
2. Search `ingredient_catalog` for match
3. Show autocomplete suggestions
4. If no match → create new catalog entry on save
5. Always store normalized name

---

## Roadmap

### ✅ Done
- Project scaffolded (Solid.js + Vite + TypeScript + Vitest)
- Vercel connected, auto-deploy working
- Supabase project live
- Schema + RLS migration written and run
- Supabase JS client wired in (`src/lib/supabase.ts`)
- TypeScript types generated

### ✅ Foundation
- [x] Add Tailwind CSS
- [x] Configure vite-plugin-pwa (manifest + service worker)
- [x] Create `src/lib/ownerScope.ts`
- [x] Create `src/lib/units.ts` (conversion map + normalize function)
- [x] Create `src/lib/shoppingList.ts` (pure pipeline, unit tested)
- [x] Culinary Pastels color theme (Gardenia background)
- [x] Reusable UI components: Button (variants), Input, TextArea, AppShell

### ✅ Auth
- [x] Supabase email+password auth
- [x] Login screen
- [x] Auth state in Solid context
- [x] Protected routes (redirect to login if not authenticated)
- [x] Logout

### ✅ Recipes
- [x] Recipe list screen
- [x] Create recipe form
- [x] Edit recipe form
- [x] Delete recipe
- [x] Ingredient rows within recipe form (with catalog autocomplete)

### ✅ Ingredient Catalog
- [x] Autocomplete component (search catalog, create on miss)
- [x] Normalization on input (trim + lowercase)

### 🔲 Weekly Menu
- [ ] Weekly menu screen (7 days × lunch + dinner grid)
- [ ] Assign recipe to slot
- [ ] Clear a slot
- [ ] Navigate between weeks

### 🔲 Shopping List
- [ ] Generate list button (triggers pipeline)
- [ ] Shopping list screen
- [ ] Toggle `is_bought` per item
- [ ] "Mark all bought" bulk action
- [ ] Show latest list, preserve history

### 🔲 PWA Polish
- [ ] App manifest (name, icon, theme color)
- [ ] Offline support (cache shell + Supabase responses)
- [ ] "Add to home screen" prompt on Android

### 🔲 Future (not v1)
- [ ] Household / multi-family support (see Owner Scope Pattern above)
- [ ] Supabase CLI local dev setup + seed data
- [ ] Unit normalization Phase 2 (spoons, pieces)
- [ ] Recipe servings scaler

---

## Notes for continuing LLM

- User is comfortable with TypeScript and functional programming concepts
- User likes the `action(state) -> newState` reducer pattern — keep business logic as pure functions
- User likes Remeda for pipelines — use `pipe()` and Remeda utilities in the shopping list logic
- Avoid over-engineering — this is a personal pet project, keep it lean
- No backend server — everything goes through Supabase JS client directly
- Use `bunx` for most things but `npx` for Supabase CLI specifically (Bun compatibility issue)
- Schema is in `cooking` Postgres schema — all Supabase queries need `.schema('cooking')` or table names prefixed accordingly — verify behavior with Supabase JS client v2
- RLS is enabled — all queries require an authenticated user or they'll return empty
