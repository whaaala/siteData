# Use Playwright's official image with all dependencies and browsers
FROM mcr.microsoft.com/playwright:v1.44.1-jammy

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app code
COPY . .

# Start your app
CMD ["node", "scheduler.js"]