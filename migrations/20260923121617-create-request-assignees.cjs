'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_assignees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'maintenance_requests', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      technician_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'technicians', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      role: {
        type: Sequelize.ENUM('lead', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      hours: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addConstraint('request_assignees', {
      fields: ['request_id', 'technician_id'],
      type: 'unique',
      name: 'request_assignees_unique_request_technician',
    });

    await queryInterface.addIndex('request_assignees', ['request_id'], {
      name: 'request_assignees_request_id_idx',
    });
    await queryInterface.addIndex('request_assignees', ['technician_id'], {
      name: 'request_assignees_technician_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('request_assignees');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_request_assignees_role";',
    );
  },
};