import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Wind Farm API',
      version: '1.0.0',
      description:
        'REST API для учёта заявок на техническое обслуживание оборудования ' +
        'ветропарка. Включает JWT-аутентификацию, ролевую модель, ' +
        'погодный прогноз, аналитические отчёты и метрики Prometheus.',
    },
    servers: [
      { url: '/api', description: 'Через Nginx (относительный путь)' },
      { url: 'http://localhost:3000/api', description: 'Напрямую (dev)' },
    ],
    tags: [
      { name: 'Auth', description: 'Регистрация, вход, обновление токена' },
      { name: 'Health', description: 'Проверки жизнеспособности и готовности' },
      { name: 'Equipment', description: 'Справочник оборудования' },
      { name: 'Requests', description: 'Заявки на обслуживание' },
      { name: 'Assignees', description: 'Назначение бригады' },
      { name: 'Sites', description: 'Сводка по площадке' },
      { name: 'Reports', description: 'Аналитические отчёты' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Некорректные данные запроса' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string', example: 'priority' },
                      message: { type: 'string', example: 'Недопустимое значение' },
                    },
                  },
                },
                requestId: { type: 'string', example: 'a1b2c3d4' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['viewer', 'technician', 'admin'] },
            technicianId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        Equipment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            siteId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['turbine', 'inverter', 'sensor', 'substation'] },
            serialNumber: { type: 'string' },
            status: {
              type: 'string',
              enum: ['operational', 'maintenance', 'fault', 'decommissioned'],
            },
            installedAt: { type: 'string', format: 'date-time' },
          },
        },
        MaintenanceRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            equipmentId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            status: { type: 'string', enum: ['new', 'in_progress', 'done', 'rejected'] },
            plannedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);