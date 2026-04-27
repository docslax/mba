"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Products", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Product name (e.g., "Golf Shirt", "Jacket")',
      },
      description: {
        type: Sequelize.TEXT,
      },
      category: {
        type: Sequelize.STRING,
        comment: 'Product category (e.g., "Apparel", "Accessory")',
      },
      pricingConfig: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: { tiers: [] },
        comment:
          "Flexible pricing configuration with tiers. Structure: { tiers: [ { sizes: [...], price: X.XX }, ... ] }",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: "Whether this product is currently available for order",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Products");
  },
};
