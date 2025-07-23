# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# The Vite dev server needs to be accessible from outside the container.
# This port will be mapped in docker-compose.
EXPOSE 8501

# Command to run the Vite development server.
# The "--host" flag makes it accessible from outside the container.
# CMD ["npm", "run", "dev", "--host"] 
