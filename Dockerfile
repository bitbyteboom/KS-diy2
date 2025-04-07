# Multi-stage Dockerfile for Vite React app

# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source code
COPY . .

# Build the app
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

# Install lightweight static server
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start static server immediately
CMD ["serve", "-s", "dist", "-l", "3000"]
