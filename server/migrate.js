const db = require("./db");

async function tableExists(tableName) {
  const [rows] = await db.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = :tableName`,
    { dbName: db.dbName, tableName }
  );
  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = :tableName AND COLUMN_NAME = :columnName`,
    { dbName: db.dbName, tableName, columnName }
  );
  return rows.length > 0;
}

async function addColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) return;
  await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function migrate() {
  await db.ensureDatabase();

  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL UNIQUE,
      icon VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(80) PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      rating DECIMAL(3,1) DEFAULT 0,
      reviews INT DEFAULT 0,
      image VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL,
      subject VARCHAR(160) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_code VARCHAR(24) NOT NULL UNIQUE,
      session_id VARCHAR(80),
      customer_name VARCHAR(120) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      address TEXT NOT NULL,
      note TEXT,
      payment_method VARCHAR(80) NOT NULL,
      payment_status VARCHAR(40) NOT NULL DEFAULT 'Pending',
      subtotal DECIMAL(10,2) NOT NULL,
      delivery_fee DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      order_status VARCHAR(40) NOT NULL DEFAULT 'Placed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id VARCHAR(80) NOT NULL,
      product_name VARCHAR(160) NOT NULL,
      base_product_name VARCHAR(120),
      option_summary VARCHAR(255),
      size_name VARCHAR(80),
      addons_json JSON,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      line_total DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cart_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(80) NOT NULL,
      action VARCHAR(80) NOT NULL,
      product_id VARCHAR(80) NOT NULL,
      product_name VARCHAR(160) NOT NULL,
      category VARCHAR(80),
      option_summary VARCHAR(255),
      quantity INT DEFAULT 0,
      unit_price DECIMAL(10,2) DEFAULT 0,
      cart_total DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (await tableExists("orders")) {
    await addColumn("orders", "session_id", "VARCHAR(80) NULL AFTER order_code");
  }

  if (await tableExists("order_items")) {
    await addColumn("order_items", "base_product_name", "VARCHAR(120) NULL AFTER product_name");
    await addColumn("order_items", "option_summary", "VARCHAR(255) NULL AFTER base_product_name");
    await addColumn("order_items", "size_name", "VARCHAR(80) NULL AFTER option_summary");
    await addColumn("order_items", "addons_json", "JSON NULL AFTER size_name");
  }

  if (await tableExists("cart_events")) {
    await addColumn("cart_events", "option_summary", "VARCHAR(255) NULL AFTER category");
  }
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("Database migrated successfully.");
      await db.end();
    })
    .catch(async (error) => {
      console.error(error.message);
      await db.end();
      process.exit(1);
    });
}

module.exports = migrate;
