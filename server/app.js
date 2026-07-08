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

app.post("/api/orders", async (req, res) => {
  const { customer, paymentMethod, totals, items } = req.body;
  if (!customer?.name || !customer?.phone || !customer?.address || !paymentMethod || !items?.length) {
    return res.status(400).json({ message: "Missing order information." });
  }

  const orderCode = `FD${Date.now().toString().slice(-8)}`;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (order_code, customer_name, phone, address, note, payment_method, payment_status, subtotal, delivery_fee, discount, total)
       VALUES
        (:orderCode, :name, :phone, :address, :note, :paymentMethod, :paymentStatus, :subtotal, :delivery, :discount, :total)`,
      {
        orderCode,
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
      }
    );

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

app.get("*", (_req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Foodee server running at http://localhost:${port}`);
});
