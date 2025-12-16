# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci

COPY . . 

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_manager"

RUN npx prisma generate
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --only=production

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_manager"

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]