import { DataTypes, Model } from 'sequelize';

export function initTechnician(sequelize) {
  class Technician extends Model {
    static associate(models) {
      Technician.belongsToMany(models.MaintenanceRequest, {
        through: models.RequestAssignee,
        foreignKey: 'technicianId',
        otherKey: 'requestId',
        as: 'requests',
      });
    }
  }

  Technician.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'full_name',
      },
      specialization: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      employeeNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        field: 'employee_number',
      },
    },
    {
      sequelize,
      modelName: 'Technician',
      tableName: 'technicians',
      underscored: true,
      timestamps: true,
    },
  );

  return Technician;
}