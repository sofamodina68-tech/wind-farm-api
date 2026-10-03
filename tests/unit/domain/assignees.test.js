import { test, expect, describe } from '@jest/globals';
import {
  ASSIGNEE_ROLES,
  ASSIGNMENT_RULES,
  validateAssignmentList,
} from '../../../src/domain/assignees.js';

describe('domain/assignees', () => {
  test('роли — lead и member', () => {
    expect(ASSIGNEE_ROLES).toEqual(['lead', 'member']);
  });

  test('правило: ровно один lead', () => {
    expect(ASSIGNMENT_RULES.exactlyOneLead).toBe(true);
  });

  test('валидный состав: один lead + один member', () => {
    const result = validateAssignmentList([
      { technicianId: 'a1111111-1111-1111-1111-111111111111', role: 'lead', hours: 8 },
      { technicianId: 'a2222222-2222-2222-2222-222222222222', role: 'member', hours: 6 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('невалидный: два lead', () => {
    const result = validateAssignmentList([
      { technicianId: 'a1111111-1111-1111-1111-111111111111', role: 'lead', hours: 8 },
      { technicianId: 'a2222222-2222-2222-2222-222222222222', role: 'lead', hours: 6 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('ровно один'))).toBe(true);
  });

  test('невалидный: без lead', () => {
    const result = validateAssignmentList([
      { technicianId: 'a1111111-1111-1111-1111-111111111111', role: 'member', hours: 8 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('ровно один'))).toBe(true);
  });

  test('невалидный: пустой список', () => {
    const result = validateAssignmentList([]);
    expect(result.valid).toBe(false);
  });

  test('невалидный: дубликат technicianId', () => {
    const result = validateAssignmentList([
      { technicianId: 'a1111111-1111-1111-1111-111111111111', role: 'lead', hours: 8 },
      { technicianId: 'a1111111-1111-1111-1111-111111111111', role: 'member', hours: 6 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('дважды'))).toBe(true);
  });

  test('невалидный: hours отрицательные', () => {
    const result = validateAssignmentList([
      { technicianId: 'a1111111-1111-1111-1111-111111111111', role: 'lead', hours: -1 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Часы'))).toBe(true);
  });
});