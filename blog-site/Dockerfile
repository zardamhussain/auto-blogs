# 1. Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies (includes devDependencies)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# 2. Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy runtime files and artifacts
COPY --from=build /app/package*.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules

EXPOSE 6969

ENV NODE_ENV=production

# Start the production server
CMD ["npm", "run", "start"]
