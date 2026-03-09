-- ============================================
-- SCHEMA
-- ============================================

CREATE SCHEMA IF NOT EXISTS cooking;


-- ============================================
-- TABLES
-- ============================================

CREATE TABLE cooking.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    servings INTEGER NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cooking.ingredient_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

CREATE TABLE cooking.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES cooking.recipes(id) ON DELETE CASCADE,
    catalog_ingredient_id UUID NOT NULL REFERENCES cooking.ingredient_catalog(id),
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL
);

CREATE TABLE cooking.weekly_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_start_date)
);

CREATE TABLE cooking.menu_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES cooking.weekly_menus(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES cooking.recipes(id),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    meal_type TEXT NOT NULL CHECK (meal_type IN ('lunch', 'dinner')),
    UNIQUE (menu_id, day_of_week, meal_type)
);

CREATE TABLE cooking.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES cooking.weekly_menus(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cooking.shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES cooking.shopping_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    is_bought BOOLEAN NOT NULL DEFAULT FALSE
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX ON cooking.recipes (user_id);
CREATE INDEX ON cooking.ingredient_catalog (user_id);
CREATE INDEX ON cooking.weekly_menus (user_id);
CREATE INDEX ON cooking.menu_slots (menu_id);
CREATE INDEX ON cooking.shopping_lists (menu_id);
CREATE INDEX ON cooking.shopping_items (shopping_list_id);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE cooking.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking.ingredient_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking.weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking.menu_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking.shopping_items ENABLE ROW LEVEL SECURITY;


-- recipes
CREATE POLICY "users can manage their own recipes"
    ON cooking.recipes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ingredient_catalog
CREATE POLICY "users can manage their own catalog"
    ON cooking.ingredient_catalog FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ingredients (access via recipe ownership)
CREATE POLICY "users can manage ingredients of their recipes"
    ON cooking.ingredients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cooking.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- weekly_menus
CREATE POLICY "users can manage their own menus"
    ON cooking.weekly_menus FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- menu_slots (access via menu ownership)
CREATE POLICY "users can manage slots of their menus"
    ON cooking.menu_slots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cooking.weekly_menus
            WHERE weekly_menus.id = menu_slots.menu_id
            AND weekly_menus.user_id = auth.uid()
        )
    );

-- shopping_lists (access via menu ownership)
CREATE POLICY "users can manage their shopping lists"
    ON cooking.shopping_lists FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cooking.weekly_menus
            WHERE weekly_menus.id = shopping_lists.menu_id
            AND weekly_menus.user_id = auth.uid()
        )
    );

-- shopping_items (access via shopping list → menu ownership)
CREATE POLICY "users can manage their shopping items"
    ON cooking.shopping_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM cooking.shopping_lists
            JOIN cooking.weekly_menus ON weekly_menus.id = shopping_lists.menu_id
            WHERE shopping_lists.id = shopping_items.shopping_list_id
            AND weekly_menus.user_id = auth.uid()
        )
    );
