# Use LTS version
FROM node:20-alpine

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Build TypeScript
RUN npm run build

# Create logs directory
RUN mkdir -p /usr/src/app/logs

# Set proper permissions
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

# Expose the port
EXPOSE 8080

# Start with PM2

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]

