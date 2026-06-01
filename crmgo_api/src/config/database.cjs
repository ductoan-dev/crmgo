require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "crmgo_demo",
    host:     process.env.DB_HOST || "localhost",
    port:     process.env.DB_PORT || 3306,
    logging:  false,
    dialect:  "mysql",
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
  test: {
    username: process.env.CI_DB_USERNAME,
    password: process.env.CI_DB_PASSWORD,
    database: process.env.CI_DB_NAME,
    host:     "127.0.0.1",
    port:     3306,
    dialect:  "mysql",
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host:     process.env.PROD_DB_HOSTNAME,
    port:     process.env.PROD_DB_PORT,
    dialect:  "mysql",
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
};
