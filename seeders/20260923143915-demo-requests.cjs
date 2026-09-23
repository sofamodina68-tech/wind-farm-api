'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const req = (id, equipment_id, title, priority, status, daysAgo, plannedDaysAhead) => {
      const created = new Date(Date.now() - daysAgo * 86400000);
      const planned = plannedDaysAhead != null
        ? new Date(Date.now() + plannedDaysAhead * 86400000)
        : null;
      return {
        id,
        equipment_id,
        title,
        description: `Автоматически созданная заявка: ${title}`,
        priority,
        status,
        planned_at: planned,
        created_at: created,
        updated_at: created,
      };
    };

    const E1 = 'e1111111-1111-1111-1111-111111111111';
    const E2 = 'e2222222-2222-2222-2222-222222222222';
    const E3 = 'e3333333-3333-3333-3333-333333333333';
    const E4 = 'e4444444-4444-4444-4444-444444444444';
    const E5 = 'e5555555-5555-5555-5555-555555555555';
    const E6 = 'e6666666-6666-6666-6666-666666666666';

    await queryInterface.bulkInsert('maintenance_requests', [
      req('b1000000-0000-0000-0000-000000000001', E1, 'Плановое ТО N-01', 'medium', 'done', 40, -35),
      req('b1000000-0000-0000-0000-000000000002', E1, 'Замена датчика вибрации', 'high', 'done', 30, -25),
      req('b1000000-0000-0000-0000-000000000003', E2, 'Плановое ТО N-02', 'medium', 'in_progress', 20, 3),
      req('b1000000-0000-0000-0000-000000000004', E2, 'Замена масла редуктора', 'high', 'in_progress', 15, 5),
      req('b1000000-0000-0000-0000-000000000005', E3, 'Диагностика инвертора', 'critical', 'new', 5, 2),
      req('b1000000-0000-0000-0000-000000000006', E3, 'Замена силового модуля', 'high', 'new', 3, 7),
      req('b1000000-0000-0000-0000-000000000007', E4, 'Плановое ТО S-01', 'medium', 'done', 50, -45),
      req('b1000000-0000-0000-0000-000000000008', E4, 'Проверка лопастей', 'low', 'done', 45, -40),
      req('b1000000-0000-0000-0000-000000000009', E4, 'Подтяжка болтовых соединений', 'medium', 'in_progress', 10, 2),
      req('b1000000-0000-0000-0000-00000000000a', E5, 'Калибровка датчика ветра', 'low', 'done', 35, -30),
      req('b1000000-0000-0000-0000-00000000000b', E5, 'Замена анемометра', 'medium', 'rejected', 25, null),
      req('b1000000-0000-0000-0000-00000000000c', E6, 'Осмотр подстанции', 'high', 'done', 60, -55),
      req('b1000000-0000-0000-0000-00000000000d', E6, 'Замена изоляторов', 'critical', 'in_progress', 7, 4),
      req('b1000000-0000-0000-0000-00000000000e', E6, 'Проверка заземления', 'medium', 'new', 2, 10),
      req('b1000000-0000-0000-0000-00000000000f', E1, 'Смазка подшипников', 'low', 'done', 70, -65),
      req('b1000000-0000-0000-0000-000000000010', E2, 'Замена фильтров', 'medium', 'rejected', 28, null),
      req('b1000000-0000-0000-0000-000000000011', E3, 'Проверка вентиляции', 'low', 'done', 55, -50),
      req('b1000000-0000-0000-0000-000000000012', E4, 'Плановое ТО S-01 (квартальное)', 'medium', 'new', 1, 14),
      req('b1000000-0000-0000-0000-000000000013', E5, 'Проверка кабельных линий', 'high', 'new', 1, 9),
      req('b1000000-0000-0000-0000-000000000014', E1, 'Внеплановый осмотр', 'critical', 'new', 0, 1),
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('maintenance_requests', {});
  },
};