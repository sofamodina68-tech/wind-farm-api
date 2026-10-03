import { test, expect, describe } from '@jest/globals';
import {
  REQUEST_STATUSES,
  REQUEST_PRIORITIES,
  STATUS_TRANSITIONS,
  PRIORITY_RANK,
  OPEN_REQUEST_STATUSES,
} from '../../../src/domain/requests.js';

describe('domain/requests', () => {
  test('все статусы перечислены', () => {
    expect(REQUEST_STATUSES).toEqual(['new', 'in_progress', 'done', 'rejected']);
  });

  test('все приоритеты перечислены', () => {
    expect(REQUEST_PRIORITIES).toEqual(['low', 'medium', 'high', 'critical']);
  });

  test('переходы: new → in_progress, rejected', () => {
    expect(STATUS_TRANSITIONS.new).toEqual(['in_progress', 'rejected']);
  });

  test('переходы: in_progress → done, rejected', () => {
    expect(STATUS_TRANSITIONS.in_progress).toEqual(['done', 'rejected']);
  });

  test('переходы: done — терминальный, нет исходящих', () => {
    expect(STATUS_TRANSITIONS.done).toEqual([]);
  });

  test('переходы: rejected — терминальный, нет исходящих', () => {
    expect(STATUS_TRANSITIONS.rejected).toEqual([]);
  });

  test('нельзя из new сразу в done', () => {
    expect(STATUS_TRANSITIONS.new).not.toContain('done');
  });

  test('нельзя из done обратно в in_progress', () => {
    expect(STATUS_TRANSITIONS.done).not.toContain('in_progress');
  });

  test('ранг приоритетов возрастает', () => {
    expect(PRIORITY_RANK.low).toBeLessThan(PRIORITY_RANK.medium);
    expect(PRIORITY_RANK.medium).toBeLessThan(PRIORITY_RANK.high);
    expect(PRIORITY_RANK.high).toBeLessThan(PRIORITY_RANK.critical);
  });

  test('открытые статусы — new и in_progress', () => {
    expect(OPEN_REQUEST_STATUSES).toEqual(['new', 'in_progress']);
  });
});