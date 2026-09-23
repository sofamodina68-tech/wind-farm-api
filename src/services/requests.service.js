import {
  MaintenanceRequest,
  RequestStatusHistory,
  RequestAssignee,
  sequelize,
} from '../../models/index.js';
import { requestsRepository } from '../repositories/requests.repository.js';
import { equipmentRepository } from '../repositories/equipment.repository.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';
import { STATUS_TRANSITIONS } from '../domain/requests.js';

export const requestsService = {
  async list(query) {
    return requestsRepository.findAll(query);
  },

  async getById(id) {
    const request = await requestsRepository.findById(id);
    if (!request) throw new NotFoundError('Заявка не найдена');
    return request;
  },

  async create(data) {
    const equipment = await equipmentRepository.findById(data.equipmentId);
    if (!equipment) throw new NotFoundError('Оборудование не найдено');

    const payload = { ...data };
    delete payload.id;
    delete payload.status;
    delete payload.createdAt;
    delete payload.updatedAt;

    return requestsRepository.create(payload);
  },

  async update(id, patch) {
    await this.getById(id);

    const payload = { ...patch };
    delete payload.id;
    delete payload.status;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.equipmentId;

    return requestsRepository.update(id, payload);
  },

  async changeStatus(id, nextStatus, changedBy = 'api') {
    return sequelize.transaction(async (t) => {
      // Блокируем строку заявки — защита от конкурентного изменения
      const request = await MaintenanceRequest.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!request) {
        throw new NotFoundError('Заявка не найдена');
      }

      const currentStatus = request.status;

      if (currentStatus === nextStatus) {
        throw new ConflictError(
          `Заявка уже находится в статусе ${nextStatus}`,
        );
      }

      // Проверка: нельзя перейти в in_progress без назначенной бригады
      if (nextStatus === 'in_progress') {
        const assigneesCount = await RequestAssignee.count({
          where: { requestId: id },
          transaction: t,
        });
        if (assigneesCount === 0) {
          throw new ConflictError(
            'Нельзя перевести заявку в in_progress без назначенной бригады',
          );
        }
      }

      const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(nextStatus)) {
        throw new ConflictError(
          `Недопустимый переход статуса: ${currentStatus} → ${nextStatus}`,
        );
      }

      // Обновляем заявку
      await request.update({ status: nextStatus }, { transaction: t });

      // Пишем в историю статусов
      await RequestStatusHistory.create(
        {
          requestId: id,
          fromStatus: currentStatus,
          toStatus: nextStatus,
          changedBy,
          comment: `Статус изменён: ${currentStatus} → ${nextStatus}`,
        },
        { transaction: t },
      );

      return request.toJSON();
    });
  },

  async getHistory(id) {
    const request = await MaintenanceRequest.findByPk(id);
    if (!request) {
      throw new NotFoundError('Заявка не найдена');
    }

    const items = await RequestStatusHistory.findAll({
      where: { requestId: id },
      order: [['changedAt', 'ASC']],
    });

    return items.map((r) => r.toJSON());
  },

  async remove(id) {
    await this.getById(id);
    await requestsRepository.remove(id);
  },
};