import { Sequelize } from 'sequelize';
import config from '../config/config.cjs';

import { initSite } from './site.js';
import { initTechnician } from './technician.js';
import { initEquipment } from './equipment.js';
import { initEquipmentPassport } from './equipmentPassport.js';
import { initMaintenanceRequest } from './maintenanceRequest.js';
import { initRequestStatusHistory } from './requestStatusHistory.js';
import { initRequestAssignee } from './requestAssignee.js';

const env = process.env.NODE_ENV ?? 'development';
const dbConfig = config[env];

export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    pool: dbConfig.pool,
  },
);

export const Site = initSite(sequelize);
export const Technician = initTechnician(sequelize);
export const Equipment = initEquipment(sequelize);
export const EquipmentPassport = initEquipmentPassport(sequelize);
export const MaintenanceRequest = initMaintenanceRequest(sequelize);
export const RequestStatusHistory = initRequestStatusHistory(sequelize);
export const RequestAssignee = initRequestAssignee(sequelize);

// Регистрация ассоциаций
const models = {
  Site,
  Technician,
  Equipment,
  EquipmentPassport,
  MaintenanceRequest,
  RequestStatusHistory,
  RequestAssignee,
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export default {
  sequelize,
  Sequelize,
  Site,
  Technician,
  Equipment,
  EquipmentPassport,
  MaintenanceRequest,
  RequestStatusHistory,
  RequestAssignee,
};