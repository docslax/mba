const path = require("path");
const fs = require("fs");

async function runMigrations() {
  const { sequelize } = require("../models");
  const migrationsPath = path.join(__dirname, "../migrations");

  console.log("Running database migrations...");

  try {
    // Check if SequelizeMeta table exists, create if not
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (!tables.includes("SequelizeMeta")) {
      await queryInterface.createTable("SequelizeMeta", {
        name: {
          type: sequelize.Sequelize.STRING,
          allowNull: false,
          primaryKey: true,
        },
      });
      console.log("Created SequelizeMeta table");
    }

    // Get list of executed migrations
    const executedMigrations = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name',
      { type: sequelize.Sequelize.QueryTypes.SELECT },
    );
    const executedNames = executedMigrations.map((m) => m.name);

    // Get list of migration files
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".js"))
      .sort();

    let ranMigrations = 0;

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const migration = require(path.join(migrationsPath, file));

        try {
          await migration.up(queryInterface, sequelize.Sequelize);
          await sequelize.query(
            'INSERT INTO "SequelizeMeta" (name) VALUES (?)',
            {
              replacements: [file],
            },
          );
          ranMigrations++;
          console.log(`✓ Completed: ${file}`);
        } catch (err) {
          console.error(`✗ Failed: ${file}`);
          throw err;
        }
      }
    }

    if (ranMigrations === 0) {
      console.log("✓ Database is up to date");
    } else {
      console.log(`✓ Successfully ran ${ranMigrations} migration(s)`);
    }

    return true;
  } catch (err) {
    console.error("✗ Migration failed:", err.message);
    return false;
  }
}

module.exports = { runMigrations };
