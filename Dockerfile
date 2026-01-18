# Use Node.js 20 as the base image
FROM node:20-slim

# Install Python 3, pip, and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    gcc \
    libgl1-mesa-glx \
    libglvnd0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire project
COPY . .

# Install root dependencies
RUN npm install

# Install backend dependencies
RUN cd backend && npm install

# Install frontend dependencies and build
RUN cd frontend && npm install && npm run build

# Install Python dependencies (system-wide for simplicity in container)
RUN python3 -m pip install --no-cache-dir --break-system-packages requests python-telegram-bot python-dotenv

# Expose the API port
EXPOSE 5000

# Start the unified service
CMD ["npm", "start"]
