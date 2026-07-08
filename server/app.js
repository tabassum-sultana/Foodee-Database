const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();
const rootDir = path.join(__dirname, "..");
const port = Number(process.env.PORT || 5500);

app.use(cors());
app.use(express.json());
app.use(express.static(rootDir));

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(500).json({ ok: false, database: "disconnected", message: error.message });
  }
});

app.get("/api/products", async (_req, res) => {
  const [rows] = await db.query(`
    SELECT p.id, p.name, c.name AS category, p.price, p.rating, p.reviews, p.image, p.description AS \`desc\`
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = TRUE
    ORDER BY p.created_at ASC
  `);
  res.json(rows);
});

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "Please fill in all contact fields." });
  }

  await db.query(
    "INSERT INTO contacts (full_name, email, subject, message) VALUES (:name, :email, :subject, :message)",
    { name, email, subject, message }
  );
  res.status(201).json({ message: "Message saved successfully." });
});

app.get("/api/contacts", async (_req, res) => {
  const [rows] = await db.query(`
    SELECT id, full_name AS name, email, subject, message, created_at AS createdAt
    FROM contacts
    ORDER BY created_at DESC
  `);
  res.json(rows);
});

app.post("/api/orders", async (req, res) => {
  const { sessionId, customer, paymentMethod, totals, items } = req.body;
  if (!customer?.name || !customer?.phone || !customer?.address || !paymentMethod || !items?.length) {
    return res.status(400).json({ message: "Missing order information." });
  }

  const orderCode = `FD${Date.now().toString().slice(-8)}`;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const orderParams = {
      orderCode,
      sessionId: sessionId || null,
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
    let orderResult;
    try {
      [orderResult] = await connection.query(
        `INSERT INTO orders
          (order_code, session_id, customer_name, phone, address, note, payment_method, payment_status, subtotal, delivery_fee, discount, total)
         VALUES
          (:orderCode, :sessionId, :name, :phone, :address, :note, :paymentMethod, :paymentStatus, :subtotal, :delivery, :discount, :total)`,
        orderParams
      );
    } catch (error) {
      if (!/session_id/i.test(error.message)) throw error;
      [orderResult] = await connection.query(
        `INSERT INTO orders
          (order_code, customer_name, phone, address, note, payment_method, payment_status, subtotal, delivery_fee, discount, total)
         VALUES
          (:orderCode, :name, :phone, :address, :note, :paymentMethod, :paymentStatus, :subtotal, :delivery, :discount, :total)`,
        orderParams
      );
    }

    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES
          (:orderId, :productId, :productName, :quantity, :unitPrice, :lineTotal)`,
        {
          orderId: orderResult.insertId,
          productId: item.id,
          productName: item.name,
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
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Could not place order.", detail: error.message });
  } finally {
    connection.release();
  }
});

app.get("/api/orders", async (_req, res) => {
  let orders;
  try {
    [orders] = await db.query(`
      SELECT id, order_code AS orderCode, session_id AS sessionId, customer_name AS customerName, phone, address, note,
        payment_method AS paymentMethod, payment_status AS paymentStatus, order_status AS orderStatus,
        subtotal, delivery_fee AS deliveryFee, discount, total, created_at AS createdAt
      FROM orders
      ORDER BY created_at DESC
    `);
  } catch (error) {
    if (!/session_id/i.test(error.message)) throw error;
    [orders] = await db.query(`
      SELECT id, order_code AS orderCode, NULL AS sessionId, customer_name AS customerName, phone, address, note,
        payment_method AS paymentMethod, payment_status AS paymentStatus, order_status AS orderStatus,
        subtotal, delivery_fee AS deliveryFee, discount, total, created_at AS createdAt
      FROM orders
      ORDER BY created_at DESC
    `);
  }

  if (!orders.length) return res.json([]);

  const [items] = await db.query(`
    SELECT order_id AS orderId, product_id AS productId, product_name AS productName,
      quantity, unit_price AS unitPrice, line_total AS lineTotal
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
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
  })));
});

app.post("/api/cart-events", async (req, res) => {
  const { sessionId, action, productId, productName, category, qty, unitPrice, cartTotal, createdAt } = req.body;
  if (!sessionId || !action || !productId || !productName) {
    return res.status(400).json({ message: "Missing cart activity information." });
  }

  await db.query(
    `INSERT INTO cart_events
      (session_id, action, product_id, product_name, category, quantity, unit_price, cart_total, created_at)
     VALUES
      (:sessionId, :action, :productId, :productName, :category, :qty, :unitPrice, :cartTotal, :createdAt)`,
    {
      sessionId,
      action,
      productId,
      productName,
      category: category || null,
      qty: Number(qty || 0),
      unitPrice: Number(unitPrice || 0),
      cartTotal: Number(cartTotal || 0),
      createdAt: createdAt ? new Date(createdAt) : new Date()
    }
  );
  res.status(201).json({ message: "Cart activity saved." });
});

app.get("/api/cart-events", async (_req, res) => {
  const [rows] = await db.query(`
    SELECT id, session_id AS sessionId, action, product_id AS productId,
      product_name AS productName, category, quantity AS qty,
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
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Foodee server running at http://localhost:${port}`);
});
