'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment_passports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'equipment',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      manufacturer: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      rated_power_kw: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      last_inspection_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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

    await queryInterface.addIndex('equipment_passports', ['equipment_id'], {
      unique: true,
      name: 'equipment_passports_equipment_id_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('equipment_passports');
  },
};