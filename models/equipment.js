import { DataTypes, Model } from 'sequelize';

export function initEquipment(sequelize) {
  class Equipment extends Model {
    static associate(models) {
      Equipment.belongsTo(models.Site, {
        foreignKey: 'siteId',
        as: 'site',
      });

      Equipment.hasOne(models.EquipmentPassport, {
        foreignKey: 'equipmentId',
        as: 'passport',
      });

      Equipment.hasMany(models.MaintenanceRequest, {
        foreignKey: 'equipmentId',
        as: 'requests',
      });
    }
  }

  Equipment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      siteId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'site_id',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('turbine', 'inverter', 'sensor', 'substation'),
        allowNull: false,
      },
      serialNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'serial_number',
      },
      status: {
        type: DataTypes.ENUM(
          'operational',
          'maintenance',
          'fault',
          'decommissioned',
        ),
        allowNull: false,
        defaultValue: 'operational',
      },
      installedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'installed_at',
      },
    },
    {
      sequelize,
      modelName: 'Equipment',
      tableName: 'equipment',
      underscored: true,
      timestamps: true,
    },
  );

  return Equipment;
}