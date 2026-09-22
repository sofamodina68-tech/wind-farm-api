export const REQUEST_STATUSES = ['new', 'in_progress', 'done', 'rejected'];
export const REQUEST_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const STATUS_TRANSITIONS = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

export const PRIORITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const OPEN_REQUEST_STATUSES = ['new', 'in_progress'];