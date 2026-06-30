# Use lightweight node LTS alpine image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Set environment variables for production build
ENV NODE_ENV=production

# Run the production build (Vite + esbuild backend compilation)
RUN npm run build

# Use thin production runner image
FROM node:22-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary production files from builder stage
COPY package*.json ./
# Only install production dependencies
RUN npm ci --omit=dev

# Copy compiled files and public assets
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start command
CMD ["npm", "start"]
