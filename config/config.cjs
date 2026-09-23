require('dotenv').config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: {
    min: Number(process.env.DB_POOL_MIN ?? 0),
    max: Number(process.env.DB_POOL_MAX ?? 10),
  },
};

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: base,
};