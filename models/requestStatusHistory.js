import { DataTypes, Model } from 'sequelize';

export function initRequestStatusHistory(sequelize) {
  class RequestStatusHistory extends Model {
    static associate(models) {
      RequestStatusHistory.belongsTo(models.MaintenanceRequest, {
        foreignKey: 'requestId',
        as: 'request',
      });
    }
  }

  RequestStatusHistory.init(
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
      fromStatus: {
        type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'),
        allowNull: true,
        field: 'from_status',
      },
      toStatus: {
        type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'),
        allowNull: false,
        field: 'to_status',
      },
      changedBy: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'changed_by',
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      changedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'changed_at',
      },
    },
    {
      sequelize,
      modelName: 'RequestStatusHistory',
      tableName: 'request_status_history',
      underscored: true,
      timestamps: false,
    },
  );

  return RequestStatusHistory;
}