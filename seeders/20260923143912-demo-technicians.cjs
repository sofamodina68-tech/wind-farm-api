'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('technicians', [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        full_name: 'Иванов Иван Иванович',
        specialization: 'Электромеханик',
        employee_number: 'EMP-001',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a2222222-2222-2222-2222-222222222222',
        full_name: 'Петров Пётр Петрович',
        specialization: 'Инженер-механик',
        employee_number: 'EMP-002',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a3333333-3333-3333-3333-333333333333',
        full_name: 'Сидоров Алексей Владимирович',
        specialization: 'Электроник',
        employee_number: 'EMP-003',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a4444444-4444-4444-4444-444444444444',
        full_name: 'Кузнецова Мария Сергеевна',
        specialization: 'Инженер КИПиА',
        employee_number: 'EMP-004',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'a5555555-5555-5555-5555-555555555555',
        full_name: 'Морозов Дмитрий Олегович',
        specialization: 'Слесарь-ремонтник',
        employee_number: 'EMP-005',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('technicians', {
      id: [
        'a1111111-1111-1111-1111-111111111111',
        'a2222222-2222-2222-2222-222222222222',
        'a3333333-3333-3333-3333-333333333333',
        'a4444444-4444-4444-4444-444444444444',
        'a5555555-5555-5555-5555-555555555555',
      ],
    });
  },
};