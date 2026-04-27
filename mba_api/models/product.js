"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Product.hasMany(models.Order, { foreignKey: "productId" });
    }
  }
  Product.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Product name (e.g., "Golf Shirt", "Jacket")',
      },
      description: DataTypes.TEXT,
      category: {
        type: DataTypes.STRING,
        comment: 'Product category (e.g., "Apparel", "Accessory")',
      },
      pricingConfig: {
        type: DataTypes.JSON,
        defaultValue: { tiers: [] },
        comment:
          'Flexible pricing tiers: { tiers: [ { sizes: ["XS", "M", ...], price: 60.00 }, ... ] }',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Whether this product is currently available for order",
      },
    },
    {
      sequelize,
      modelName: "Product",
    },
  );
  return Product;
};
