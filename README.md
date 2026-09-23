# Wind Farm API

REST API на Express для учёта заявок на техническое обслуживание оборудования производственной площадки (ветропарка). Сервис ведёт справочники площадок, оборудования, технических паспортов и специалистов, контролирует жизненный цикл заявок и позволяет оценить погодные условия на объекте перед планированием наружных работ.

Данные хранятся в **PostgreSQL** (Docker Compose), доступ к ним изолирован за слоем репозиториев на Sequelize.

## Стек технологий

- **Node.js 20+** (ESM, встроенный `fetch`)
- **Express** — HTTP-сервер
- **Sequelize 6** — ORM, миграции, сиды
- **PostgreSQL 16** — база данных, запускается через **Docker Compose**
- **Joi** — валидация входных данных
- **Helmet, CORS, express-rate-limit** — безопасность
- **Postman** — коллекция для тестирования

## Требования к окружению

- Node.js >= 20
- Docker Desktop (для PostgreSQL)
- npm

## Быстрый старт с нуля

```bash
# 1. Клонировать репозиторий
git clone https://github.com/sofamodina68-tech/wind-farm-api.git
cd wind-farm-api

# 2. Установить зависимости
npm install

# 3. Скопировать .env.example в .env
cp .env.example .env        # Linux / macOS
copy .env.example .env      # Windows (cmd)

# 4. Поднять PostgreSQL через Docker Compose
docker compose up -d
docker compose ps            # дождаться статуса healthy

# 5. Применить миграции
npm run db:migrate

# 6. Наполнить БД тестовыми данными (сиды)
npm run db:seed

# 7. Запустить сервер
npm start
```

Сервер стартует на `http://localhost:3000`.

### Проверка работоспособности

```bash
curl http://localhost:3000/api/health
```

Ожидаемый ответ:
```json
{ "status": "ok", "requestId": "xxxxxxxx" }
```

## Порядок отката и повторного применения

```bash
# Откатить все миграции
npm run db:migrate:undo:all

# Откатить все сиды
npm run db:seed:undo:all

# Применить заново
npm run db:migrate
npm run db:seed
```

Для полной очистки (включая том PostgreSQL):

```bash
docker compose down -v
```

## Переменные окружения

Все настройки читаются из `.env`. Пример — в `.env.example`.

### Общие

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3000` |
| `NODE_ENV` | Режим (`development` / `production`) | `development` |
| `CORS_ORIGINS` | Whitelist источников через запятую | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Окно rate limit, мс | `60000` |
| `RATE_LIMIT_MAX` | Максимум запросов за окно | `100` |

### База данных

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `DB_HOST` | Хост PostgreSQL | `localhost` |
| `DB_PORT` | Порт | `5432` |
| `DB_NAME` | Имя БД | `wind_farm` |
| `DB_USER` | Пользователь | `wind_farm` |
| `DB_PASSWORD` | Пароль | — |
| `DB_POOL_MIN` | Минимум соединений в пуле | `0` |
| `DB_POOL_MAX` | Максимум соединений в пуле | `10` |

### Погода

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `WEATHER_API_URL` | URL прогноза Open-Meteo | `https://api.open-meteo.com/v1/forecast` |
| `GEOCODING_API_URL` | URL геокодинга | `https://geocoding-api.open-meteo.com/v1/search` |
| `REQUEST_TIMEOUT_MS` | Таймаут внешних запросов, мс | `5000` |
| `WEATHER_MAX_WIND_MS` | Порог ветра, м/с | `10` |
| `WEATHER_MAX_PRECIP_MM` | Порог осадков, мм | `0` |
| `WEATHER_FORECAST_HOURS` | Горизонт прогноза, ч | `24` |

## Схема базы данных

### ER-диаграмма

```
                ┌─────────────┐
                │   sites     │
                │ ─────────── │
                │ id (PK)     │
                │ name        │
                │ code (UQ)   │
                │ region      │
                │ lat, lon    │
                └──────┬──────┘
                       │ 1
                       │
                       │ N
                ┌──────┴──────────┐
                │   equipment     │
                │ ─────────────── │
                │ id (PK)         │
                │ site_id (FK)    │
                │ name            │
                │ type (ENUM)     │
                │ serial_number   │
                │ status (ENUM)   │
                │ installed_at    │
                └──┬─────────┬────┘
                   │ 1       │ 1
                   │         │
                   │ 1       │ N
        ┌──────────┴───┐  ┌──┴─────────────────────┐
        │ equipment_   │  │ maintenance_requests   │
        │ passports    │  │ ───────────────────── │
        │ ──────────── │  │ id (PK)               │
        │ id (PK)      │  │ equipment_id (FK)     │
        │ equipment_id │  │ title                 │
        │  (UQ → 1:1)  │  │ description           │
        │ manufacturer │  │ priority (ENUM)       │
        │ model        │  │ status (ENUM)         │
        │ rated_power  │  │ planned_at            │
        │ last_insp    │  │ created_at, updated_at│
        └──────────────┘  └──┬───────────────┬────┘
                             │ 1             │ 1
                             │               │
                             │ N             │ N
                  ┌──────────┴──────┐  ┌─────┴────────────┐
                  │ request_status_ │  │ request_assignees│
                  │ history         │  │ ──────────────── │
                  │ ─────────────── │  │ id (PK)          │
                  │ id (PK)         │  │ request_id (FK)  │
                  │ request_id (FK) │  │ technician_id(FK)│
                  │ from_status     │  │ role (ENUM)      │
                  │ to_status       │  │ hours            │
                  │ changed_by      │  │ UQ(req_id,tech_id│
                  │ changed_at      │  └──────┬───────────┘
                  └─────────────────┘         │ N
                                              │
                                              │ 1
                                       ┌──────┴──────────┐
                                       │  technicians    │
                                       │ ─────────────── │
                                       │ id (PK)         │
                                       │ full_name       │
                                       │ specialization  │
                                       │ employee_number │
                                       └─────────────────┘
```

### Обоснование 3НФ

- **Справочные значения вынесены в отдельные таблицы**: площадки (`sites`), специалисты (`technicians`), оборудование (`equipment`). Нет дублирования названий, регионов, ФИО.
- **Все неключевые поля зависят только от первичного ключа** — нет транзитивных зависимостей.
- **Связь N:M** между заявками и специалистами реализована через связующую таблицу `request_assignees`, в которой хранятся **дополнительные поля** (`role`, `hours`) — классическая реализация N:M с атрибутами.
- **Связь 1:1** `equipment ↔ equipment_passports` обеспечена уникальным внешним ключом `equipment_id` в таблице паспортов.

### Правила ON DELETE / ON UPDATE

| Связь | ON DELETE | ON UPDATE | Почему |
|---|---|---|---|
| `equipment.site_id → sites.id` | `RESTRICT` | `CASCADE` | Нельзя удалить площадку, пока на ней есть оборудование |
| `equipment_passports.equipment_id → equipment.id` | `CASCADE` | `CASCADE` | Паспорт не имеет смысла без оборудования |
| `maintenance_requests.equipment_id → equipment.id` | `RESTRICT` | `CASCADE` | Нельзя удалить оборудование с заявками |
| `request_status_history.request_id → maintenance_requests.id` | `CASCADE` | `CASCADE` | История не имеет смысла без заявки |
| `request_assignees.request_id → maintenance_requests.id` | `CASCADE` | `CASCADE` | Назначения удаляются вместе с заявкой |
| `request_assignees.technician_id → technicians.id` | `RESTRICT` | `CASCADE` | Нельзя удалить специалиста, если он назначен на заявки |

## Модель данных

### Справочники

- **sites** — площадки: `id, name, code (unique), region, latitude, longitude`
- **technicians** — специалисты: `id, full_name, specialization, employee_number (unique)`

### Оборудование

- **equipment** — единицы: `id, site_id, name, type, serial_number (unique), status, installed_at`
- **equipment_passports** — паспорта (1:1): `id, equipment_id (unique), manufacturer, model, rated_power_kw, last_inspection_date`

### Заявки

- **maintenance_requests** — заявки: `id, equipment_id, title, description, priority, status, planned_at, created_at, updated_at`
- **request_status_history** — история статусов (1:N): `id, request_id, from_status, to_status, changed_by, comment, changed_at`
- **request_assignees** — назначения (N:M): `id, request_id, technician_id, role, hours` + `UNIQUE(request_id, technician_id)`

### Переходы статусов заявки

```
new ──► in_progress ──► done
 │            │
 └──► rejected ◄───────┘
```

Любой другой переход отклоняется с **409**. Переход в `in_progress` **запрещён**, если у заявки **нет назначенной бригады** (409).

## Эндпоинты

### Health

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | Проверка доступности сервиса |

### Equipment

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/equipment` | Список с фильтрами, сортировкой, пагинацией |
| POST | `/api/equipment` | Создание |
| GET | `/api/equipment/:id` | Карточка (с `site`, `passport`) |
| PATCH | `/api/equipment/:id` | Частичное обновление |
| DELETE | `/api/equipment/:id` | Удаление (запрещено при заявках) |
| GET | `/api/equipment/:id/requests` | Заявки по оборудованию |
| GET | `/api/equipment/:id/weather` | Прогноз и пригодность окна |

### Requests

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/requests` | Список с фильтрами |
| POST | `/api/requests` | Создание |
| GET | `/api/requests/:id` | Карточка (с `equipment`, `assignees`, `statusHistory`) |
| PATCH | `/api/requests/:id` | Редактирование полей |
| PATCH | `/api/requests/:id/status` | Смена статуса (транзакция + история) |
| DELETE | `/api/requests/:id` | Удаление |
| GET | `/api/requests/:id/history` | История статусов |
| GET | `/api/requests/:id/assignees` | Состав бригады |
| POST | `/api/requests/:id/assignees` | Назначение бригады |
| DELETE | `/api/requests/:id/assignees/:userId` | Снять специалиста |

### Sites

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/sites/:id/summary` | Сводка: количество по статусам, приоритетам, среднее время закрытия |

### Reports

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/reports/equipment-load` | Нагрузка по оборудованию (raw SQL) |

Query-параметры для `equipment-load`: `from`, `to` (даты), `minRequests` (число).

## Формат ответов

Один ресурс:
```json
{ "data": { ... } }
```

Список:
```json
{ "data": [ ... ], "meta": { "total": 5, "page": 1, "limit": 20 } }
```

Ошибка:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [ { "field": "priority", "message": "..." } ],
    "requestId": "a1b2c3d4"
  }
}
```

## HTTP-коды

| Код | Когда |
|---|---|
| 200 | Успех |
| 201 | Создано (+ заголовок `Location`) |
| 204 | Удалено (без тела) |
| 400 | Битый JSON, невалидный UUID, ошибка в query |
| 404 | Ресурс не найден / нарушение FK |
| 409 | Дублирование, недопустимый переход, удаление связанных данных |
| 413 | Тело запроса больше 100 KB |
| 422 | Данные тела не проходят правила |
| 429 | Rate limit |
| 502 | Внешний сервис недоступен |
| 504 | Таймаут внешнего сервиса |

## Транзакции

### Смена статуса заявки (`PATCH /api/requests/:id/status`)

1. Открывается транзакция (`sequelize.transaction`).
2. Строка заявки **блокируется** (`SELECT ... FOR UPDATE`).
3. Проверяется текущий статус и допустимость перехода.
4. Проверяется наличие бригады при переходе в `in_progress`.
5. Обновляется заявка.
6. Создаётся запись в `request_status_history`.
7. Транзакция коммитится. При ошибке — **rollback**, БД остаётся в прежнем состоянии.

### Назначение бригады (`POST /api/requests/:id/assignees`)

1. Валидация бизнес-правил (ровно один `lead`) **до** транзакции.
2. Проверка существования заявки и специалистов.
3. Транзакция: **удаление старых назначений** + **вставка новых**.
4. При ошибке — **rollback**, старые назначения не теряются.

## Аналитические отчёты

### Сводка по площадке (`GET /api/sites/:id/summary`)

Возвращает:
- `totalRequests` — всего заявок на оборудовании площадки
- `byStatus` — количество по статусам (`new`, `in_progress`, `done`, `rejected`)
- `byPriority` — количество по приоритетам
- `avgCloseHours` — среднее время от создания до закрытия (для заявок `done`), в часах

Реализовано через **raw SQL** с агрегатами и `GROUP BY`.

### Отчёт по нагрузке (`GET /api/reports/equipment-load`)

Возвращает по каждой единице оборудования:
- `totalRequests` — всего заявок
- `closedRequests` — закрытых заявок
- `totalPlannedHours` — суммарные плановые трудозатраты (часы)
- `lastInspectionDate` — дата последней поверки (из паспорта)

Поддерживает параметры:
- `from`, `to` — период по дате создания заявки
- `minRequests` — минимальное число заявок (фильтр групп через `HAVING`)

Реализовано через **raw SQL** (`JOIN`, `GROUP BY`, `HAVING`, `COUNT FILTER`) с параметрами привязки (`replacements`).

## Безопасность

- **CORS**: whitelist из `CORS_ORIGINS`, не `*`.
- **Helmet**: защитные HTTP-заголовки.
- **Rate limit**: на `/api`, окно и лимит из env. При превышении — **429** с заголовками `RateLimit-*`.
- **Размер тела**: JSON ограничен 100 KB, при превышении — **413**.
- **SQL-инъекции**: все прямые SQL-запросы используют **bind-параметры** (`replacements`). Поля сортировки проверяются по **белому списку** (нельзя подставить `ORDER BY` из query).
- **Cookie не используются** — API stateless.

## Логирование

Каждый запрос логируется с указанием метода, пути, кода ответа, длительности и `requestId`. Уровни:
- `info` — успешные запросы
- `warn` — 4xx
- `error` — 5xx

`requestId` возвращается в теле ошибок и в заголовке `X-Request-Id`.

## Структура проекта

```
src/
  app.js                — сборка Express-приложения (createApp)
  server.js             — запуск сервера
  config/               — чтение env
  domain/               — константы (статусы, переходы, роли, правила)
  errors/               — классы ошибок (AppError, NotFoundError, ...)
  middlewares/          — requestId, logger, validate, notFound, errorHandler
  repositories/         — доступ к данным через Sequelize
  services/             — бизнес-логика (equipment, requests, assignees, reports, weather)
  controllers/          — обработчики HTTP
  routes/               — Express-роутеры
  validators/           — Joi-схемы
  utils/                — asyncHandler

models/                 — Sequelize-модели + ассоциации
migrations/             — миграции (CJS)
seeders/                — сиды (CJS)
config/                 — конфиг для Sequelize CLI
docs/postman/           — экспортированная коллекция
docker-compose.yml      — PostgreSQL 16 + healthcheck + том
```

## Слоистая архитектура

```
routes → controllers → services → repositories → Sequelize → PostgreSQL
```

- **routes** — маршруты и валидация.
- **controllers** — тонкие: берут `req.validated`, вызывают сервис, отдают ответ.
- **services** — бизнес-логика, транзакции, вызовы внешнего API.
- **repositories** — единственное место, где выполняются SQL-запросы через Sequelize.

## Тестирование в Postman

Коллекция лежит в `docs/postman/wind-farm-api.postman_collection.json`. Импортируется через **File → Import**.

Содержит папки:
- **Health**
- **Equipment**
- **Requests**
- **Negative extra** (400, 413)
- **Assignees & Reports** — новые эндпоинты
- **Wind Farm API** — корневые запросы

Все запросы содержат тесты `pm.test` на код ответа и структуру.

## Лицензия

MIT