'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      site_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'sites',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('turbine', 'inverter', 'sensor', 'substation'),
        allowNull: false,
      },
      serial_number: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM(
          'operational',
          'maintenance',
          'fault',
          'decommissioned',
        ),
        allowNull: false,
        defaultValue: 'operational',
      },
      installed_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    await queryInterface.addIndex('equipment', ['serial_number'], {
      unique: true,
      name: 'equipment_serial_number_unique',
    });
    await queryInterface.addIndex('equipment', ['site_id'], {
      name: 'equipment_site_id_idx',
    });
    await queryInterface.addIndex('equipment', ['status'], {
      name: 'equipment_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('equipment');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_equipment_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_equipment_status";',
    );
  },
};