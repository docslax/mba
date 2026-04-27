"use strict";
const { Product } = require("../models");

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Product.bulkCreate(
      [
        {
          name: "Golf Shirt",
          description: "Custom golf shirt with embroidery",
          category: "Apparel",
          pricingConfig: {
            tiers: [
              { sizes: ["XS", "S", "M", "L", "XL"], price: 60.0 },
              { sizes: ["2XL"], price: 70.0 },
            ],
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Jacket",
          description: "Custom jacket with embroidery",
          category: "Apparel",
          pricingConfig: {
            tiers: [
              { sizes: ["XS", "S", "M", "L", "XL", "2XL"], price: 110.0 },
              { sizes: ["3XL", "4XL"], price: 121.0 },
              { sizes: ["5XL", "6XL"], price: 126.0 },
            ],
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { validate: true },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "Products",
      { name: ["Golf Shirt", "Jacket"] },
      {},
    );
  },
};
