FROM node:20-alpine

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm install

# Copy application sources
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite server bound to 0.0.0.0 for container networking
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
