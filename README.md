# Wind Farm API

REST API на Express для учёта заявок на техническое обслуживание оборудования
производственной площадки (ветропарка). Сервис ведёт справочники площадок,
оборудования, технических паспортов и специалистов, контролирует жизненный
цикл заявок, позволяет оценить погодные условия на объекте перед планированием
наружных работ и предоставляет метрики для мониторинга.

Данные хранятся в **PostgreSQL**, доступ к ним изолирован за слоем
репозиториев на Sequelize. Стек разворачивается через **Docker Compose** за
обратным прокси **Nginx**. Мониторинг — **Prometheus + Grafana**.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура](#архитектура)
- [Требования к окружению](#требования-к-окружению)
- [Быстрый старт с нуля](#быстрый-старт-с-нуля)
- [Повторное развёртывание](#повторное-развёртывание)
- [Переменные окружения](#переменные-окружения)
- [Роли и права](#роли-и-права)
- [Аутентификация](#аутентификация)
- [Мониторинг](#мониторинг)
- [Тестирование](#тестирование)
- [Эксплуатация](#эксплуатация)
- [API](#api)
- [Схема базы данных](#схема-базы-данных)
- [Формат ответов](#формат-ответов)
- [HTTP-коды](#http-коды)
- [Транзакции](#транзакции)
- [Структура проекта](#структура-проекта)
- [Известные ограничения](#известные-ограничения)
- [Лицензия](#лицензия)

---

## Стек технологий

- **Node.js 20+** (ESM, встроенный `fetch`)
- **Express 4** — HTTP-сервер
- **Sequelize 6** — ORM, миграции, сиды
- **PostgreSQL 16** — база данных
- **Joi** — валидация входных данных
- **JWT (`jsonwebtoken`) + `bcrypt`** — аутентификация
- **Helmet, CORS, express-rate-limit** — безопасность
- **pino + pino-http** — структурированное логирование
- **prom-client** — метрики для Prometheus
- **Prometheus + Grafana** — мониторинг
- **Nginx** — обратный прокси
- **Jest + Supertest** — тесты
- **Docker Compose** — оркестрация
- **swagger-jsdoc + swagger-ui-express** — OpenAPI-документация
- **Postman** — коллекция для ручного тестирования

---

## Архитектура

```
клиент
  │
  ▼
┌─────────┐    proxy_pass    ┌──────────────┐
│  nginx  │ ───────────────▶ │  api (node)  │
│  :80    │                  │  :3000       │
└────┬────┘                  └──────┬───────┘
     │                              │
     │ /grafana/                    │ /metrics
     ▼                              ▼
┌─────────┐                  ┌──────────────┐
│ grafana │ ◀── datasource ──│  prometheus  │
│  :3000  │                  │  :9090       │
└────┬────┘                  └──────────────┘
     │
     │ datasource
     ▼
┌──────────────┐
│  postgres    │
│  :5432       │
└──────────────┘
```

Слоистая архитектура приложения:

```
routes → controllers → services → repositories → Sequelize → PostgreSQL
```

- **routes** — маршруты и валидация.
- **controllers** — тонкие: берут `req.validated`, вызывают сервис, отдают ответ.
- **services** — бизнес-логика, транзакции, вызовы внешнего API.
- **repositories** — единственное место, где выполняются SQL-запросы через Sequelize.

---

## Требования к окружению

- Node.js >= 20
- Docker Desktop + Docker Compose
- npm

---

## Быстрый старт с нуля

```bash
# 1. Клонировать репозиторий
git clone https://github.com/sofamodina68-tech/wind-farm-api.git
cd wind-farm-api

# 2. Скопировать .env.example в .env
cp .env.example .env        # Linux / macOS
copy .env.example .env      # Windows (cmd)

# 3. Собрать и поднять весь стек одной командой
docker compose up -d --build

# 4. Дождаться статуса healthy у db и api
docker compose ps

# 5. Применить миграции и сиды (одноразовый шаг развёртывания)
docker compose run --rm migrate
```

После этого доступны:

- **API**: `http://localhost/api/...`
- **Swagger UI**: `http://localhost/api/docs/`
- **Grafana**: `http://localhost/grafana/` (логин/пароль из `.env`)
- **Prometheus**: только внутри Docker-сети

### Проверка работоспособности

```bash
curl http://localhost/api/health/live
# → { "status": "ok" }

curl http://localhost/api/health/ready
# → { "status": "ok", "db": "ok" }

curl -I http://localhost/api/docs/
# → HTTP/1.1 200 OK
```

---

## Повторное развёртывание

Сервис `migrate` вынесен в отдельный профиль `init`, поэтому
`docker compose up -d` **не запускает его автоматически**. Это сделано
осознанно: миграции и сиды применяются **один раз** при развёртывании.

```bash
# Обычный перезапуск стека (без миграций)
docker compose down
docker compose up -d
```

### Если нужно применить миграции заново

Сиды **не идемпотентны** (используют уникальные значения `code`, `serial_number`,
`email`). Повторный `docker compose run --rm migrate` на уже наполненной БД
завершится с ошибкой уникальности.

Чтобы применить миграции и сиды заново, удалите том с БД:

```bash
docker compose down -v
docker compose up -d --build
docker compose run --rm migrate
```

> `docker compose down -v` удалит **все** тома проекта: `pgdata`,
> `grafana_data`, `prometheus_data`. Данные будут потеряны.

---

## Переменные окружения

Все настройки читаются из `.env`. Пример — в `.env.example`.
Для тестов — `.env.test.example` (копируется в `.env.test`).

### Общие

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3000` |
| `NODE_ENV` | Режим (`development` / `production` / `test`) | `development` |
| `LOG_LEVEL` | Уровень логирования pino | `info` |
| `CORS_ORIGINS` | Whitelist источников через запятую | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Окно rate limit, мс | `60000` |
| `RATE_LIMIT_MAX` | Максимум запросов за окно | `100` |
| `LOGIN_RATE_LIMIT_MAX` | Максимум попыток входа за 15 мин | `10` |

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

### Аутентификация

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `JWT_ACCESS_SECRET` | Секрет подписи access-токена | — |
| `JWT_ACCESS_EXPIRES_IN` | Срок жизни access-токена | `15m` |
| `JWT_REFRESH_SECRET` | Секрет подписи refresh-токена | — |
| `JWT_REFRESH_EXPIRES_IN` | Срок жизни refresh-токена | `7d` |
| `BCRYPT_ROUNDS` | Сложность хеширования пароля | `10` |
| `COOKIE_SECURE` | Флаг `Secure` для refresh-cookie | `false` |
| `COOKIE_SAME_SITE` | Флаг `SameSite` для refresh-cookie | `lax` |

### Погода

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `WEATHER_API_URL` | URL прогноза Open-Meteo | `https://api.open-meteo.com/v1/forecast` |
| `GEOCODING_API_URL` | URL геокодинга | `https://geocoding-api.open-meteo.com/v1/search` |
| `REQUEST_TIMEOUT_MS` | Таймаут внешних запросов, мс | `5000` |
| `WEATHER_MAX_WIND_MS` | Порог ветра, м/с | `10` |
| `WEATHER_MAX_PRECIP_MM` | Порог осадков, мм | `0` |
| `WEATHER_FORECAST_HOURS` | Горизонт прогноза, ч | `24` |

### Мониторинг

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `GRAFANA_ADMIN_USER` | Логин администратора Grafana | `admin` |
| `GRAFANA_ADMIN_PASSWORD` | Пароль администратора Grafana | `admin` |

---

## Роли и права

| Роль | Чтение | Создание/редактирование заявок | Смена статуса | Управление оборудованием | Назначение бригад | Удаление | Отчёты |
|---|---|---|---|---|---|---|---|
| `viewer` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `technician` | ✅ | ✅ | ✅ (только своих заявок) | ❌ | ❌ | ❌ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Регистрация по умолчанию выдаёт роль `viewer`.

---

## Аутентификация

### Регистрация

```bash
curl -X POST http://localhost/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'
```

Ответ `201`:

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "viewer",
    "technicianId": null
  }
}
```

### Вход

```bash
curl -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt
```

Ответ `200`:

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "uuid", "email": "user@example.com", "role": "viewer" }
  }
}
```

Refresh-токен устанавливается в cookie `refresh_token` с флагами
`HttpOnly`, `Secure` (в production), `SameSite=lax`.

### Использование токена

```bash
curl http://localhost/api/equipment \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Обновление access-токена

```bash
curl -X POST http://localhost/api/auth/refresh -b cookies.txt
```

### Выход

```bash
curl -X POST http://localhost/api/auth/logout -b cookies.txt
```

**Почему `SameSite=lax`:** API не используется как сторонний ресурс на
других сайтах, а `lax` защищает от CSRF при переходах по ссылкам с
внешних сайтов. В production при HTTPS рекомендуется `SameSite=strict`
и `COOKIE_SECURE=true`.

---

## Мониторинг

### Доступ к Grafana

- URL: `http://localhost/grafana/`
- Логин/пароль: из `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`
- Дашборд: **WindFarm Dashboard** (provisioning, появляется автоматически)

### Панели дашборда

**Технические (Prometheus):**
- RPS — запросов в секунду
- Доля 4xx и 5xx
- Время ответа p95
- Доступность сервиса (`up{job="windfarm-api"}`)

**Прикладные (PostgreSQL):**
- Заявки по статусам
- Среднее время закрытия заявки (часы)
- Нагрузка на оборудование (топ-10)

### Метрики приложения

Приложение отдаёт метрики на `GET /metrics` (Prometheus-формат):

- `http_requests_total{method,route,status}`
- `http_request_duration_seconds_bucket{method,route,status,le}`
- `http_errors_total{method,route,status}`
- `windfarm_*` — дефолтные метрики Node.js (CPU, память, event loop)

Доступ к `/metrics` ограничен на уровне Nginx (только приватные
подсети Docker и локальная сеть).

---

## Тестирование

### Запуск тестов

```bash
npm test              # все тесты
npm run test:coverage # с отчётом о покрытии
```

Тесты используют **отдельную тестовую БД** (`DB_NAME_test`), конфигурация
читается из `.env.test` (шаблон — в `.env.test.example`). Обращения к
внешнему погодному API подменяются моком в `tests/setup.js`.

### Что покрыто

- **Unit**: переходы статусов заявок, правила назначения бригады
  (ровно один `lead`), middleware аутентификации и авторизации.
- **Integration**: регистрация/вход/`/me`, CRUD оборудования с проверкой
  ролей (viewer → 403, admin → 201), 409 на дубль `serialNumber`,
  422 на невалидное тело.

### Структура тестов

```
tests/
  helpers/db.js          — connect/close/truncateAll
  unit/
    domain/
      assignees.test.js  — правила бригады
      requests.test.js   — переходы статусов
    middlewares/
      auth.test.js       — authenticate/authorize
  integration/
    auth.test.js         — register/login/me
    equipment.test.js    — CRUD + RBAC
  setup.js               — мок weather.service
  jest.setup.js          — beforeAll/afterAll для БД
```

---

## Эксплуатация

### Логи

Приложение пишет структурированные логи в stdout (pino). Каждая запись
содержит `reqId` (он же `X-Request-Id` в ответе), метод, путь, код
ответа и длительность.

```bash
docker compose logs -f api
```

Уровень задаётся `LOG_LEVEL` (`info` / `warn` / `error`).

### Типовые отказы и что делать

| Симптом | Где смотреть | Действие |
|---|---|---|
| `GET /api/health/ready` → 503 | `docker compose logs db` | Проверить, что контейнер `db` в статусе `healthy`; при необходимости `docker compose restart db` |
| Рост доли 5xx | Grafana → панель «Доля 4xx и 5xx» | Посмотреть логи `api`, найти `reqId` из ответа, воспроизвести запрос |
| Переполнение диска | `docker system df` | `docker system prune` (осторожно: удалит неиспользуемые образы/тома) |
| Медленные ответы (p95 > 1s) | Grafana → панель «Время ответа p95» | Проверить медленные SQL-запросы, индексы |
| БД недоступна при старте | `docker compose logs api` | Приложение не стартует молча — в логах будет ошибка подключения; проверить `DB_HOST`, `DB_PORT`, healthcheck `db` |

### Откат миграций

```bash
# Откатить все миграции
npm run db:migrate:undo:all

# Откатить все сиды
npm run db:seed:undo:all

# Применить заново
npm run db:migrate
npm run db:seed
```

> Эти команды требуют наличия `sequelize-cli` в окружении.
> В production-контейнере `api` его нет (используется `npm ci --omit=dev`).
> Запускайте миграции через сервис `migrate` или локально на хосте.

---

## API

Полная интерактивная документация — **Swagger UI**: `http://localhost/api/docs/`.

### Auth

| Метод | Путь | Доступ |
|---|---|---|
| POST | `/api/auth/register` | публичный |
| POST | `/api/auth/login` | публичный + rate limit |
| POST | `/api/auth/refresh` | публичный (по cookie) |
| POST | `/api/auth/logout` | публичный |
| GET | `/api/auth/me` | аутентифицированный |

### Health и метрики

| Метод | Путь | Доступ |
|---|---|---|
| GET | `/api/health/live` | публичный |
| GET | `/api/health/ready` | публичный |
| GET | `/metrics` | ограничен Nginx по IP |

### Equipment

| Метод | Путь | Доступ |
|---|---|---|
| GET | `/api/equipment` | аутентифицированный |
| GET | `/api/equipment/:id` | аутентифицированный |
| GET | `/api/equipment/:id/requests` | аутентифицированный |
| GET | `/api/equipment/:id/weather` | аутентифицированный |
| POST | `/api/equipment` | admin |
| PATCH | `/api/equipment/:id` | admin |
| DELETE | `/api/equipment/:id` | admin |

### Requests

| Метод | Путь | Доступ |
|---|---|---|
| GET | `/api/requests` | аутентифицированный |
| GET | `/api/requests/:id` | аутентифицированный |
| GET | `/api/requests/:id/history` | аутентифицированный |
| POST | `/api/requests` | technician / admin |
| PATCH | `/api/requests/:id` | technician / admin |
| PATCH | `/api/requests/:id/status` | technician / admin |
| DELETE | `/api/requests/:id` | admin |

### Assignees

| Метод | Путь | Доступ |
|---|---|---|
| GET | `/api/requests/:id/assignees` | admin |
| POST | `/api/requests/:id/assignees` | admin |
| DELETE | `/api/requests/:id/assignees/:userId` | admin |

### Sites и отчёты

| Метод | Путь | Доступ |
|---|---|---|
| GET | `/api/sites/:id/summary` | аутентифицированный |
| GET | `/api/reports/equipment-load` | admin |

---

## Схема базы данных

### ER-диаграмма

```
                ┌─────────────┐
                │   sites     │
                └──────┬──────┘
                       │ 1:N
                ┌──────┴──────────┐
                │   equipment     │
                └──┬─────────┬────┘
                   │ 1:1     │ 1:N
        ┌──────────┴───┐  ┌──┴─────────────────────┐
        │ equipment_   │  │ maintenance_requests   │
        │ passports    │  └──┬───────────────┬────┘
        └──────────────┘     │ 1:N           │ 1:N
                  ┌──────────┴──────┐  ┌─────┴────────────┐
                  │ request_status_ │  │ request_assignees│
                  │ history         │  │ (N:M)            │
                  └─────────────────┘  └──────┬───────────┘
                                              │ N:1
                                       ┌──────┴──────────┐
                                       │  technicians    │
                                       └─────────────────┘
```

### Обоснование 3НФ

- Справочные значения вынесены в отдельные таблицы (`sites`, `technicians`, `equipment`).
- Все неключевые поля зависят только от первичного ключа.
- Связь N:M реализована через `request_assignees` с атрибутами `role`, `hours`.
- Связь 1:1 `equipment ↔ equipment_passports` обеспечена уникальным FK.

### Правила ON DELETE / ON UPDATE

| Связь | ON DELETE | ON UPDATE |
|---|---|---|
| `equipment.site_id → sites.id` | `RESTRICT` | `CASCADE` |
| `equipment_passports.equipment_id → equipment.id` | `CASCADE` | `CASCADE` |
| `maintenance_requests.equipment_id → equipment.id` | `RESTRICT` | `CASCADE` |
| `request_status_history.request_id → maintenance_requests.id` | `CASCADE` | `CASCADE` |
| `request_assignees.request_id → maintenance_requests.id` | `CASCADE` | `CASCADE` |
| `request_assignees.technician_id → technicians.id` | `RESTRICT` | `CASCADE` |

### Переходы статусов заявки

```
new ──► in_progress ──► done
 │            │
 └──► rejected ◄───────┘
```

Любой другой переход → **409**. Переход в `in_progress` запрещён, если
у заявки нет назначенной бригады (409).

---

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

---

## HTTP-коды

| Код | Когда |
|---|---|
| 200 | Успех |
| 201 | Создано (+ `Location`) |
| 204 | Удалено (без тела) |
| 400 | Битый JSON, невалидный UUID, ошибка в query |
| 401 | Нет токена / недействительный токен |
| 403 | Недостаточно прав / CORS |
| 404 | Ресурс не найден / нарушение FK |
| 409 | Дублирование, недопустимый переход, удаление связанных данных |
| 413 | Тело запроса больше 100 KB |
| 422 | Данные тела не проходят правила |
| 429 | Rate limit |
| 502 | Внешний сервис недоступен |
| 504 | Таймаут внешнего сервиса |

---

## Транзакции

### Смена статуса заявки

1. Открывается транзакция.
2. Строка заявки блокируется (`SELECT ... FOR UPDATE`).
3. Проверяется допустимость перехода.
4. Проверяется наличие бригады при переходе в `in_progress`.
5. Обновляется заявка.
6. Создаётся запись в `request_status_history`.
7. Коммит. При ошибке — rollback.

### Назначение бригады

1. Валидация бизнес-правил (ровно один `lead`) до транзакции.
2. Проверка существования заявки и специалистов.
3. Транзакция: удаление старых назначений + вставка новых.
4. При ошибке — rollback.

---

## Структура проекта

```
src/
  app.js                — сборка Express-приложения (createApp)
  server.js             — запуск сервера
  config/               — чтение env, логгер, Swagger
  domain/               — константы (статусы, переходы, роли, правила)
  errors/               — классы ошибок (AppError, NotFoundError, ...)
  metrics/              — реестр prom-client
  middlewares/          — requestId, logger, validate, auth, metrics, notFound, errorHandler
  repositories/         — доступ к данным через Sequelize
  services/             — бизнес-логика (equipment, requests, assignees, reports, weather, auth)
  controllers/          — обработчики HTTP
  routes/               — Express-роутеры (включая docs.routes.js)
  validators/           — Joi-схемы
  utils/                — asyncHandler

models/                 — Sequelize-модели + ассоциации
migrations/             — миграции (CJS)
seeders/                — сиды (CJS)
config/                 — конфиг для Sequelize CLI
deploy/
  nginx/nginx.conf      — конфиг обратного прокси
  prometheus/           — конфиг сбора метрик
  grafana/
    provisioning/       — datasource и dashboard provisioning
    dashboards/         — JSON-описание дашборда
docs/postman/           — экспортированная коллекция
tests/                  — Jest + Supertest
docker-compose.yml      — весь стек одной командой
Dockerfile              — multi-stage сборка
```

---

## Известные ограничения

- **HTTPS не настроен.** Nginx слушает только порт 80. В production требуется
  терминация TLS на Nginx или внешнем балансировщике.
- **CI не настроен.** Линтер, тесты и сборка образа не запускаются автоматически
  на Pull Request.
- **Alert в Grafana не настроен.** Панели дашборда работают, но правила
  оповещения (alert rules) не добавлены.
- **Сиды не идемпотентны.** Повторный `docker compose run --rm migrate` на
  уже наполненной БД упадёт из-за уникальных ограничений. Для повторного
  применения используйте `docker compose down -v`.
- **Перенос данных из JSON Кейса 2 не реализован** как отдельный скрипт —
  сиды наполняют БД с нуля.
- **Дата последнего обслуживания** в отчёте `equipment-load` берётся из
  паспорта (`last_inspection_date`), а не из истории заявок. Это осознанное
  решение для Кейса 3; при необходимости легко заменить на
  `MAX(request_status_history.changed_at)`.
- **Сервисы частично обращаются к моделям напрямую**, минуя слой
  репозиториев, в местах, где это исторически сложилось. Новый код
  (auth, metrics, docs) использует репозитории и middleware.

---

## Лицензия

MIT