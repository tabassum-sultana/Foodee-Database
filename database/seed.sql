USE foodee_db;

INSERT INTO categories (name, icon) VALUES
  ('Burgers', 'assets/food/categories/burgers.png'),
  ('Pizza', 'assets/food/categories/pizzas.png'),
  ('Pasta', 'assets/food/categories/pasta.png'),
  ('Chicken', 'assets/food/categories/chicken.png'),
  ('Ramen', 'assets/food/categories/pasta.png'),
  ('Salads', 'assets/food/categories/salads.png'),
  ('Drinks', 'assets/food/categories/drinks.png'),
  ('Desserts', 'assets/food/categories/desserts.png'),
  ('Soups', 'assets/icons/hot-pot.png'),
  ('Snacks', 'assets/food/categories/drinks.png')
ON DUPLICATE KEY UPDATE icon = VALUES(icon);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'burger', id, 'Cheese Burger', 'Juicy grilled patty with cheese, lettuce, tomato and house sauce.', 249, 4.6, 128, 'assets/food/menu-items/foodee-burger.png'
FROM categories WHERE name = 'Burgers'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'double-burger', id, 'Double Stack Burger', 'Double beef patty, melted cheese and spicy house sauce.', 329, 4.8, 166, 'assets/food/menu-items/double-burger.png'
FROM categories WHERE name = 'Burgers'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'supreme-pizza', id, 'Supreme Pizza', 'Loaded pizza with olives, peppers, onion and mozzarella.', 449, 4.8, 142, 'assets/food/menu-items/supreme-pizza.png'
FROM categories WHERE name = 'Pizza'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'alfredo-pasta', id, 'Creamy Alfredo Pasta', 'Rich white sauce pasta with herbs and cheese.', 279, 4.7, 112, 'assets/food/menu-items/foodee-pasta.png'
FROM categories WHERE name = 'Pasta'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'fried-chicken', id, 'Crispy Fried Chicken', 'Crispy juicy chicken with warm spices.', 299, 4.6, 104, 'assets/food/menu-items/foodee-chicken.png'
FROM categories WHERE name = 'Chicken'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'fries', id, 'French Fries', 'Crispy golden fries with a light pinch of salt.', 129, 4.3, 84, 'assets/food/dishes/french-fries.png'
FROM categories WHERE name = 'Snacks'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'lime-mojito', id, 'Lime Mint Mojito', 'Refreshing lime drink with mint and ice.', 149, 4.7, 77, 'assets/food/menu-items/lime-mojito-premium.png'
FROM categories WHERE name = 'Drinks'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);

INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
SELECT 'chocolate-cake', id, 'Chocolate Cake', 'Moist chocolate cake with rich ganache.', 199, 4.8, 135, 'assets/food/menu-items/chocolate-cake-premium.png'
FROM categories WHERE name = 'Desserts'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), image = VALUES(image);
