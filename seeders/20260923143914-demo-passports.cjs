'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('equipment_passports', [
      {
        id: 'f1111111-1111-1111-1111-111111111111',
        equipment_id: 'e1111111-1111-1111-1111-111111111111',
        manufacturer: 'Vestas',
        model: 'V150-4.2MW',
        rated_power_kw: 4200.0,
        last_inspection_date: '2025-09-01',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f2222222-2222-2222-2222-222222222222',
        equipment_id: 'e2222222-2222-2222-2222-222222222222',
        manufacturer: 'Vestas',
        model: 'V150-4.2MW',
        rated_power_kw: 4200.0,
        last_inspection_date: '2025-06-15',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f3333333-3333-3333-3333-333333333333',
        equipment_id: 'e3333333-3333-3333-3333-333333333333',
        manufacturer: 'ABB',
        model: 'PVS-175-TL',
        rated_power_kw: 175.0,
        last_inspection_date: '2025-08-20',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f4444444-4444-4444-4444-444444444444',
        equipment_id: 'e4444444-4444-4444-4444-444444444444',
        manufacturer: 'Siemens Gamesa',
        model: 'SG 5.0-145',
        rated_power_kw: 5000.0,
        last_inspection_date: '2025-07-10',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f5555555-5555-5555-5555-555555555555',
        equipment_id: 'e5555555-5555-5555-5555-555555555555',
        manufacturer: 'Thies Clima',
        model: 'First Class',
        rated_power_kw: null,
        last_inspection_date: '2025-05-01',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'f6666666-6666-6666-6666-666666666666',
        equipment_id: 'e6666666-6666-6666-6666-666666666666',
        manufacturer: 'Siemens',
        model: '8DJH',
        rated_power_kw: null,
        last_inspection_date: '2025-04-15',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('equipment_passports', {
      id: [
        'f1111111-1111-1111-1111-111111111111',
        'f2222222-2222-2222-2222-222222222222',
        'f3333333-3333-3333-3333-333333333333',
        'f4444444-4444-4444-4444-444444444444',
        'f5555555-5555-5555-5555-555555555555',
        'f6666666-6666-6666-6666-666666666666',
      ],
    });
  },
};