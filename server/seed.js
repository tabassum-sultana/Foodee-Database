const fs = require("fs");
const path = require("path");
const vm = require("vm");
require("dotenv").config();

const db = require("./db");
const migrate = require("./migrate");

function loadSiteData() {
  const dataPath = path.join(__dirname, "..", "js", "data.js");
  const code = fs.readFileSync(dataPath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.FoodeeData;
}

async function seed(options = {}) {
  const { runMigrate = true, closePool = false, silent = false } = options;
  if (runMigrate) await migrate();
  const data = loadSiteData();

  for (const category of data.categories) {
    await db.query(
      "INSERT INTO categories (name, icon) VALUES (:name, :icon) ON DUPLICATE KEY UPDATE icon = VALUES(icon)",
      category
    );
  }

  for (const product of data.products) {
    const [[category]] = await db.query("SELECT id FROM categories WHERE name = :name", { name: product.category });
    if (!category) continue;

    await db.query(
      `INSERT INTO products (id, category_id, name, description, price, rating, reviews, image)
       VALUES (:id, :categoryId, :name, :description, :price, :rating, :reviews, :image)
       ON DUPLICATE KEY UPDATE
         category_id = VALUES(category_id),
         name = VALUES(name),
         description = VALUES(description),
         price = VALUES(price),
         rating = VALUES(rating),
         reviews = VALUES(reviews),
         image = VALUES(image),
         is_active = TRUE`,
      {
        id: product.id,
        categoryId: category.id,
        name: product.name,
        description: product.desc,
        price: product.price,
        rating: product.rating,
        reviews: product.reviews,
        image: product.image
      }
    );
  }

  if (!silent) console.log(`Seeded ${data.categories.length} categories and ${data.products.length} products.`);
  if (closePool) await db.end();
  return {
    categories: data.categories.length,
    products: data.products.length
  };
}

if (require.main === module) {
  seed({ closePool: true }).catch(async (error) => {
    console.error(error.message);
    await db.end();
    process.exit(1);
  });
}

module.exports = seed;
