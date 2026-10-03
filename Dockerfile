# ---------- Stage 1: builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем только манифесты — кэш npm install сохраняется,
# если package.json не менялся.
COPY package*.json ./

# Устанавливаем все зависимости (включая dev) для сборки.
RUN npm ci

# Копируем весь исходный код.
COPY . .

# Если у тебя есть шаг сборки — здесь. У нас чистый Node.js, сборки нет.

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Устанавливаем только production-зависимости.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Копируем код из builder-стадии.
COPY --from=builder /app/src ./src
COPY --from=builder /app/models ./models
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeders ./seeders
COPY --from=builder /app/config ./config
COPY --from=builder /app/package.json ./

# Создаём непривилегированного пользователя node (он уже есть в образе),
# меняем владельца файлов и переключаемся на него.
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]