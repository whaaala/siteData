# Use official Node.js LTS image
FROM node:20

# Install system dependencies for Playwright
RUN apt-get update && \
    apt-get install -y wget gnupg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install Playwright browsers and dependencies
RUN npx playwright install --with-deps

# Copy the rest of your app code
COPY . .

# Start your app
CMD ["npm", "start"]