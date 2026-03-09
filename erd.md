erDiagram
    users ||--o{ recipes : owns
    users ||--o{ weekly_menus : owns
    users ||--o{ ingredient_catalog : owns

    recipes ||--o{ ingredients : has
    ingredient_catalog ||--o{ ingredients : referenced_by

    weekly_menus ||--o{ menu_slots : has
    recipes ||--o{ menu_slots : used_in

    weekly_menus ||--o| shopping_lists : generates
    shopping_lists ||--o{ shopping_items : contains

    users {
        uuid id
    }

    recipes {
        uuid id
        uuid user_id
        string name
        string description
        int servings
    }

    ingredient_catalog {
        uuid id
        uuid user_id
        string name
    }

    ingredients {
        uuid id
        uuid recipe_id
        uuid catalog_ingredient_id
        decimal quantity
        string unit
    }

    weekly_menus {
        uuid id
        uuid user_id
        date week_start_date
    }

    menu_slots {
        uuid id
        uuid menu_id
        uuid recipe_id
        int day_of_week
        string meal_type
    }

    shopping_lists {
        uuid id
        uuid menu_id
        timestamp generated_at
    }

    shopping_items {
        uuid id
        uuid shopping_list_id
        string name
        decimal total_quantity
        string unit
        boolean is_bought
    }
