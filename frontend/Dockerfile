# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy frontend
COPY frontend ./frontend
COPY shared ./shared

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend
RUN pnpm --filter frontend build

# Runtime stage
FROM node:20-alpine

# Install pnpm and serve
RUN npm install -g pnpm serve

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 4200

CMD ["serve", "-s", "frontend/dist", "-l", "4200"]

