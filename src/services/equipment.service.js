import { equipmentRepository } from '../repositories/equipment.repository.js';
import { requestsRepository } from '../repositories/requests.repository.js';
import { weatherService } from './weather.service.js';
import { NotFoundError, ConflictError, AppError } from '../errors/AppError.js';

export const equipmentService = {
  async list(query) {
    return equipmentRepository.findAll(query);
  },

  async getById(id) {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new NotFoundError('Оборудование не найдено');
    return equipment;
  },

  async create(data) {
    const existing = await equipmentRepository.findBySerialNumber(data.serialNumber);
    if (existing) throw new ConflictError('Серийный номер уже используется');

    const payload = { ...data };
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;

    return equipmentRepository.create(payload);
  },

  async update(id, patch) {
    await this.getById(id);

    if (patch.serialNumber) {
      const existing = await equipmentRepository.findBySerialNumber(patch.serialNumber);
      if (existing && existing.id !== id) {
        throw new ConflictError('Серийный номер уже используется');
      }
    }

    const payload = { ...patch };
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;

    return equipmentRepository.update(id, payload);
  },

  async remove(id) {
    await this.getById(id);
    const openCount = await requestsRepository.countOpenByEquipmentId(id);
    if (openCount > 0) {
      throw new ConflictError('Нельзя удалить оборудование с открытыми заявками');
    }
    await equipmentRepository.remove(id);
  },

  async getRequests(id) {
    await this.getById(id);
    return requestsRepository.findByEquipmentId(id);
  },

  async getWeather(id) {
    const equipment = await this.getById(id);
    try {
      return await weatherService.getForecastByCoords(equipment.location, 3);
    } catch (err) {
      throw new AppError('Погодный сервис временно недоступен', {
        statusCode: 502,
        code: 'WEATHER_UNAVAILABLE',
      });
    }
  },
};