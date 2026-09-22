import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'equipment.json');

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

export const equipmentRepository = {
  async findAll({ status, type, sort = 'name', order = 'asc', page = 1, limit = 20 } = {}) {
    let items = await loadAll();
    if (status) items = items.filter((e) => e.status === status);
    if (type) items = items.filter((e) => e.type === type);

    items.sort((a, b) => {
      const va = a[sort] ?? '';
      const vb = b[sort] ?? '';
      return (va > vb ? 1 : -1) * (order === 'asc' ? 1 : -1);
    });

    const total = items.length;
    const start = (page - 1) * limit;
    return { data: items.slice(start, start + limit), total, page, limit };
  },

  async findById(id) {
    const items = await loadAll();
    return items.find((e) => e.id === id) ?? null;
  },

  async findBySerialNumber(serialNumber) {
    const items = await loadAll();
    return items.find((e) => e.serialNumber === serialNumber) ?? null;
  },

  async create(data) {
    const items = await loadAll();
    const now = new Date().toISOString();
    const equipment = {
      id: randomUUID(),
      status: data.status ?? 'operational',
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    items.push(equipment);
    await saveAll(items);
    return equipment;
  },

  async update(id, patch) {
    const items = await loadAll();
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    await saveAll(items);
    return items[idx];
  },

  async remove(id) {
    const items = await loadAll();
    const idx = items.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    await saveAll(items);
    return true;
  },
};