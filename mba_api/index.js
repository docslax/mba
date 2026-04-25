require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { Order, sequelize } = require("./models");
const {
  sendOrderConfirmation,
  sendAdminNotification,
  testEmailConnection,
} = require("./services/emailService");

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

// Create order
app.post("/orders", checkApiKey, async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Send confirmation emails (async, don't wait for them)
    sendOrderConfirmation(order);
    sendAdminNotification(order);

    res.status(201).json({ status: "ok", order });
  } catch (err) {
    res.status(400).json({ status: "error", error: err.message });
  }
});

// List orders
app.get("/orders", checkApiKey, async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (err) {
    handleError(res, err);
  }
});

// Single order
app.get("/orders/:id", checkApiKey, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (err) {
    handleError(res, err);
  }
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");
  } catch (err) {
    console.warn(`Database connection failed: ${err.message}`);
  }

  // Test email service
  const emailReady = await testEmailConnection();
  if (!emailReady) {
    console.warn("Email service may not be available");
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`API running on port ${PORT}`));
}

start();
