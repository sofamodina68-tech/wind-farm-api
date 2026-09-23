import { DataTypes, Model } from 'sequelize';

export function initRequestAssignee(sequelize) {
  class RequestAssignee extends Model {
    static associate(models) {
      RequestAssignee.belongsTo(models.MaintenanceRequest, {
        foreignKey: 'requestId',
        as: 'request',
      });

      RequestAssignee.belongsTo(models.Technician, {
        foreignKey: 'technicianId',
        as: 'technician',
      });
    }
  }

  RequestAssignee.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'request_id',
      },
      technicianId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'technician_id',
      },
      role: {
        type: DataTypes.ENUM('lead', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      hours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'RequestAssignee',
      tableName: 'request_assignees',
      underscored: true,
      timestamps: true,
    },
  );

  return RequestAssignee;
}