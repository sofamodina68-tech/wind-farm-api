import { beforeAll, afterAll } from '@jest/globals';
import { connectToTestDb, closeTestDb } from './helpers/db.js';

beforeAll(async () => {
  await connectToTestDb();
});

afterAll(async () => {
  await closeTestDb();
});