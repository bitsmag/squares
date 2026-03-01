# Multi-stage Dockerfile for the public Node.js Squares server

# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for TypeScript build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY . ./

RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app and views from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views

# The server listens on PORT (default 3000)
EXPOSE 3000

CMD ["npm", "start"]
