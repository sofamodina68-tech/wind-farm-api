import {
  Equipment,
  EquipmentPassport,
  Site,
} from '../../models/index.js';

const SORTABLE_FIELDS = ['name', 'installedAt', 'status', 'type'];

function serialize(equipment) {
  const json = equipment.toJSON();
  // Совместимость с Кейсом 2: отдаём location в формате { lat, lon }
  if (json.site) {
    json.location = {
      lat: Number(json.site.latitude),
      lon: Number(json.site.longitude),
    };
  }
  return json;
}

export const equipmentRepository = {
  async findAll({
    status,
    type,
    sort = 'name',
    order = 'asc',
    page = 1,
    limit = 20,
  } = {}) {
    const safeSort = SORTABLE_FIELDS.includes(sort) ? sort : 'name';
    const safeOrder = order === 'desc' ? 'DESC' : 'ASC';

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const { rows, count } = await Equipment.findAndCountAll({
      where,
      include: [
        {
          model: Site,
          as: 'site',
          attributes: ['id', 'name', 'code', 'region', 'latitude', 'longitude'],
        },
      ],
      attributes: [
        'id',
        'siteId',
        'name',
        'type',
        'serialNumber',
        'status',
        'installedAt',
        'createdAt',
        'updatedAt',
      ],
      order: [[safeSort, safeOrder]],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return {
      data: rows.map(serialize),
      total: count,
      page,
      limit,
    };
  },

  async findById(id) {
    const equipment = await Equipment.findByPk(id, {
      include: [
        {
          model: Site,
          as: 'site',
          attributes: ['id', 'name', 'code', 'region', 'latitude', 'longitude'],
        },
        {
          model: EquipmentPassport,
          as: 'passport',
        },
      ],
    });
    return equipment ? serialize(equipment) : null;
  },

  async findBySerialNumber(serialNumber) {
    const equipment = await Equipment.findOne({
      where: { serialNumber },
      include: [
        {
          model: Site,
          as: 'site',
          attributes: ['id', 'name', 'code', 'region', 'latitude', 'longitude'],
        },
      ],
    });
    return equipment ? serialize(equipment) : null;
  },

  async create(data) {
    let siteId = data.siteId;
    if (!siteId) {
      const defaultSite = await Site.findOne({ order: [['createdAt', 'ASC']] });
      if (!defaultSite) {
        throw new Error('Нет ни одной площадки. Сначала создайте Site.');
      }
      siteId = defaultSite.id;
    }

    const payload = { ...data, siteId };
    delete payload.id;
    delete payload.location; // location из Кейса 2 не нужен — координаты в Site
    delete payload.createdAt;
    delete payload.updatedAt;

    const equipment = await Equipment.create(payload);
    return this.findById(equipment.id);
  },

  async update(id, patch) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return null;

    const payload = { ...patch };
    delete payload.id;
    delete payload.location;
    delete payload.createdAt;
    delete payload.updatedAt;

    await equipment.update(payload);
    return this.findById(id);
  },

  async remove(id) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return false;
    await equipment.destroy();
    return true;
  },
};