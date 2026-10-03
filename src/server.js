import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { sequelize } from '../models/index.js';

const app = createApp();

async function start() {
  // Проверка подключения к БД до старта сервера
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
  } catch (err) {
    logger.fatal({ err }, 'Cannot connect to database. Server will not start.');
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.nodeEnv },
      `Server running on http://localhost:${config.port}`,
    );
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      try {
        await sequelize.close();
        logger.info('Database connection closed');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error while closing database');
        process.exit(1);
      }
    });
    // На случай, если close зависнет
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();