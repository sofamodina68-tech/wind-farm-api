import { DataTypes, Model } from 'sequelize';

export function initUser(sequelize) {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Technician, {
        foreignKey: 'technicianId',
        as: 'technician',
      });
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.passwordHash;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },
      role: {
        type: DataTypes.ENUM('viewer', 'technician', 'admin'),
        allowNull: false,
        defaultValue: 'viewer',
      },
      technicianId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'technician_id',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
    },
  );

  return User;
}