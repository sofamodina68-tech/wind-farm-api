'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'done', 'rejected'),
        allowNull: false,
        defaultValue: 'new',
      },
      planned_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('maintenance_requests', ['equipment_id'], {
      name: 'maintenance_requests_equipment_id_idx',
    });
    await queryInterface.addIndex('maintenance_requests', ['status'], {
      name: 'maintenance_requests_status_idx',
    });
    await queryInterface.addIndex('maintenance_requests', ['priority'], {
      name: 'maintenance_requests_priority_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('maintenance_requests');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_maintenance_requests_priority";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_maintenance_requests_status";',
    );
  },
};