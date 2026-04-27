"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.Product, { foreignKey: "productId" });
    }
  }
  Order.init(
    {
      name: DataTypes.STRING,
      phone: DataTypes.STRING,
      address: DataTypes.TEXT,
      city: DataTypes.STRING,
      postalCode: DataTypes.STRING,
      email: DataTypes.STRING,
      // Shirt-specific fields (deprecated - use generic fields below)
      shirtName: DataTypes.STRING,
      shirtType: DataTypes.STRING,
      shirtSize: DataTypes.STRING,
      // Generic product fields (new)
      productId: DataTypes.INTEGER,
      productType: DataTypes.STRING,
      productName: DataTypes.STRING,
      productSize: DataTypes.STRING,
      productCategory: DataTypes.STRING,
      quantity: DataTypes.INTEGER,
      totalAmount: DataTypes.DECIMAL,
    },
    {
      sequelize,
      modelName: "Order",
    },
  );
  return Order;
};
