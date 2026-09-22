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
    // Проверяем, что оборудование существует
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

  async changeStatus(id, nextStatus) {
    const request = await this.getById(id);
    const allowed = STATUS_TRANSITIONS[request.status] ?? [];

    if (!allowed.includes(nextStatus)) {
      throw new ConflictError(
        `Недопустимый переход статуса: ${request.status} → ${nextStatus}`,
      );
    }

    return requestsRepository.update(id, { status: nextStatus });
  },

  async remove(id) {
    await this.getById(id);
    await requestsRepository.remove(id);
  },
};