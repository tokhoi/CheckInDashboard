const { Pool } = require("pg");
const env = require('./env');

const poolCache = {};

async function ConnPostgres(dbName) {
  if (!poolCache[dbName]) {
    poolCache[dbName] = new Pool({
      host: env.POSTGRESQL_HOST,
      user: env.POSTGRESQL_USER,
      password: env.POSTGRESQL_PASSWORD,
      port: env.POSTGRESQL_PORT,
      database: dbName,
      max: 10, // max connections per pool
    });
  }
  return poolCache[dbName];
}

module.exports = { ConnPostgres };