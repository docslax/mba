# MBA of BC – Apparel Order System

A full-stack web application for managing custom apparel orders (shirts, jackets, etc.) with online order forms, a REST API backend, and automated email notifications.

## Architecture

```
mba/
├── mba_api/        # Node.js + Express REST API
├── mba_forms/      # React + TypeScript frontend (Vite)
└── docker-compose.local.yml  # Local PostgreSQL via Docker
```

| Layer    | Stack                                 |
| -------- | ------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Chakra UI |
| Backend  | Node.js, Express 5, Sequelize 6       |
| Database | PostgreSQL 16                         |
| Email    | Nodemailer (sendmail / SMTP)          |

---

## Features

- **Order forms** for multiple product types (Golf Shirts, Jackets, and more)
- **Product catalog** with per-product sizing and flexible JSON-based pricing tiers
- **Automated emails** – order confirmation sent to the customer and notifications sent to admin / payment processing
- **API key protection** on all write endpoints
- **CORS** configured per environment (permissive in development, origin-locked in production)
- **Database migrations** via Sequelize CLI

---

## Getting Started

### Prerequisites

- Node.js (see `.tool-versions` for the pinned version)
- Docker & Docker Compose (for local PostgreSQL)

### 1. Start the database

```bash
docker compose -f docker-compose.local.yml up -d
```

### 2. Install dependencies

```bash
# Root workspace (runs both apps concurrently)
npm install

# Individual apps
cd mba_api && npm install
cd mba_forms && npm install
```

### 3. Configure environment variables

Copy the example files and fill in your values:

```bash
cp mba_api/.env.example mba_api/.env
cp mba_forms/.env.example mba_forms/.env
```

Key variables for `mba_api/.env`:

| Variable        | Default                 | Description                         |
| --------------- | ----------------------- | ----------------------------------- |
| `PORT`          | `3000`                  | API listening port                  |
| `API_KEY`       | `dev-api-key-change-me` | Shared secret for frontend → API    |
| `CORS_ORIGIN`   | `http://localhost:5173` | Allowed frontend origin(s)          |
| `DB_HOST`       | `127.0.0.1`             | PostgreSQL host                     |
| `DB_NAME`       | `mbaofbc_app`           | Database name                       |
| `DB_USER`       | `mbaofbc_api`           | Database user                       |
| `DB_PASSWORD`   | `mba_local_password`    | Database password                   |
| `FROM_EMAIL`    | —                       | Sender address for outgoing emails  |
| `ADMIN_EMAIL`   | —                       | Recipient for order notifications   |
| `PAYMENT_EMAIL` | —                       | Recipient for payment notifications |

### 4. Run migrations & seed data

```bash
cd mba_api
npm run db:migrate
npm run db:seed
```

### 5. Start both apps

From the workspace root:

```bash
npm run dev
```

Or individually:

```bash
# API (http://localhost:3000)
cd mba_api && npm run dev

# Frontend (http://localhost:5173)
cd mba_forms && npm run dev
```

---

## API Overview

All mutating endpoints require the `x-api-key` header.

| Method | Path        | Description          |
| ------ | ----------- | -------------------- |
| GET    | `/`         | Health check         |
| GET    | `/products` | List active products |
| GET    | `/pricing`  | Get pricing tiers    |
| GET    | `/orders`   | List all orders      |
| POST   | `/orders`   | Submit a new order   |

### Example: Submit an order

```bash
curl -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: dev-api-key-change-me' \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "2501234567",
    "address": "123 Main St",
    "city": "Vancouver",
    "postalCode": "V6B1A1",
    "productId": 1,
    "productType": "Shirt",
    "productName": "JANE",
    "productCategory": "Ladies",
    "productSize": "M",
    "quantity": 1,
    "totalAmount": 60.00
  }'
```

---

## Database

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for full schema documentation.

Key tables:

- **`Products`** – product catalog with sizes, base price, and `pricingConfig` JSON
- **`Orders`** – customer orders referencing a product

### Pricing

Pricing is driven by a flexible JSON tier configuration stored on each product. See [PRICING_CONFIG.md](PRICING_CONFIG.md) for details.

---

## Deployment

Each sub-project includes a `deployment.sh` script for pushing builds to the target host. Production environment variables should be configured from the corresponding `.env.production.example` files.

---

## Development Scripts

| Command (root) | Description                       |
| -------------- | --------------------------------- |
| `npm run dev`  | Start API + frontend concurrently |

| Command (`mba_api`)  | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start API with nodemon (watch mode) |
| `npm start`          | Start API (production mode)         |
| `npm run db:migrate` | Run pending Sequelize migrations    |
| `npm run db:seed`    | Seed the database with initial data |
| `npm run db:undo`    | Roll back the last migration        |

| Command (`mba_forms`) | Description                         |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start Vite dev server               |
| `npm run build`       | Type-check and build for production |
| `npm run preview`     | Preview the production build        |
