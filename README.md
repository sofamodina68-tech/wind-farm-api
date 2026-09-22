# Wind Farm API

REST API на Express для учёта заявок на техническое обслуживание оборудования производственной площадки (ветропарка). Сервис ведёт справочник оборудования и заявок на его обслуживание, контролирует жизненный цикл заявки и позволяет оценить погодные условия на объекте перед планированием наружных работ.

Данные на текущий момент хранятся в JSON-файлах в папке `data/`, доступ к ним изолирован за слоем репозиториев — замена хранилища на PostgreSQL не потребует изменений в сервисах и контроллерах.

## Требования

- Node.js **20+** (используется встроенный `fetch`, `--env-file`)
- npm

## Установка

```bash
git clone https://github.com/sofamodina68-tech/wind-farm-api.git
cd wind-farm-api
npm install
cp .env.example .env
```

## Переменные окружения

Все настройки читаются из `.env`. Пример лежит в `.env.example`.

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3000` |
| `NODE_ENV` | Режим работы (`development` / `production`) | `development` |
| `CORS_ORIGINS` | Whitelist источников через запятую | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Окно rate limit, мс | `60000` |
| `RATE_LIMIT_MAX` | Максимум запросов за окно | `100` |
| `WEATHER_API_URL` | URL прогноза Open-Meteo | `https://api.open-meteo.com/v1/forecast` |
| `GEOCODING_API_URL` | URL геокодинга Open-Meteo | `https://geocoding-api.open-meteo.com/v1/search` |
| `REQUEST_TIMEOUT_MS` | Таймаут внешних запросов, мс | `5000` |
| `WEATHER_MAX_WIND_MS` | Порог ветра, м/с | `10` |
| `WEATHER_MAX_PRECIP_MM` | Порог осадков, мм | `0` |
| `WEATHER_FORECAST_HOURS` | Горизонт прогноза по умолчанию, ч | `24` |

## Запуск

```bash
npm start
```

Сервер стартует на `http://localhost:3000`.

### Проверка работоспособности

```bash
curl http://localhost:3000/api/health
```

Ответ:
```json
{ "status": "ok", "requestId": "xxxxxxxx" }
```

## Модель данных

### Оборудование (Equipment)

| Поле | Тип | Описание |
|---|---|---|
| `id` | string (uuid) | Генерируется сервером |
| `name` | string | 3–100 символов |
| `type` | enum | `turbine` / `inverter` / `sensor` / `substation` |
| `serialNumber` | string | Уникальный в системе |
| `location` | object | `{ lat: -90..90, lon: -180..180 }` |
| `status` | enum | `operational` / `maintenance` / `fault` / `decommissioned` |
| `installedAt` | ISO date | Не в будущем |
| `createdAt`, `updatedAt` | ISO datetime | Проставляются сервером |

### Заявка (Maintenance Request)

| Поле | Тип | Описание |
|---|---|---|
| `id` | string (uuid) | Генерируется сервером |
| `equipmentId` | string (uuid) | Ссылка на существующее оборудование |
| `title` | string | 5–120 символов |
| `description` | string | До 2000 символов |
| `priority` | enum | `low` / `medium` / `high` / `critical` |
| `status` | enum | `new` / `in_progress` / `done` / `rejected` |
| `plannedAt` | ISO datetime | Опционально |
| `createdAt`, `updatedAt` | ISO datetime | Проставляются сервером |

### Переходы статусов заявки

```
new ──► in_progress ──► done
 │            │
 └──► rejected ◄───────┘
```

Любой другой переход отклоняется с **409 Conflict**.

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
| GET | `/api/equipment/:id` | Карточка |
| PATCH | `/api/equipment/:id` | Частичное обновление |
| DELETE | `/api/equipment/:id` | Удаление (запрещено при открытых заявках) |
| GET | `/api/equipment/:id/requests` | Заявки по оборудованию |
| GET | `/api/equipment/:id/weather` | Прогноз и пригодность окна для работ |

Query-параметры списка: `status`, `type`, `sort`, `order`, `page`, `limit`.

### Requests

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/requests` | Список с фильтрами, сортировкой, пагинацией |
| POST | `/api/requests` | Создание |
| GET | `/api/requests/:id` | Карточка |
| PATCH | `/api/requests/:id` | Редактирование полей |
| PATCH | `/api/requests/:id/status` | Смена статуса с проверкой переходов |
| DELETE | `/api/requests/:id` | Удаление |

Query-параметры списка: `equipmentId`, `status`, `priority`, `createdFrom`, `createdTo`, `plannedFrom`, `plannedTo`, `sort`, `order`, `page`, `limit`.

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

## Коды ответов

| Код | Когда |
|---|---|
| 200 | Успех |
| 201 | Создано (+ заголовок `Location`) |
| 204 | Удалено (без тела) |
| 400 | Битый JSON, невалидный UUID в path, ошибка в query |
| 404 | Ресурс не найден |
| 409 | Дубль `serialNumber`, недопустимый переход статуса, удаление с открытыми заявками |
| 413 | Тело запроса больше 100 KB |
| 422 | Данные тела не проходят правила |
| 429 | Превышен rate limit |
| 502 | Внешний сервис погоды недоступен |
| 504 | Таймаут внешнего сервиса погоды |

## Правило пригодности для наружных работ

Погодный сервис возвращает **почасовой** прогноз. Окно считается пригодным, если **все часы** удовлетворяют:

- ветер ≤ `WEATHER_MAX_WIND_MS` (по умолчанию 10 м/с)
- осадки = `WEATHER_MAX_PRECIP_MM` (по умолчанию 0 мм)

Ответ содержит `suitable`, `reasons`, `rules`, `forecast` (каждый час со своим `suitable` и `reasons`).

## Примеры

### Создание оборудования

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Turbine A1",
    "type": "turbine",
    "serialNumber": "SN-001",
    "location": { "lat": 55.75, "lon": 37.61 },
    "installedAt": "2024-01-15T00:00:00.000Z"
  }'
```

Ответ `201 Created`, заголовок `Location: /api/equipment/<uuid>`.

### Создание заявки

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": "<equipment-uuid>",
    "title": "Плановое ТО",
    "priority": "high",
    "plannedAt": "2026-10-01T10:00:00.000Z"
  }'
```

### Смена статуса

```bash
curl -X PATCH http://localhost:3000/api/requests/<id>/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'
```

Недопустимый переход → **409**.

### Прогноз погоды

```bash
curl "http://localhost:3000/api/equipment/<id>/weather?hours=6"
```

Ответ `200`:
```json
{
  "data": {
    "location": { "lat": 55.75, "lon": 37.61 },
    "hours": 6,
    "rules": { "maxWindMs": 10, "maxPrecipMm": 0 },
    "suitable": true,
    "reasons": [],
    "forecast": [ { "time": "...", "windSpeedMs": 3.2, "precipitationMm": 0, "suitable": true, "reasons": [] } ]
  }
}
```

### Ошибка валидации

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{ "name": "" }'
```

Ответ `422`:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [ { "field": "name", "message": "\"name\" is not allowed to be empty" } ],
    "requestId": "..."
  }
}
```

## Безопасность

- **CORS**: разрешённые источники задаются через `CORS_ORIGINS` (не `*`). По умолчанию — только `http://localhost:3000`. В Postman/curl без заголовка `Origin` CORS не применяется.
- **Rate limiting**: применяется на `/api`, окно и лимит — из env. При превышении возвращается **429** с заголовками лимита.
- **Helmet**: набор защитных HTTP-заголовков.
- **Размер тела**: JSON ограничен 100 KB, при превышении — **413**.
- **Cookie не используются**: API stateless, аутентификация не предусмотрена. Если бы использовались — выбрали бы `HttpOnly` (защита от чтения через JS), `Secure` (только по HTTPS), `SameSite=Lax` (защита от CSRF при переходах с внешних сайтов).
- **Секреты** хранятся в `.env`, файл игнорируется Git. Стек-трейсы не попадают в ответы в режиме `production`.

## Логирование

Каждый запрос логируется с указанием метода, пути, кода ответа, длительности и `requestId`. Ошибки уровня 5xx пишутся с уровнем `error`, 4xx — `warn`, успешные — `info`.

`requestId` возвращается в теле ошибок и в заголовке `X-Request-Id`, что позволяет найти запись в логе.

## Структура проекта

```
src/
  app.js            — сборка Express-приложения (createApp)
  server.js         — запуск сервера
  config/           — чтение переменных окружения
  domain/           — константы: статусы, приоритеты, переходы
  errors/           — классы ошибок (AppError, NotFoundError, ConflictError и др.)
  middlewares/      — requestId, logger, validate, notFound, errorHandler
  repositories/     — доступ к данным (JSON-файлы)
  services/         — бизнес-логика (equipment, requests, weather)
  controllers/      — обработчики маршрутов
  routes/           — Express-роутеры
  validators/       — Joi-схемы
  utils/            — вспомогательные функции (asyncHandler)
docs/
  postman/          — экспортированная Postman-коллекция
data/               — JSON-файлы (оборудование, заявки)
```

## Слоистая архитектура

```
routes → controllers → services → repositories
```

- **routes** — маршруты и подключение middleware валидации.
- **controllers** — тонкие: берут `req.validated`, вызывают сервис, отдают ответ.
- **services** — бизнес-логика: проверки, переходы статусов, вызовы внешнего API.
- **repositories** — единственное место, где есть файловые операции. Замена на PostgreSQL затрагивает только этот слой.

## Postman-коллекция

Экспортированная коллекция лежит в `docs/postman/wind-farm-api.postman_collection.json`. Импортируется в Postman через **File → Import**.

Содержит запросы по ресурсам (Health, Equipment, Requests, Negative extra, Weather) с автотестами `pm.test` на код и структуру ответа.

## Лицензия

MIT