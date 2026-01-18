# Use Node.js 20 as the base image
FROM node:20-slim

# Install Python 3, pip, and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create virtual environment EARLY for caching
RUN python3 -m venv .venv
RUN .venv/bin/pip install --no-cache-dir requests python-telegram-bot python-dotenv

# Copy the entire project
COPY . .

# Install Node dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install && npm run build

# Expose the API port
EXPOSE 5000

# Start the unified service
CMD ["npm", "start"]
