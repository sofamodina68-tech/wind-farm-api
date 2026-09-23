import { DataTypes, Model } from 'sequelize';

export function initMaintenanceRequest(sequelize) {
  class MaintenanceRequest extends Model {
    static associate(models) {
      MaintenanceRequest.belongsTo(models.Equipment, {
        foreignKey: 'equipmentId',
        as: 'equipment',
      });

      MaintenanceRequest.hasMany(models.RequestStatusHistory, {
        foreignKey: 'requestId',
        as: 'statusHistory',
      });

      MaintenanceRequest.belongsToMany(models.Technician, {
        through: models.RequestAssignee,
        foreignKey: 'requestId',
        otherKey: 'technicianId',
        as: 'technicians',
      });

      MaintenanceRequest.hasMany(models.RequestAssignee, {
        foreignKey: 'requestId',
        as: 'assignees',
      });
    }
  }

  MaintenanceRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      equipmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'equipment_id',
      },
      title: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'),
        allowNull: false,
        defaultValue: 'new',
      },
      plannedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'planned_at',
      },
    },
    {
      sequelize,
      modelName: 'MaintenanceRequest',
      tableName: 'maintenance_requests',
      underscored: true,
      timestamps: true,
    },
  );

  return MaintenanceRequest;
}