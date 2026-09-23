'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('sites', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Ветропарк Северный',
        code: 'WP-NORTH',
        region: 'Мурманская область',
        latitude: 68.9706,
        longitude: 33.0827,
        created_at: now,
        updated_at: now,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Ветропарк Южный',
        code: 'WP-SOUTH',
        region: 'Ростовская область',
        latitude: 47.2225,
        longitude: 39.7187,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sites', {
      id: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ],
    });
  },
};