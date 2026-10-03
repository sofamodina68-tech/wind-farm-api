import { sequelize } from '../../models/index.js';

export async function connectToTestDb() {
  await sequelize.authenticate();
}

export async function closeTestDb() {
  await sequelize.close();
}

/**
 * Очистка всех таблиц перед каждым тестом.
 * Используем TRUNCATE ... CASCADE, чтобы сбросить данные и FK-зависимости.
 */
export async function truncateAll() {
  const tables = [
    'request_assignees',
    'request_status_history',
    'maintenance_requests',
    'equipment_passports',
    'equipment',
    'technicians',
    'sites',
    'users',
  ];

  await sequelize.query(
    `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`,
  );
}