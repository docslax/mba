# Flexible Pricing Configuration

## Overview

Products now use a flexible, JSON-based pricing tier system stored in the `pricingConfig` field. This replaces the rigid fixed-price structure and enables:

- ✅ Multiple price tiers with flexible size groupings
- ✅ Easy addition/removal of sizes from tiers
- ✅ Dynamic pricing changes without schema modifications
- ✅ Full extensibility for admin pricing management
- ✅ Future support for customer segments, bulk discounts, etc.

## Structure

### pricingConfig Field

```json
{
  "tiers": [
    {
      "sizes": ["XS", "S", "M", "L", "XL"],
      "price": 60.0
    },
    {
      "sizes": ["2XL"],
      "price": 70.0
    },
    {
      "sizes": ["3XL", "4XL"],
      "price": 121.0
    },
    {
      "sizes": ["5XL", "6XL"],
      "price": 126.0
    }
  ]
}
```

### Key Features

- **Tiers**: Array of pricing tiers, each with:
  - `sizes`: Array of size codes (e.g., "XS", "2XL")
  - `price`: Price in dollars as a number
- **Flexibility**:
  - Sizes can be grouped in any way
  - Number of tiers is unlimited
  - Sizes can be added/removed without schema changes

## API Endpoints

### Get All Products

```bash
curl -H "x-api-key: dev-api-key-change-me" \
  http://localhost:3000/products
```

**Response**:

```json
[
  {
    "id": 1,
    "name": "Golf Shirt",
    "description": "Custom golf shirt with embroidery",
    "category": "Apparel",
    "pricingConfig": {
      "tiers": [
        { "sizes": ["XS", "S", "M", "L", "XL"], "price": 60.00 },
        { "sizes": ["2XL"], "price": 70.00 }
      ]
    },
    "isActive": true
  },
  ...
]
```

### Get Price for Specific Size

```bash
curl -H "x-api-key: dev-api-key-change-me" \
  "http://localhost:3000/products/1/pricing?size=2XL"
```

**Response**:

```json
{
  "productId": 1,
  "productName": "Golf Shirt",
  "size": "2XL",
  "price": 70.0
}
```

### Get All Pricing Tiers for a Product

```bash
curl -H "x-api-key: dev-api-key-change-me" \
  http://localhost:3000/products/1/pricing
```

**Response**:

```json
{
  "productId": 1,
  "productName": "Golf Shirt",
  "tiers": [
    { "sizes": ["XS", "S", "M", "L", "XL"], "price": 60.0 },
    { "sizes": ["2XL"], "price": 70.0 }
  ]
}
```

## Utility Functions

The `utils/pricingUtil.js` module provides helpers for working with pricing:

### `getPriceForSize(pricingConfig, size)`

Get price for a specific size.

```javascript
const { getPriceForSize } = require("./utils/pricingUtil");

const price = getPriceForSize(product.pricingConfig, "2XL");
// Returns: 70.00
```

### `getAvailableSizes(pricingConfig)`

Get all available sizes from pricing config.

```javascript
const { getAvailableSizes } = require("./utils/pricingUtil");

const sizes = getAvailableSizes(product.pricingConfig);
// Returns: ["XS", "S", "M", "L", "XL", "2XL"]
```

### `getPricingTiers(pricingConfig)`

Get formatted tiers for display/admin UI.

```javascript
const { getPricingTiers } = require("./utils/pricingUtil");

const tiers = getPricingTiers(product.pricingConfig);
// Returns: [
//   { sizes: ["XS", "S", "M", "L", "XL"], price: 60 },
//   { sizes: ["2XL"], price: 70 }
// ]
```

### `addOrUpdateTier(pricingConfig, sizes, price)`

Add or update a pricing tier.

```javascript
const { addOrUpdateTier } = require("./utils/pricingUtil");

const updated = addOrUpdateTier(product.pricingConfig, ["3XL", "4XL"], 129.99);

await product.update({ pricingConfig: updated });
```

### `removeTier(pricingConfig, sizes)`

Remove a pricing tier by sizes.

```javascript
const { removeTier } = require("./utils/pricingUtil");

const updated = removeTier(product.pricingConfig, ["5XL", "6XL"]);

await product.update({ pricingConfig: updated });
```

## Building an Admin UI

### Example: Pricing Admin Component

To build an admin screen for managing pricing, you'll want:

1. **List Tiers Interface**
   - Display each tier with its sizes and price
   - Show total count of available sizes

2. **Add/Edit Tier Form**
   - Checkboxes for size selection
   - Price input field
   - Save button that calls your API endpoint

3. **Delete Tier Button**
   - Removes tier after confirmation

4. **Preview**
   - Show the JSON structure for transparency
   - Display available sizes for the product

### Backend Admin Endpoint Example

```javascript
// Update product pricing (requires admin auth)
app.put("/admin/products/:id/pricing", checkApiKey, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Validate new pricing config
    const { tiers } = req.body;
    if (!Array.isArray(tiers)) {
      return res.status(400).json({ error: "Invalid tiers format" });
    }

    // Ensure all tiers have required fields
    for (const tier of tiers) {
      if (!Array.isArray(tier.sizes) || !tier.price) {
        return res.status(400).json({
          error: "Each tier must have sizes array and price",
        });
      }
    }

    await product.update({
      pricingConfig: { tiers },
    });

    res.json({
      status: "ok",
      message: "Pricing updated",
      product,
    });
  } catch (err) {
    handleError(res, err);
  }
});
```

## Migration Notes

### From Old Schema

Old fields (now deprecated):

- `basePrice` → Included in first tier
- `largeSizePrice` → Separated into second/third tier
- `extraLargeSizePrice` → Separated into final tier

Old fields remain in database for backward compatibility but are not used. Once all orders transition to new fields, they can be safely removed with a down migration.

## Future Enhancements

The `pricingConfig` structure can easily support:

1. **Seasonal Pricing**

```json
{
  "baseVariant": "standard",
  "variants": {
    "standard": { "tiers": [...] },
    "holiday": { "tiers": [...] }
  }
}
```

2. **Bulk Discounts**

```json
{
  "tiers": [...],
  "bulkDiscounts": [
    { "minQuantity": 10, "discountPercent": 5 },
    { "minQuantity": 20, "discountPercent": 10 }
  ]
}
```

3. **Customer Segments**

```json
{
  "segments": {
    "default": { "tiers": [...] },
    "wholesale": { "tiers": [...] }
  }
}
```

## Database Schema

The `Products` table now includes:

```
id (INTEGER, PK)
name (STRING)
description (TEXT)
category (STRING)
availableSizes (JSON) - defines available sizes by gender
pricingConfig (JSON) - flexible pricing tiers
isActive (BOOLEAN)
basePrice (DECIMAL, DEPRECATED)
largeSizePrice (DECIMAL, DEPRECATED)
extraLargeSizePrice (DECIMAL, DEPRECATED)
createdAt (DATE)
updatedAt (DATE)
```

## Examples

### Update Pricing Programmatically

```javascript
const { Product } = require("./models");
const { addOrUpdateTier } = require("./utils/pricingUtil");

const shirt = await Product.findByPk(1);

// Change a tier price
let config = addOrUpdateTier(
  shirt.pricingConfig,
  ["XS", "S", "M", "L", "XL"],
  65.0, // Increased from 60.00
);

// Add new tier for special sizes
config = addOrUpdateTier(config, ["XXXL"], 140.0);

await shirt.update({ pricingConfig: config });
```

### Query Price from Form

```javascript
// In your React component
const response = await fetch(`${API_URL}/products/1/pricing?size=2XL`, {
  headers: { "x-api-key": API_KEY },
});
const data = await response.json();
// data.price === 70.00
```
