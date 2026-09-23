import { QueryTypes } from 'sequelize';
import { Site, sequelize } from '../../models/index.js';
import { NotFoundError } from '../errors/AppError.js';

/**
 * Сводка по площадке: количество заявок по статусам и приоритетам,
 * среднее время закрытия (в часах).
 * Реализовано на чистом SQL (replacements — защита от инъекций),
 * чтобы явно контролировать имена таблиц и не ловить ошибки
 * "ambiguous column reference" при JOIN-ах.
 */
async function getSiteSummary(siteId) {
  const site = await Site.findByPk(siteId, {
    attributes: ['id', 'name', 'code', 'region'],
  });
  if (!site) {
    throw new NotFoundError('Площадка не найдена');
  }

  const byStatusRows = await sequelize.query(
    `
    SELECT mr.status, COUNT(*)::int AS count
    FROM maintenance_requests mr
    JOIN equipment e ON e.id = mr.equipment_id
    WHERE e.site_id = :siteId
    GROUP BY mr.status
    `,
    { replacements: { siteId }, type: QueryTypes.SELECT },
  );

  const byPriorityRows = await sequelize.query(
    `
    SELECT mr.priority, COUNT(*)::int AS count
    FROM maintenance_requests mr
    JOIN equipment e ON e.id = mr.equipment_id
    WHERE e.site_id = :siteId
    GROUP BY mr.priority
    `,
    { replacements: { siteId }, type: QueryTypes.SELECT },
  );

  const [avgRow] = await sequelize.query(
    `
    SELECT
      AVG(EXTRACT(EPOCH FROM (mr.updated_at - mr.created_at)) / 3600) AS avg_hours
    FROM maintenance_requests mr
    JOIN equipment e ON e.id = mr.equipment_id
    WHERE e.site_id = :siteId
      AND mr.status = 'done'
    `,
    { replacements: { siteId }, type: QueryTypes.SELECT },
  );

  const byStatus = byStatusRows.reduce((acc, row) => {
    acc[row.status] = Number(row.count);
    return acc;
  }, {});

  const byPriority = byPriorityRows.reduce((acc, row) => {
    acc[row.priority] = Number(row.count);
    return acc;
  }, {});

  const avgCloseHours =
    avgRow?.avg_hours != null ? Number(avgRow.avg_hours) : null;

  const total = Object.values(byStatus).reduce((s, n) => s + n, 0);

  return {
    site: site.toJSON(),
    totalRequests: total,
    byStatus,
    byPriority,
    avgCloseHours,
  };
}

/**
 * Отчёт по нагрузке на оборудование.
 * Чистый SQL через sequelize.query с replacements (bind).
 * Параметры: from, to, minRequests (фильтр групп через HAVING).
 */
async function getEquipmentLoad({ from, to, minRequests = 0 } = {}) {
  const fromDate = from ? new Date(from) : new Date('1970-01-01');
  const toDate = to ? new Date(to) : new Date('2100-01-01');
  const min = Number(minRequests) || 0;

  const rows = await sequelize.query(
    `
    SELECT
      e.id,
      e.name,
      e.serial_number,
      e.type,
      s.name AS site_name,
      COUNT(DISTINCT mr.id)::int AS total_requests,
      COUNT(DISTINCT mr.id) FILTER (WHERE mr.status = 'done')::int AS closed_requests,
      COALESCE(SUM(ra.hours), 0)::numeric AS total_planned_hours,
      MAX(ep.last_inspection_date) AS last_inspection_date
    FROM equipment e
    JOIN sites s ON s.id = e.site_id
    LEFT JOIN maintenance_requests mr
      ON mr.equipment_id = e.id
      AND mr.created_at BETWEEN :from AND :to
    LEFT JOIN request_assignees ra ON ra.request_id = mr.id
    LEFT JOIN equipment_passports ep ON ep.equipment_id = e.id
    GROUP BY e.id, e.name, e.serial_number, e.type, s.name
    HAVING COUNT(DISTINCT mr.id) >= :minRequests
    ORDER BY total_requests DESC, e.name ASC
    `,
    {
      replacements: {
        from: fromDate,
        to: toDate,
        minRequests: min,
      },
      type: QueryTypes.SELECT,
    },
  );

  return rows.map((r) => ({
    equipmentId: r.id,
    name: r.name,
    serialNumber: r.serial_number,
    type: r.type,
    siteName: r.site_name,
    totalRequests: Number(r.total_requests),
    closedRequests: Number(r.closed_requests),
    totalPlannedHours: Number(r.total_planned_hours),
    lastInspectionDate: r.last_inspection_date,
  }));
}

export const reportsService = {
  getSiteSummary,
  getEquipmentLoad,
};