# Database Schema Normalization

## Overview

The Order table has been refactored to support multiple product types (shirts, jackets, etc.) while maintaining backward compatibility.

## Key Changes

### New Tables

#### `Products` Table

- **Purpose**: Centralized product catalog
- **Fields**:
  - `id`: Auto-incrementing primary key
  - `name`: Product name (e.g., "Golf Shirt", "Jacket")
  - `description`: Product description
  - `category`: Product category (e.g., "Apparel")
  - `basePrice`: Price for standard sizes (XS-XL)
  - `largeSizePrice`: Price for larger sizes (2XL-6XL)
  - `availableSizes`: JSON object with `men` and `ladies` arrays
  - `isActive`: Boolean flag for product availability

**Example**:

```json
{
  "id": 1,
  "name": "Golf Shirt",
  "description": "Custom golf shirt with embroidery",
  "category": "Apparel",
  "basePrice": 60.0,
  "largeSizePrice": 70.0,
  "availableSizes": {
    "men": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"],
    "ladies": ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"]
  },
  "isActive": true
}
```

### Updated Tables

#### `Orders` Table

Added new fields while maintaining backward compatibility:

**New Generic Fields**:

- `productId`: Foreign key reference to Products table
- `productType`: Product type (e.g., "Shirt", "Jacket")
- `productName`: Name to embroider on product
- `productSize`: Size of product
- `productCategory`: Category variant (e.g., "Men", "Ladies")

**Legacy Fields** (deprecated but maintained for backward compatibility):

- `shirtName`: Name on previous shirt orders
- `shirtType`: Type of previous shirt orders
- `shirtSize`: Size of previous shirt orders

## Migration Process

### Before Using

1. Run migrations:

   ```bash
   npm run db:migrate
   ```

2. Seed initial products:
   ```bash
   npm run db:seed:all
   ```

### Gradual Migration Path

1. **Phase 1** (Current): New orders use generic product fields; existing shirt orders remain unchanged
2. **Phase 2** (Future): Data migration script to populate historical orders with productId references
3. **Phase 3** (Future): Deprecation and removal of shirt-specific fields

## API Changes

### New Endpoint

- **GET /products**: Fetch all active products
  ```bash
  curl -H "x-api-key: dev-api-key" http://localhost:3000/products
  ```

### Updated Endpoints

- **GET /orders**: Now includes Product data via eager loading
- **GET /orders/:id**: Now includes Product data via eager loading
- **POST /orders**: Accepts both legacy (shirtName/Type/Size) and new (productId/Name/Type/Size) formats

## Frontend Changes

### JacketOrderForm

New form component for jacket orders that uses the generic product fields instead of shirt-specific fields.

**Fields sent to API**:

- `jacketName` → stored as `productName`
- `jacketType` → stored as `productCategory`
- `jacketSize` → stored as `productSize`

## Adding Future Products

To add a new product type:

1. Add to the Products table via seeder or manual insert:

   ```javascript
   await Product.create({
     name: "New Product",
     description: "Description",
     category: "Apparel",
     basePrice: 50.0,
     largeSizePrice: 60.0,
     availableSizes: {
       men: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
       ladies: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
     },
     isActive: true,
   });
   ```

2. Create a new form component (e.g., `NewProductOrderForm.tsx`) following the JacketOrderForm pattern

3. Add route in App.tsx and form selector in FormSelector.tsx

## Data Model Diagram

```
Products (1) ──── (Many) Orders
┌──────────────┐           ┌──────────────┐
│  Products    │    fk     │  Orders      │
├──────────────┤◄──────────┤──────────────┤
│ id (PK)      │           │ id (PK)      │
│ name         │           │ name         │
│ description  │           │ phone        │
│ category     │           │ address      │
│ basePrice    │           │ city         │
│ largeSizePrice│          │ productId (FK)│
│ availableSizes│          │ productType  │
│ isActive     │           │ productName  │
└──────────────┘           │ productSize  │
                           │ productCategory│
                           │ quantity     │
                           │ totalAmount  │
                           └──────────────┘
```
