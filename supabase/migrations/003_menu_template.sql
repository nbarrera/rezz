-- weekly_menus: convert to a single permanent template per user (no week dates)
ALTER TABLE cooking.weekly_menus DROP CONSTRAINT weekly_menus_user_id_week_start_date_key;
ALTER TABLE cooking.weekly_menus DROP COLUMN week_start_date;
ALTER TABLE cooking.weekly_menus ADD CONSTRAINT weekly_menus_user_id_key UNIQUE (user_id);

-- menu_slots: allow multiple recipes per slot
ALTER TABLE cooking.menu_slots DROP CONSTRAINT menu_slots_menu_id_day_of_week_meal_type_key;
