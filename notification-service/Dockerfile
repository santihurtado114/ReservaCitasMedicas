# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all packages
COPY notification-service ./notification-service
COPY shared ./shared

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build notification-service
RUN pnpm --filter notification-service build

# Runtime stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all packages
COPY notification-service ./notification-service
COPY shared ./shared

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/notification-service/dist ./notification-service/dist

EXPOSE 3001

CMD ["node", "notification-service/dist/main"]

