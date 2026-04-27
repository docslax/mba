"use strict";

require("dotenv").config();

function parseBoolean(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function buildConfig(defaultDatabase) {
  const dbSslEnabled = parseBoolean(process.env.DB_SSL, false);
  const rejectUnauthorized = parseBoolean(
    process.env.DB_SSL_REJECT_UNAUTHORIZED,
    false,
  );

  return {
    username: process.env.DB_USER || "db_user",
    password: process.env.DB_PASSWORD || "local_password",
    database: process.env.DB_NAME || defaultDatabase,
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
    dialectOptions: dbSslEnabled
      ? {
          ssl: {
            require: true,
            rejectUnauthorized,
          },
        }
      : undefined,
  };
}

module.exports = {
  development: process.env.DATABASE_URL
    ? {
        use_env_variable: "DATABASE_URL",
        dialect: "postgres",
        logging: false,
      }
    : buildConfig("mbaofbc_app"),
  test: process.env.DATABASE_URL_TEST
    ? {
        use_env_variable: "DATABASE_URL_TEST",
        dialect: "postgres",
        logging: false,
      }
    : buildConfig(process.env.DB_NAME_TEST || "mbaofbc_app_test"),
  production: process.env.DATABASE_URL
    ? {
        use_env_variable: "DATABASE_URL",
        dialect: "postgres",
        logging: false,
      }
    : buildConfig("mbaofbc_app"),
};
