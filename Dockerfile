FROM node:20-slim

# Install Python 3
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Create venv and install python deps (cached)
RUN python3 -m venv /opt/venv
RUN /opt/venv/bin/pip install --no-cache-dir requests python-telegram-bot python-dotenv

# 2. Install root dependencies (cached)
COPY package*.json ./
RUN npm install

# 3. Install Backend dependencies (cached)
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# 4. Install Frontend dependencies and build (cached)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 5. Copy remaining source
COPY . .

# Ensure PATH uses the venv
ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 5000

# Start unified service
CMD ["npm", "start"]
