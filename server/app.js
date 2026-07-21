const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const migrate = require("./migrate");
const seed = require("./seed");

const app = express();
const rootDir = path.join(__dirname, "..");
const port = Number(process.env.PORT || 5500);
const adminSessions = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(rootDir));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;
  const [salt, savedKey] = storedHash.split(":");
  if (!salt || !savedKey) return false;
  const suppliedKey = crypto.scryptSync(password, salt, 64);
  const savedBuffer = Buffer.from(savedKey, "hex");
  return savedBuffer.length === suppliedKey.length && crypto.timingSafeEqual(savedBuffer, suppliedKey);
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const session = token ? adminSessions.get(token) : null;
  if (!session || session.expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ message: "Admin login required." });
  }
  req.admin = session;
  req.adminToken = token;
  next();
}

async function categoryIdByName(name, icon = "assets/icons/menu-list.png") {
  const [[existing]] = await db.query("SELECT id FROM categories WHERE name = :name", { name });
  if (existing) return existing.id;
  const [result] = await db.query(
    "INSERT INTO categories (name, icon) VALUES (:name, :icon)",
    { name, icon }
  );
  return result.insertId;
}

app.get("/api/health", asyncRoute(async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, database: "connected", dbName: db.dbName });
  } catch (error) {
    res.status(500).json({ ok: false, database: "disconnected", dbName: db.dbName, message: error.message });
  }
}));

app.post("/api/admin/login", asyncRoute(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  const [[admin]] = await db.query(
    "SELECT id, username, full_name AS name, role, password_hash AS passwordHash FROM admin_users WHERE username = :username",
    { username: username.trim() }
  );
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return res.status(401).json({ message: "Incorrect admin username or password." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + (12 * 60 * 60 * 1000);
  adminSessions.set(token, { id: admin.id, username: admin.username, name: admin.name, role: admin.role, expiresAt });
  res.json({ token, expiresAt, admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } });
}));

app.get("/api/admin/session", requireAdmin, (req, res) => {
  res.json({ ok: true, admin: req.admin });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  adminSessions.delete(req.adminToken);
  res.json({ message: "Logged out successfully." });
});

app.get("/api/products", asyncRoute(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT p.id, p.name, c.name AS category, p.price, p.rating, p.reviews, p.image, p.description AS \`desc\`
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = TRUE
    ORDER BY p.created_at ASC
  `);
  res.json(rows);
}));

app.get("/api/categories", asyncRoute(async (_req, res) => {
  const [rows] = await db.query("SELECT id, name, icon, created_at AS createdAt FROM categories ORDER BY name ASC");
  res.json(rows);
}));

app.post("/api/products", requireAdmin, asyncRoute(async (req, res) => {
  const { id, name, category, categoryIcon, price, rating = 0, reviews = 0, image, desc, description } = req.body;
  if (!id || !name || !category || price == null || !image || !(desc || description)) {
    return res.status(400).json({ message: "Missing product information." });
  }

  const categoryId = await categoryIdByName(category, categoryIcon);
  await db.query(
    `INSERT INTO products (id, category_id, name, description, price, rating, reviews, image, is_active)
     VALUES (:id, :categoryId, :name, :description, :price, :rating, :reviews, :image, TRUE)
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
      id,
      categoryId,
      name,
      description: description || desc,
      price: Number(price),
      rating: Number(rating),
      reviews: Number(reviews),
      image
    }
  );
  res.status(201).json({ message: "Product saved successfully." });
}));

app.patch("/api/products/:id", requireAdmin, asyncRoute(async (req, res) => {
  const currentId = req.params.id;
  const { name, category, categoryIcon, price, rating, reviews, image, desc, description, isActive } = req.body;
  const [[current]] = await db.query("SELECT * FROM products WHERE id = :id", { id: currentId });
  if (!current) return res.status(404).json({ message: "Product not found." });

  const categoryId = category ? await categoryIdByName(category, categoryIcon) : current.category_id;
  await db.query(
    `UPDATE products
     SET category_id = :categoryId,
       name = :name,
       description = :description,
       price = :price,
       rating = :rating,
       reviews = :reviews,
       image = :image,
       is_active = :isActive
     WHERE id = :id`,
    {
      id: currentId,
      categoryId,
      name: name ?? current.name,
      description: description ?? desc ?? current.description,
      price: Number(price ?? current.price),
      rating: Number(rating ?? current.rating),
      reviews: Number(reviews ?? current.reviews),
      image: image ?? current.image,
      isActive: isActive == null ? current.is_active : Boolean(isActive)
    }
  );
  res.json({ message: "Product updated successfully." });
}));

app.delete("/api/products/:id", requireAdmin, asyncRoute(async (req, res) => {
  const [result] = await db.query("UPDATE products SET is_active = FALSE WHERE id = :id", { id: req.params.id });
  if (!result.affectedRows) return res.status(404).json({ message: "Product not found." });
  res.json({ message: "Product removed successfully." });
}));

app.post("/api/contact", asyncRoute(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Please fill in all contact fields." });
  }

  await db.query(
    "INSERT INTO contacts (full_name, email, subject, message) VALUES (:name, :email, :subject, :message)",
    { name, email, subject, message }
  );
  res.status(201).json({ message: "Message saved successfully." });
}));

app.get("/api/contacts", asyncRoute(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT id, full_name AS name, email, subject, message, created_at AS createdAt
    FROM contacts
    ORDER BY created_at DESC
  `);
  res.json(rows);
}));

app.post("/api/customers/login", asyncRoute(async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone are required." });
  }

  await db.query(
    `INSERT INTO customers (full_name, phone, email)
     VALUES (:name, :phone, :email)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = COALESCE(VALUES(email), email), updated_at = CURRENT_TIMESTAMP`,
    { name: name.trim(), phone: phone.trim(), email: email?.trim() || null }
  );
  const [[customer]] = await db.query(
    "SELECT id, full_name AS name, phone, email FROM customers WHERE phone = :phone",
    { phone: phone.trim() }
  );
  res.json(customer);
}));

app.post("/api/customers/register", asyncRoute(async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ message: "Name, phone and email are required." });
  }
  await db.query(
    `INSERT INTO customers (full_name, phone, email)
     VALUES (:name, :phone, :email)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), updated_at = CURRENT_TIMESTAMP`,
    { name: name.trim(), phone: phone.trim(), email: email.trim() }
  );
  const [[customer]] = await db.query(
    "SELECT id, full_name AS name, phone, email FROM customers WHERE phone = :phone",
    { phone: phone.trim() }
  );
  res.status(201).json(customer);
}));

app.get("/api/customers", asyncRoute(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT c.id, c.full_name AS name, c.phone, c.email, c.created_at AS createdAt, c.updated_at AS updatedAt,
      COALESCE(ord.totalOrders, 0) AS totalOrders,
      COALESCE(ord.totalSpent, 0) AS totalSpent,
      COALESCE(cart.cartItems, 0) AS cartItems,
      COALESCE(wish.wishlistItems, 0) AS wishlistItems
    FROM customers c
    LEFT JOIN (
      SELECT customer_id, COUNT(*) AS totalOrders, COALESCE(SUM(total), 0) AS totalSpent
      FROM orders
      GROUP BY customer_id
    ) ord ON ord.customer_id = c.id
    LEFT JOIN (
      SELECT phone, COUNT(*) AS cartItems
      FROM cart_events
      WHERE action IN ('Added to cart', 'Increased quantity')
      GROUP BY phone
    ) cart ON cart.phone = c.phone
    LEFT JOIN (
      SELECT phone, COUNT(*) AS wishlistItems
      FROM cart_events
      WHERE action = 'Added to wishlist'
      GROUP BY phone
    ) wish ON wish.phone = c.phone
    ORDER BY c.updated_at DESC
  `);
  res.json(rows.map((row) => ({
    ...row,
    totalOrders: Number(row.totalOrders),
    totalSpent: Number(row.totalSpent),
    cartItems: Number(row.cartItems),
    wishlistItems: Number(row.wishlistItems)
  })));
}));

app.patch("/api/customers/:id", requireAdmin, asyncRoute(async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name && !phone && !email) return res.status(400).json({ message: "Provide name, phone or email." });

  const fields = [];
  const params = { id: req.params.id };
  if (name) {
    fields.push("full_name = :name");
    params.name = name.trim();
  }
  if (phone) {
    fields.push("phone = :phone");
    params.phone = phone.trim();
  }
  if (email) {
    fields.push("email = :email");
    params.email = email.trim();
  }
  const [result] = await db.query(`UPDATE customers SET ${fields.join(", ")} WHERE id = :id`, params);
  if (!result.affectedRows) return res.status(404).json({ message: "Customer not found." });
  res.json({ message: "Customer updated successfully." });
}));

app.delete("/api/customers/:id", requireAdmin, asyncRoute(async (req, res) => {
  const [[orders]] = await db.query("SELECT COUNT(*) AS count FROM orders WHERE customer_id = :id", { id: req.params.id });
  if (Number(orders.count) > 0) {
    return res.status(409).json({ message: "Customer has orders and cannot be deleted." });
  }
  const [result] = await db.query("DELETE FROM customers WHERE id = :id", { id: req.params.id });
  if (!result.affectedRows) return res.status(404).json({ message: "Customer not found." });
  res.json({ message: "Customer deleted successfully." });
}));

app.post("/api/orders", asyncRoute(async (req, res) => {
  const { sessionId, customer, paymentMethod, totals, items } = req.body;
  if (!customer?.name || !customer?.phone || !customer?.address || !paymentMethod || !items?.length) {
    return res.status(400).json({ message: "Missing order information." });
  }

  const orderCode = `FD${Date.now().toString().slice(-8)}`;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    let customerId = null;
    const [[savedCustomer]] = await connection.query(
      "SELECT id FROM customers WHERE phone = :phone",
      { phone: customer.phone }
    );
    if (savedCustomer) {
      customerId = savedCustomer.id;
      await connection.query(
        "UPDATE customers SET full_name = :name, email = COALESCE(:email, email) WHERE id = :id",
        { id: customerId, name: customer.name, email: customer.email || null }
      );
    } else {
      const [customerResult] = await connection.query(
        "INSERT INTO customers (full_name, phone, email) VALUES (:name, :phone, :email)",
        { name: customer.name, phone: customer.phone, email: customer.email || null }
      );
      customerId = customerResult.insertId;
    }

    const orderParams = {
      orderCode,
      sessionId: sessionId || null,
      customerId,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      note: customer.note || null,
      paymentMethod,
      paymentStatus: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      subtotal: totals.subtotal,
      delivery: totals.delivery,
      discount: totals.discount,
      total: totals.total
    };
    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (order_code, session_id, customer_id, customer_name, phone, address, note, payment_method, payment_status, subtotal, delivery_fee, discount, total)
       VALUES
        (:orderCode, :sessionId, :customerId, :name, :phone, :address, :note, :paymentMethod, :paymentStatus, :subtotal, :delivery, :discount, :total)`,
      orderParams
    );

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, base_product_name, option_summary, size_name, addons_json, quantity, unit_price, line_total)
         VALUES
          (:orderId, :productId, :productName, :baseProductName, :optionSummary, :sizeName, :addonsJson, :quantity, :unitPrice, :lineTotal)`,
        {
          orderId: orderResult.insertId,
          productId: item.id,
          productName: item.name,
          baseProductName: item.baseName || item.name,
          optionSummary: item.optionSummary || null,
          sizeName: item.sizeName || null,
          addonsJson: JSON.stringify(item.addOns || []),
          quantity: item.qty,
          unitPrice: item.price,
          lineTotal: item.price * item.qty
        }
      );
    }

    await connection.commit();
    res.status(201).json({
      orderCode,
      status: paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      total: totals.total,
      method: paymentMethod,
      createdAt: new Date().toISOString(),
      customer,
      totals,
      items
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Could not place order.", detail: error.message });
  } finally {
    connection.release();
  }
}));

app.get("/api/orders", asyncRoute(async (_req, res) => {
  const [orders] = await db.query(`
    SELECT o.id, o.order_code AS orderCode, o.session_id AS sessionId, o.customer_id AS customerId,
      o.customer_name AS customerName, o.phone, c.email, o.address, o.note,
      o.payment_method AS paymentMethod, o.payment_status AS paymentStatus, o.order_status AS orderStatus,
      o.subtotal, o.delivery_fee AS deliveryFee, o.discount, o.total, o.created_at AS createdAt
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `);

  if (!orders.length) return res.json([]);

  const [items] = await db.query(`
    SELECT order_id AS orderId, product_id AS productId, product_name AS productName,
      base_product_name AS baseProductName, option_summary AS optionSummary, size_name AS sizeName,
      addons_json AS addonsJson, quantity, unit_price AS unitPrice, line_total AS lineTotal
    FROM order_items
    WHERE order_id IN (:ids)
    ORDER BY id ASC
  `, { ids: orders.map((order) => order.id) });

  res.json(orders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    items: items
      .filter((item) => item.orderId === order.id)
      .map((item) => ({
        ...item,
        addons: typeof item.addonsJson === "string" ? JSON.parse(item.addonsJson || "[]") : (item.addonsJson || []),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
  })));
}));

app.patch("/api/orders/:id/status", requireAdmin, asyncRoute(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  if (!orderStatus && !paymentStatus) {
    return res.status(400).json({ message: "Provide orderStatus or paymentStatus." });
  }

  const fields = [];
  const params = { id: req.params.id };
  if (orderStatus) {
    fields.push("order_status = :orderStatus");
    params.orderStatus = orderStatus;
  }
  if (paymentStatus) {
    fields.push("payment_status = :paymentStatus");
    params.paymentStatus = paymentStatus;
  }

  const [result] = await db.query(`UPDATE orders SET ${fields.join(", ")} WHERE id = :id`, params);
  if (!result.affectedRows) return res.status(404).json({ message: "Order not found." });
  res.json({ message: "Order updated successfully." });
}));

app.post("/api/cart-events", asyncRoute(async (req, res) => {
  const { sessionId, customerId, customerName, phone, action, productId, productName, category, optionSummary, qty, unitPrice, cartTotal, createdAt } = req.body;
  if (!sessionId || !action || !productId || !productName) {
    return res.status(400).json({ message: "Missing cart activity information." });
  }

  await db.query(
    `INSERT INTO cart_events
      (session_id, customer_id, customer_name, phone, action, product_id, product_name, category, option_summary, quantity, unit_price, cart_total, created_at)
     VALUES
      (:sessionId, :customerId, :customerName, :phone, :action, :productId, :productName, :category, :optionSummary, :qty, :unitPrice, :cartTotal, :createdAt)`,
    {
      sessionId,
      customerId: customerId || null,
      customerName: customerName || null,
      phone: phone || null,
      action,
      productId,
      productName,
      category: category || null,
      optionSummary: optionSummary || null,
      qty: Number(qty || 0),
      unitPrice: Number(unitPrice || 0),
      cartTotal: Number(cartTotal || 0),
      createdAt: createdAt ? new Date(createdAt) : new Date()
    }
  );
  res.status(201).json({ message: "Cart activity saved." });
}));

app.get("/api/cart-events", asyncRoute(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT id, session_id AS sessionId, customer_id AS customerId, customer_name AS customerName,
      phone, action, product_id AS productId,
      product_name AS productName, category, option_summary AS optionSummary, quantity AS qty,
      unit_price AS unitPrice, cart_total AS cartTotal, created_at AS createdAt
    FROM cart_events
    ORDER BY created_at DESC
    LIMIT 200
  `);
  res.json(rows.map((row) => ({
    ...row,
    qty: Number(row.qty),
    unitPrice: Number(row.unitPrice),
    cartTotal: Number(row.cartTotal)
  })));
}));

app.get("/api/admin/summary", asyncRoute(async (_req, res) => {
  const [[orders]] = await db.query(`
    SELECT COUNT(*) AS totalOrders,
      COALESCE(SUM(total), 0) AS revenue,
      SUM(order_status IN ('Placed', 'Preparing', 'On the Way')) AS activeOrders
    FROM orders
  `);
  const [[contacts]] = await db.query("SELECT COUNT(*) AS totalContacts FROM contacts");
  const [[events]] = await db.query("SELECT COUNT(*) AS totalCartEvents FROM cart_events");
  const [[products]] = await db.query("SELECT COUNT(*) AS totalProducts FROM products WHERE is_active = TRUE");

  res.json({
    totalOrders: Number(orders.totalOrders || 0),
    revenue: Number(orders.revenue || 0),
    activeOrders: Number(orders.activeOrders || 0),
    totalContacts: Number(contacts.totalContacts || 0),
    totalCartEvents: Number(events.totalCartEvents || 0),
    totalProducts: Number(products.totalProducts || 0)
  });
}));

app.get("/api/database/tables", asyncRoute(async (_req, res) => {
  const tables = ["categories", "products", "admin_users", "customers", "orders", "order_items", "contacts", "cart_events"];
  const result = {};
  for (const table of tables) {
    const [[row]] = await db.query(`SELECT COUNT(*) AS count FROM ${table}`);
    result[table] = Number(row.count || 0);
  }
  res.json({
    ok: true,
    database: db.dbName,
    tables: result
  });
}));

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.get("/menu", (_req, res) => res.sendFile(path.join(rootDir, "html", "menu.html")));
app.get("/about", (_req, res) => res.sendFile(path.join(rootDir, "html", "about.html")));
app.get("/contact", (_req, res) => res.sendFile(path.join(rootDir, "html", "contact.html")));
app.get("/cart", (_req, res) => res.sendFile(path.join(rootDir, "html", "cart.html")));
app.get("/checkout", (_req, res) => res.sendFile(path.join(rootDir, "html", "checkout.html")));
app.get("/admin", (_req, res) => res.sendFile(path.join(rootDir, "html", "admin.html")));
app.get("/tables", (_req, res) => res.sendFile(path.join(rootDir, "html", "database.html")));
app.get("/database-tables", (_req, res) => res.sendFile(path.join(rootDir, "html", "database.html")));
app.get("/demo", (_req, res) => res.sendFile(path.join(rootDir, "html", "demo.html")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Server error.", detail: error.message });
});

async function startServer() {
  await migrate();
  const setup = await seed({ runMigrate: false, silent: true });
  console.log(`Database ready: ${setup.categories} categories, ${setup.products} products.`);
  app.listen(port, () => {
    console.log(`Foodee server running at http://localhost:${port}`);
    console.log(`System overview: http://localhost:${port}/demo`);
    console.log(`Admin panel: http://localhost:${port}/admin`);
    console.log(`Database tables page: http://localhost:${port}/tables`);
    console.log(`Database check: http://localhost:${port}/api/database/tables`);
  });
}

startServer().catch((error) => {
  console.error("Could not start server:", error.message);
  process.exit(1);
});
