import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { OPEN_REQUEST_STATUSES, PRIORITY_RANK } from '../domain/requests.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'requests.json');

async function loadAll() {
  try {
    const raw = await readFile(FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveAll(items) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(items, null, 2), 'utf-8');
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
    let items = await loadAll();

    if (equipmentId) items = items.filter((r) => r.equipmentId === equipmentId);
    if (status) items = items.filter((r) => r.status === status);
    if (priority) items = items.filter((r) => r.priority === priority);

    if (createdFrom) items = items.filter((r) => new Date(r.createdAt) >= new Date(createdFrom));
    if (createdTo) items = items.filter((r) => new Date(r.createdAt) <= new Date(createdTo));
    if (plannedFrom) items = items.filter((r) => r.plannedAt && new Date(r.plannedAt) >= new Date(plannedFrom));
    if (plannedTo) items = items.filter((r) => r.plannedAt && new Date(r.plannedAt) <= new Date(plannedTo));

    items.sort((a, b) => {
      let va = a[sort];
      let vb = b[sort];

      if (sort === 'priority') {
        va = PRIORITY_RANK[va] ?? 0;
        vb = PRIORITY_RANK[vb] ?? 0;
      } else if (sort === 'plannedAt' || sort === 'createdAt' || sort === 'updatedAt') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }

      return (va > vb ? 1 : va < vb ? -1 : 0) * (order === 'asc' ? 1 : -1);
    });

    const total = items.length;
    const start = (page - 1) * limit;
    return { data: items.slice(start, start + limit), total, page, limit };
  },

  async findById(id) {
    const items = await loadAll();
    return items.find((r) => r.id === id) ?? null;
  },

  async findByEquipmentId(equipmentId) {
    const items = await loadAll();
    return items.filter((r) => r.equipmentId === equipmentId);
  },

  async countOpenByEquipmentId(equipmentId) {
    const items = await loadAll();
    return items.filter(
      (r) => r.equipmentId === equipmentId && OPEN_REQUEST_STATUSES.includes(r.status),
    ).length;
  },

  async deleteByEquipmentId(equipmentId) {
    const items = await loadAll();
    const filtered = items.filter((r) => r.equipmentId !== equipmentId);
    await saveAll(filtered);
    return items.length - filtered.length;
  },

  async create(data) {
    const items = await loadAll();
    const now = new Date().toISOString();
    const request = {
      id: randomUUID(),
      ...data,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };
    items.push(request);
    await saveAll(items);
    return request;
  },

  async update(id, patch) {
    const items = await loadAll();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    await saveAll(items);
    return items[idx];
  },

  async remove(id) {
    const items = await loadAll();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    await saveAll(items);
    return true;
  },
};