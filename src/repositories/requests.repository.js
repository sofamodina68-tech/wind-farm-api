import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

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

const OPEN_STATUSES = ['new', 'in_progress'];

export const requestsRepository = {
  async countOpenByEquipmentId(equipmentId) {
    const items = await loadAll();
    return items.filter(
      (r) => r.equipmentId === equipmentId && OPEN_STATUSES.includes(r.status),
    ).length;
  },

  async findByEquipmentId(equipmentId) {
    const items = await loadAll();
    return items.filter((r) => r.equipmentId === equipmentId);
  },
};