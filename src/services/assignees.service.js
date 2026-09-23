import { Op } from 'sequelize';
import {
  MaintenanceRequest,
  RequestAssignee,
  Technician,
  sequelize,
} from '../../models/index.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../errors/AppError.js';
import { validateAssignmentList } from '../domain/assignees.js';

export const assigneesService = {
  async assignTeam(requestId, technicians) {
    const check = validateAssignmentList(technicians);
    if (!check.valid) {
      throw new ValidationError('Некорректный состав бригады', check.errors);
    }

    const request = await MaintenanceRequest.findByPk(requestId);
    if (!request) {
      throw new NotFoundError('Заявка не найдена');
    }

    const techIds = technicians.map((t) => t.technicianId);
    const existing = await Technician.findAll({
      where: { id: { [Op.in]: techIds } },
      attributes: ['id'],
    });
    const existingIds = new Set(existing.map((t) => t.id));
    const missing = techIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundError(
        `Специалисты не найдены: ${missing.join(', ')}`,
      );
    }

    const result = await sequelize.transaction(async (t) => {
      await RequestAssignee.destroy({
        where: { requestId },
        transaction: t,
      });

      const rows = technicians.map((tech) => ({
        requestId,
        technicianId: tech.technicianId,
        role: tech.role,
        hours: tech.hours,
      }));

      await RequestAssignee.bulkCreate(rows, { transaction: t });

      return RequestAssignee.findAll({
        where: { requestId },
        include: [
          {
            model: Technician,
            as: 'technician',
            attributes: ['id', 'fullName', 'specialization', 'employeeNumber'],
          },
        ],
        transaction: t,
      });
    });

    return result.map((r) => r.toJSON());
  },

  async removeAssignee(requestId, technicianId) {
    const request = await MaintenanceRequest.findByPk(requestId);
    if (!request) {
      throw new NotFoundError('Заявка не найдена');
    }

    const assignee = await RequestAssignee.findOne({
      where: { requestId, technicianId },
    });
    if (!assignee) {
      throw new NotFoundError('Специалист не назначен на эту заявку');
    }

    await assignee.destroy();

    const remaining = await RequestAssignee.findAll({
      where: { requestId },
      attributes: ['role'],
    });

    if (remaining.length > 0 && !remaining.some((r) => r.role === 'lead')) {
      throw new ConflictError(
        'После снятия в бригаде не останется ведущего специалиста (lead)',
      );
    }

    return { removed: technicianId };
  },

  async getAssignees(requestId) {
    const request = await MaintenanceRequest.findByPk(requestId);
    if (!request) {
      throw new NotFoundError('Заявка не найдена');
    }

    const assignees = await RequestAssignee.findAll({
      where: { requestId },
      include: [
        {
          model: Technician,
          as: 'technician',
          attributes: ['id', 'fullName', 'specialization', 'employeeNumber'],
        },
      ],
      order: [['role', 'ASC']],
    });

    return assignees.map((a) => a.toJSON());
  },
};