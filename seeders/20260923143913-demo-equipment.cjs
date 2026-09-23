'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const SITE_NORTH = '11111111-1111-1111-1111-111111111111';
    const SITE_SOUTH = '22222222-2222-2222-2222-222222222222';

    await queryInterface.bulkInsert('equipment', [
      {
        id: 'e1111111-1111-1111-1111-111111111111',
        site_id: SITE_NORTH,
        name: 'Ветрогенератор N-01',
        type: 'turbine',
        serial_number: 'WT-N-001',
        status: 'operational',
        installed_at: '2022-03-15T00:00:00.000Z',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e2222222-2222-2222-2222-222222222222',
        site_id: SITE_NORTH,
        name: 'Ветрогенератор N-02',
        type: 'turbine',
        serial_number: 'WT-N-002',
        status: 'maintenance',
        installed_at: '2022-03-15T00:00:00.000Z',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e3333333-3333-3333-3333-333333333333',
        site_id: SITE_NORTH,
        name: 'Инвертор N-INV-01',
        type: 'inverter',
        serial_number: 'INV-N-001',
        status: 'fault',
        installed_at: '2022-06-20T00:00:00.000Z',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e4444444-4444-4444-4444-444444444444',
        site_id: SITE_SOUTH,
        name: 'Ветрогенератор S-01',
        type: 'turbine',
        serial_number: 'WT-S-001',
        status: 'operational',
        installed_at: '2023-01-10T00:00:00.000Z',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e5555555-5555-5555-5555-555555555555',
        site_id: SITE_SOUTH,
        name: 'Датчик ветра S-SEN-01',
        type: 'sensor',
        serial_number: 'SEN-S-001',
        status: 'operational',
        installed_at: '2023-02-05T00:00:00.000Z',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'e6666666-6666-6666-6666-666666666666',
        site_id: SITE_SOUTH,
        name: 'Подстанция S-SUB-01',
        type: 'substation',
        serial_number: 'SUB-S-001',
        status: 'operational',
        installed_at: '2023-01-10T00:00:00.000Z',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('equipment', {
      id: [
        'e1111111-1111-1111-1111-111111111111',
        'e2222222-2222-2222-2222-222222222222',
        'e3333333-3333-3333-3333-333333333333',
        'e4444444-4444-4444-4444-444444444444',
        'e5555555-5555-5555-5555-555555555555',
        'e6666666-6666-6666-6666-666666666666',
      ],
    });
  },
};