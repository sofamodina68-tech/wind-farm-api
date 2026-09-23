export const ASSIGNEE_ROLES = ['lead', 'member'];

export const ASSIGNMENT_RULES = {
  exactlyOneLead: true,
  minMembers: 0,
  maxTotal: 20,
};

export function validateAssignmentList(list) {
  const errors = [];

  if (!Array.isArray(list) || list.length === 0) {
    errors.push({
      field: 'technicians',
      message: 'Список бригады не может быть пустым',
    });
    return { valid: false, errors };
  }

  if (list.length > ASSIGNMENT_RULES.maxTotal) {
    errors.push({
      field: 'technicians',
      message: `Максимум ${ASSIGNMENT_RULES.maxTotal} специалистов в бригаде`,
    });
  }

  const leads = list.filter((t) => t.role === 'lead');
  if (ASSIGNMENT_RULES.exactlyOneLead && leads.length !== 1) {
    errors.push({
      field: 'technicians',
      message: 'В бригаде должен быть ровно один специалист с ролью lead',
    });
  }

  const ids = list.map((t) => t.technicianId);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    errors.push({
      field: 'technicians',
      message: 'Один и тот же специалист не может быть в бригаде дважды',
    });
  }

  for (let i = 0; i < list.length; i++) {
    if (!ASSIGNEE_ROLES.includes(list[i].role)) {
      errors.push({
        field: `technicians[${i}].role`,
        message: `Недопустимая роль: ${list[i].role}`,
      });
    }
    if (
      typeof list[i].hours !== 'number' ||
      list[i].hours < 0 ||
      list[i].hours > 1000
    ) {
      errors.push({
        field: `technicians[${i}].hours`,
        message: 'Часы должны быть числом от 0 до 1000',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}