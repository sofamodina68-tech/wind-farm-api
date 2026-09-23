import { DataTypes, Model } from 'sequelize';

export function initEquipmentPassport(sequelize) {
  class EquipmentPassport extends Model {
    static associate(models) {
      EquipmentPassport.belongsTo(models.Equipment, {
        foreignKey: 'equipmentId',
        as: 'equipment',
      });
    }
  }

  EquipmentPassport.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      equipmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'equipment_id',
      },
      manufacturer: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      ratedPowerKw: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'rated_power_kw',
      },
      lastInspectionDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'last_inspection_date',
      },
    },
    {
      sequelize,
      modelName: 'EquipmentPassport',
      tableName: 'equipment_passports',
      underscored: true,
      timestamps: true,
    },
  );

  return EquipmentPassport;
}