"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add generic product fields to support multiple product types
    await queryInterface.addColumn("Orders", "productType", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Type of product ordered (e.g., "Shirt", "Jacket")',
    });

    await queryInterface.addColumn("Orders", "productName", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Name on the product (e.g., name on shirt/jacket)",
    });

    await queryInterface.addColumn("Orders", "productSize", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Size of the product",
    });

    await queryInterface.addColumn("Orders", "productCategory", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Category of product (e.g., "Men", "Ladies")',
    });

    // Note: shirtName, shirtType, shirtSize are kept for backward compatibility
    // Future refactoring can migrate existing data and remove these columns
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Orders", "productType");
    await queryInterface.removeColumn("Orders", "productName");
    await queryInterface.removeColumn("Orders", "productSize");
    await queryInterface.removeColumn("Orders", "productCategory");
  },
};
