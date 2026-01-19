import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:3c2db939f13ae9acd385@utmify-hub_db:5432/utmify_hub";

console.log("DATABASE_URL:", DATABASE_URL);

// === BANCO ===
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false
});

// === INIT DB ===
await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  name TEXT,
  platform TEXT,
  currency TEXT,
  utmify_token TEXT,
  hook_secret TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  integration_id UUID,
  status TEXT,
  utmify_status INTEGER,
  error TEXT,
  received_at TIMESTAMP DEFAULT NOW()
);
`);

// === HELPERS ===
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "invalid token" });
  }
}

function randomSecret() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// === AUTH ===
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "missing fields" });

  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1,$2)",
      [email, hash]
    );
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "user exists" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const q = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (!q.rowCount) return res.status(400).json({ error: "invalid login" });

  const user = q.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: "invalid login" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// === INTEGRATIONS ===
app.get("/integrations", auth, async (req, res) => {
  const q = await pool.query("SELECT * FROM integrations WHERE user_id=$1", [req.user.id]);
  res.json(q.rows);
});

app.post("/integrations", auth, async (req, res) => {
  const { name, platform, currency, utmify_token } = req.body;
  if (!utmify_token) return res.status(400).json({ error: "missing token" });

  const secret = randomSecret();

  const q = await pool.query(
    `INSERT INTO integrations (user_id,name,platform,currency,utmify_token,hook_secret)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, name, platform, currency, utmify_token, secret]
  );

  res.json(q.rows[0]);
});

// === WEBHOOK ===
app.post("/hook/:id", async (req, res) => {
  const integrationId = req.params.id;
  const secret = req.headers["x-hook-secret"];

  const q = await pool.query("SELECT * FROM integrations WHERE id=$1", [integrationId]);
  if (!q.rowCount) return res.status(404).json({ error: "not found" });

  const integration = q.rows[0];
  if (integration.hook_secret !== secret) {
    return res.status(401).json({ error: "invalid secret" });
  }

  // payload simples (depois a gente melhora)
  const body = {
    orderId: String(req.body.transactionId || Date.now()),
    platform: integration.platform || "Custom",
    paymentMethod: "credit_card",
    status: "paid",
    createdAt: new Date().toISOString().slice(0,19).replace("T"," "),
    approvedDate: new Date().toISOString().slice(0,19).replace("T"," "),
    refundedAt: null,
    customer: {
      name: req.body.name || "N/A",
      email: req.body.email || "N/A",
      phone: req.body.phone || null,
      document: null
    },
    products: [{
      id: "item",
      name: "Produto",
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: Number(req.body.value || 0)
    }],
    trackingParameters: {
      src: null, sck: null,
      utm_source: req.body.utm_source || null,
      utm_campaign: req.body.utm_campaign || null,
      utm_medium: req.body.utm_medium || null,
      utm_content: req.body.utm_content || null,
      utm_term: req.body.utm_term || null
    },
    commission: {
      totalPriceInCents: Number(req.body.value || 0),
      gatewayFeeInCents: 0,
      userCommissionInCents: Number(req.body.value || 0),
      currency: integration.currency || "BRL"
    }
  };

  try {
    const r = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": integration.utmify_token
      },
      body: JSON.stringify(body)
    });

    await pool.query(
      "INSERT INTO events (integration_id,status,utmify_status) VALUES ($1,$2,$3)",
      [integrationId, r.ok ? "success" : "error", r.status]
    );

    res.json({ ok: true });
  } catch (e) {
    await pool.query(
      "INSERT INTO events (integration_id,status,error) VALUES ($1,$2,$3)",
      [integrationId, "error", String(e)]
    );
    res.status(500).json({ error: "failed" });
  }
});

// === LOGS ===
app.get("/events/:id", auth, async (req, res) => {
  const q = await pool.query(
    "SELECT * FROM events WHERE integration_id=$1 ORDER BY received_at DESC LIMIT 50",
    [req.params.id]
  );
  res.json(q.rows);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta', PORT);
});

