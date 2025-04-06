# Build stage
FROM node:20-alpine AS builder

# Install build dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Install Puppeteer

# Build the application
RUN npx prisma generate && yarn build

# Production stage
FROM node:20-alpine AS runner

# Install production dependencies

# Set working directory
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set runtime environment variables
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
