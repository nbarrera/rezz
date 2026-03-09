# Recipe & Meal Planner — Architecture Decision Record

## What we're building

A personal household app to:
1. Create and manage cooking recipes with ingredients
2. Plan a weekly menu (lunch + dinner per day)
3. Auto-generate a shopping list from the weekly menu

Simple, private, no community features.

---

## Users

Household use (2 adults, Android phones). V1 uses a single shared login.
Household/multi-family support is a planned future upgrade — see Migration Path below.

---

## Tech Stack

| Layer | Decision |
|---|---|
| Client | Solid.js — PWA |
| Hosting | Vercel (free tier) |
| Database + REST API + Auth | Supabase (free tier) |

### Why Solid.js over React
Solid.js was designed after React, learning from its mistakes. It keeps JSX familiarity but replaces the hooks model with fine-grained reactivity — no `useEffect` dependency arrays, no stale closures, no virtual DOM overhead. Critically, it supports a reducer pattern (`action(state) -> newState`) natively, which keeps business logic as pure functions that are trivially unit testable without any framework ceremony.

### Why PWA over native
Target users are Android-only. PWA on Android Chrome installs to the home screen, runs fullscreen, and requires zero app store or build pipeline complexity. No hardware access or push notifications are needed.

### Why Vercel
Static hosting for the Solid.js PWA. Free tier is permanent with no inactivity penalties. Auto-deploys from GitHub.

### Why Supabase
- Postgres database with auto-generated REST API — no custom HTTP server or controllers needed
- Built-in auth with JWT, ties into Row Level Security (RLS)
- Free tier: 512MB storage (well within budget for a recipe app), pauses only on 1 week of inactivity
- Self-hostable if vendor lock-in becomes a concern later
- No ORM needed — Supabase JS client handles queries with full TypeScript type generation

### No backend server
The Solid.js app talks directly to Supabase via the JS client. No Express, no NestJS, no controllers. Edge Functions are available for future complex logic but are not needed for v1.

---

## Supporting Libraries

| Purpose | Library |
|---|---|
| Utility / FP pipelines | Remeda (Ramda-like, designed for TypeScript from scratch) |
| PWA setup | vite-plugin-pwa |

Remeda is used specifically for the shopping list generation pipeline — a pure functional transformation with no side effects, fully unit testable.

---

## Data Model

### Tables

**`recipes`**
```
id, user_id, name, description, servings, created_at
```

**`ingredient_catalog`**
```
id, user_id, name (unique, normalized)
```
Global reusable ingredient catalog per household. Names are trimmed and lowercased on creation. Autocomplete-as-you-type on the recipe form creates entries if they don't exist yet.

**`ingredients`** *(recipe ↔ catalog join with quantity)*
```
id, recipe_id, catalog_ingredient_id, quantity, unit
```

**`weekly_menus`**
```
id, user_id, week_start_date
```

**`menu_slots`**
```
id, menu_id, recipe_id, day_of_week, meal_type
```
`day_of_week`: 1–7. `meal_type`: `"lunch"` | `"dinner"`. Max 14 slots per week, all optional — absence of a row means empty slot.

**`shopping_lists`**
```
id, menu_id, generated_at
```
Multiple lists per menu are allowed. The app always shows the latest by `generated_at`. Previous lists are preserved as history.

**`shopping_items`**
```
id, shopping_list_id, name, total_quantity, unit, is_bought
```
`name` is stored as a plain string (denormalized snapshot). If an ingredient is renamed later, existing lists are unaffected. `is_bought` supports item-level checking plus a "mark all bought" bulk update.

---

## Shopping List Generation

A pure function pipeline — no side effects, no Supabase calls inside:

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

### Unit Normalization

Units are stored as plain strings in the DB (not an enum). The conversion map lives in code and grows over time without schema changes.

**Phase 1 — implemented now:**
```
Weight: mg → g → kg  (base: g)
Volume: ml → cl → dl → l  (base: l)
```

**Phase 2 — designed for, not yet built:**
```
Spoons: tsp → tbsp
Pieces: unit, can, slice, pinch (sum as-is, no cross conversion)
```

Unknown units are summed as-is — no crash, no data loss.

---

## Household Migration Path

V1 scopes everything to `user_id`. The schema is designed so migration to a `households` model is surgical:

**Tables that will migrate** (swap `user_id` → `household_id`):
- `recipes`
- `ingredient_catalog`
- `weekly_menus`

**Tables unaffected** (they reference the above via FK, migrate for free):
- `ingredients`, `menu_slots`, `shopping_lists`, `shopping_items`

**Code rule from day one:** never scatter raw `user_id` lookups across the codebase. Use a single `getOwnerScope()` helper that today returns `{ user_id }` and tomorrow returns `{ household_id }`. One change point.

**Migration steps when ready:**
1. Add `households` table
2. Add `household_id` to the three tables above
3. Migrate data — each existing user becomes a household of one
4. Swap `getOwnerScope()` implementation
5. Update RLS policies

---

## Supabase Project Strategy

A single Supabase project is used with multiple Postgres schemas as namespaces — one per app. Auth and storage limits are shared across schemas. This leaves room for future side projects within the same free tier project.

Schema for this app: `cooking`
