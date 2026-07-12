const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const migrate = require("./migrate");

const app = express();
const rootDir = path.join(__dirname, "..");
const port = Number(process.env.PORT || 5500);

app.use(cors());
app.use(express.json());
app.use(express.static(rootDir));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
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

app.post("/api/products", asyncRoute(async (req, res) => {
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

app.patch("/api/products/:id", asyncRoute(async (req, res) => {
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

app.delete("/api/products/:id", asyncRoute(async (req, res) => {
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
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone are required." });
  }

  await db.query(
    `INSERT INTO customers (full_name, phone)
     VALUES (:name, :phone)
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), updated_at = CURRENT_TIMESTAMP`,
    { name: name.trim(), phone: phone.trim() }
  );
  const [[customer]] = await db.query(
    "SELECT id, full_name AS name, phone FROM customers WHERE phone = :phone",
    { phone: phone.trim() }
  );
  res.json(customer);
}));

app.get("/api/customers", asyncRoute(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT c.id, c.full_name AS name, c.phone, c.created_at AS createdAt, c.updated_at AS updatedAt,
      COUNT(o.id) AS totalOrders,
      COALESCE(SUM(o.total), 0) AS totalSpent
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `);
  res.json(rows.map((row) => ({
    ...row,
    totalOrders: Number(row.totalOrders),
    totalSpent: Number(row.totalSpent)
  })));
}));

app.patch("/api/customers/:id", asyncRoute(async (req, res) => {
  const { name, phone } = req.body;
  if (!name && !phone) return res.status(400).json({ message: "Provide name or phone." });

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
  const [result] = await db.query(`UPDATE customers SET ${fields.join(", ")} WHERE id = :id`, params);
  if (!result.affectedRows) return res.status(404).json({ message: "Customer not found." });
  res.json({ message: "Customer updated successfully." });
}));

app.delete("/api/customers/:id", asyncRoute(async (req, res) => {
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
        "UPDATE customers SET full_name = :name WHERE id = :id",
        { id: customerId, name: customer.name }
      );
    } else {
      const [customerResult] = await connection.query(
        "INSERT INTO customers (full_name, phone) VALUES (:name, :phone)",
        { name: customer.name, phone: customer.phone }
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
    SELECT id, order_code AS orderCode, session_id AS sessionId, customer_id AS customerId, customer_name AS customerName, phone, address, note,
      payment_method AS paymentMethod, payment_status AS paymentStatus, order_status AS orderStatus,
      subtotal, delivery_fee AS deliveryFee, discount, total, created_at AS createdAt
    FROM orders
    ORDER BY created_at DESC
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

app.patch("/api/orders/:id/status", asyncRoute(async (req, res) => {
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
  const { sessionId, action, productId, productName, category, optionSummary, qty, unitPrice, cartTotal, createdAt } = req.body;
  if (!sessionId || !action || !productId || !productName) {
    return res.status(400).json({ message: "Missing cart activity information." });
  }

  await db.query(
    `INSERT INTO cart_events
      (session_id, action, product_id, product_name, category, option_summary, quantity, unit_price, cart_total, created_at)
     VALUES
      (:sessionId, :action, :productId, :productName, :category, :optionSummary, :qty, :unitPrice, :cartTotal, :createdAt)`,
    {
      sessionId,
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
    SELECT id, session_id AS sessionId, action, product_id AS productId,
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

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Server error.", detail: error.message });
});

migrate().then(() => {
  app.listen(port, () => {
    console.log(`Foodee server running at http://localhost:${port}`);
  });
}).catch((error) => {
  console.error("Could not start server:", error.message);
  process.exit(1);
});
