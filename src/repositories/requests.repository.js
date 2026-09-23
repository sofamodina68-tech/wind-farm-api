import { Op } from 'sequelize';
import {
  MaintenanceRequest,
  Equipment,
  Technician,
  RequestAssignee,
  RequestStatusHistory,
} from '../../models/index.js';
import { OPEN_REQUEST_STATUSES } from '../domain/requests.js';

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'plannedAt', 'priority'];

function serialize(request) {
  const json = request.toJSON();
  if (json.assignees) {
    json.technicians = json.assignees.map((a) => ({
      id: a.technician?.id,
      fullName: a.technician?.fullName,
      specialization: a.technician?.specialization,
      role: a.role,
      hours: Number(a.hours),
    }));
  }
  return json;
}

export const requestsRepository = {
  async findAll({
    equipmentId,
    status,
    priority,
    createdFrom,
    createdTo,
    plannedFrom,
    plannedTo,
    sort = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 20,
  } = {}) {
    const safeSort = SORTABLE_FIELDS.includes(sort) ? sort : 'createdAt';
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

    const where = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt[Op.gte] = new Date(createdFrom);
      if (createdTo) where.createdAt[Op.lte] = new Date(createdTo);
    }

    if (plannedFrom || plannedTo) {
      where.plannedAt = {};
      if (plannedFrom) where.plannedAt[Op.gte] = new Date(plannedFrom);
      if (plannedTo) where.plannedAt[Op.lte] = new Date(plannedTo);
    }

    // Сортировка по priority идёт по «весу», а не по алфавиту
    const orderClause =
      safeSort === 'priority'
        ? [
            [
              // Используем CASE через Sequelize.literal с белым списком значений
              MaintenanceRequest.sequelize.literal(
                `CASE priority
                   WHEN 'critical' THEN 4
                   WHEN 'high' THEN 3
                   WHEN 'medium' THEN 2
                   WHEN 'low' THEN 1
                   ELSE 0 END`,
              ),
              safeOrder,
            ],
          ]
        : [[safeSort, safeOrder]];

    const { rows, count } = await MaintenanceRequest.findAndCountAll({
      where,
      attributes: [
        'id',
        'equipmentId',
        'title',
        'description',
        'priority',
        'status',
        'plannedAt',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'type', 'serialNumber', 'status'],
        },
      ],
      order: orderClause,
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return {
      data: rows.map((r) => r.toJSON()),
      total: count,
      page,
      limit,
    };
  },

  async findById(id) {
    const request = await MaintenanceRequest.findByPk(id, {
      include: [
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'name', 'type', 'serialNumber', 'status'],
        },
        {
          model: RequestAssignee,
          as: 'assignees',
          include: [
            {
              model: Technician,
              as: 'technician',
              attributes: ['id', 'fullName', 'specialization', 'employeeNumber'],
            },
          ],
        },
        {
          model: RequestStatusHistory,
          as: 'statusHistory',
        },
      ],
    });
    return request ? serialize(request) : null;
  },

  async findByEquipmentId(equipmentId) {
    const items = await MaintenanceRequest.findAll({
      where: { equipmentId },
      order: [['createdAt', 'DESC']],
    });
    return items.map((r) => r.toJSON());
  },

  async countOpenByEquipmentId(equipmentId) {
    return MaintenanceRequest.count({
      where: {
        equipmentId,
        status: { [Op.in]: OPEN_REQUEST_STATUSES },
      },
    });
  },

  async deleteByEquipmentId(equipmentId) {
    return MaintenanceRequest.destroy({
      where: { equipmentId },
    });
  },

  async create(data) {
    const payload = { ...data };
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.status;

    const request = await MaintenanceRequest.create({
      ...payload,
      status: 'new',
    });
    return request.toJSON();
  },

  async update(id, patch) {
    const request = await MaintenanceRequest.findByPk(id);
    if (!request) return null;

    const payload = { ...patch };
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;

    await request.update(payload);
    return request.toJSON();
  },

  async remove(id) {
    const request = await MaintenanceRequest.findByPk(id);
    if (!request) return false;
    await request.destroy();
    return true;
  },
};