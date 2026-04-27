require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { Order, Product, sequelize } = require("./models");
const {
  sendOrderConfirmation,
  sendOrderNotification,
  testEmailConnection,
} = require("./services/emailService");
const { runMigrations } = require("./utils/migrationRunner");
const { getPriceForSize, getPricingTiers } = require("./utils/pricingUtil");

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// Simple API Key middleware
const API_KEY = process.env.API_KEY || "dev-api-key-change-me";
const PORT = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const isDevelopment = (process.env.NODE_ENV || "development") !== "production";
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function checkApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }
  next();
}

function handleError(res, err) {
  return res.status(500).json({
    status: "error",
    message: "Request failed",
    error: err.message,
  });
}

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (isDevelopment) {
        return callback(null, true);
      }

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (isDevelopment && localDevOriginPattern.test(origin))
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());

// Root check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "MBA API running",
    environment: process.env.NODE_ENV || "development",
  });
});

// Get available products
app.get("/products", checkApiKey, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true },
    });
    res.json(products);
  } catch (err) {
    handleError(res, err);
  }
});

// Get pricing for a product by size
app.get("/products/:id/pricing", checkApiKey, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const size = req.query.size;
    if (!size) {
      return res.json({
        productId: product.id,
        productName: product.name,
        tiers: getPricingTiers(product.pricingConfig),
      });
    }

    const price = getPriceForSize(product.pricingConfig, size);
    if (price === null) {
      return res.status(400).json({
        error: `Size "${size}" not available for this product`,
      });
    }

    res.json({
      productId: product.id,
      productName: product.name,
      size,
      price,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// Create order
app.post("/orders", checkApiKey, async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Send confirmation emails (async, don't wait for them)
    sendOrderConfirmation(order);
    sendOrderNotification(order);

    res.status(201).json({ status: "ok", order });
  } catch (err) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// List orders
app.get("/orders", checkApiKey, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: Product, required: false }],
    });
    res.json(orders);
  } catch (err) {
    handleError(res, err);
  }
});

// Single order
app.get("/orders/:id", checkApiKey, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Product, required: false }],
    });
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (err) {
    handleError(res, err);
  }
});

async function start() {
  console.log("Starting MBA API", {
    nodeEnv: process.env.NODE_ENV || "development",
    port: PORT,
    dbHost: process.env.DB_HOST || "127.0.0.1",
    dbPort: Number(process.env.DB_PORT || 5432),
    dbName: process.env.DB_NAME || "mbaofbc_app",
    dbUser: process.env.DB_USER || "mbaofbc_api",
    dbSsl: String(process.env.DB_SSL || "false"),
  });

  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    // Run migrations
    const migrationSuccess = await runMigrations();
    if (!migrationSuccess && process.env.NODE_ENV === "production") {
      console.error("Migrations failed in production. Aborting startup.");
      process.exit(1);
    }
  } catch (err) {
    console.warn(`Database connection failed: ${err.message}`);
    if (err && err.code) {
      console.warn(`Database error code: ${err.code}`);
    }
  }

  // Test email service
  const emailReady = await testEmailConnection();
  if (!emailReady) {
    console.warn("Email service may not be available");
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`API running on port ${PORT}`));
}

start();
