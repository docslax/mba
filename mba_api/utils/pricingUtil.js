/**
 * Pricing utility to handle flexible pricing tiers
 *
 * Expected pricingConfig structure:
 * {
 *   tiers: [
 *     { sizes: ["XS", "S", "M"], price: 60.00 },
 *     { sizes: ["L", "XL"], price: 70.00 },
 *     { sizes: ["2XL", "3XL"], price: 80.00 }
 *   ]
 * }
 */

/**
 * Get price for a specific size from pricing config
 * @param {Object} pricingConfig - The pricing config JSON from Product
 * @param {string} size - The size (e.g., "M", "2XL")
 * @returns {number|null} Price or null if not found
 */
function getPriceForSize(pricingConfig, size) {
  if (!pricingConfig || !pricingConfig.tiers) {
    return null;
  }

  const tier = pricingConfig.tiers.find(
    (tier) => tier.sizes && tier.sizes.includes(size),
  );

  return tier ? tier.price : null;
}

/**
 * Get all available sizes from pricing config
 * @param {Object} pricingConfig - The pricing config JSON from Product
 * @returns {string[]} Array of all available sizes
 */
function getAvailableSizes(pricingConfig) {
  if (!pricingConfig || !pricingConfig.tiers) {
    return [];
  }

  const sizes = new Set();
  pricingConfig.tiers.forEach((tier) => {
    if (tier.sizes && Array.isArray(tier.sizes)) {
      tier.sizes.forEach((size) => sizes.add(size));
    }
  });

  return Array.from(sizes);
}

/**
 * Get pricing tiers formatted for admin UI
 * @param {Object} pricingConfig - The pricing config JSON from Product
 * @returns {Array} Array of tiers with formatted data
 */
function getPricingTiers(pricingConfig) {
  if (!pricingConfig || !pricingConfig.tiers) {
    return [];
  }

  return pricingConfig.tiers.map((tier) => ({
    sizes: tier.sizes || [],
    price: parseFloat(tier.price),
  }));
}

/**
 * Add or update a pricing tier
 * @param {Object} pricingConfig - The pricing config JSON
 * @param {Array<string>} sizes - Array of sizes for this tier
 * @param {number} price - Price for this tier
 * @returns {Object} Updated pricingConfig
 */
function addOrUpdateTier(pricingConfig, sizes, price) {
  const config = pricingConfig || { tiers: [] };

  // Check if a tier with these exact sizes already exists
  const existingIndex = config.tiers.findIndex(
    (tier) =>
      JSON.stringify(tier.sizes.sort()) === JSON.stringify([...sizes].sort()),
  );

  const newTier = {
    sizes: sizes.sort(),
    price: parseFloat(price),
  };

  if (existingIndex >= 0) {
    config.tiers[existingIndex] = newTier;
  } else {
    config.tiers.push(newTier);
  }

  // Sort tiers by price
  config.tiers.sort((a, b) => a.price - b.price);

  return config;
}

/**
 * Remove a tier by sizes
 * @param {Object} pricingConfig - The pricing config JSON
 * @param {Array<string>} sizes - Sizes to identify the tier
 * @returns {Object} Updated pricingConfig
 */
function removeTier(pricingConfig, sizes) {
  if (!pricingConfig || !pricingConfig.tiers) {
    return pricingConfig;
  }

  return {
    ...pricingConfig,
    tiers: pricingConfig.tiers.filter(
      (tier) =>
        JSON.stringify(tier.sizes.sort()) !== JSON.stringify([...sizes].sort()),
    ),
  };
}

module.exports = {
  getPriceForSize,
  getAvailableSizes,
  getPricingTiers,
  addOrUpdateTier,
  removeTier,
};
