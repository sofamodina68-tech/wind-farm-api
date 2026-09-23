'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('technicians', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      specialization: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      employee_number: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('technicians', ['employee_number'], {
      unique: true,
      name: 'technicians_employee_number_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('technicians');
  },
};