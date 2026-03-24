# --- Stage 1: Build the React Frontend ---
FROM node:18 AS build-stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Final Monolithic Image ---
FROM python:3.11-slim

# Install Node.js and Nginx
RUN apt-get update && apt-get install -y \
    curl \
    nginx \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Setup Backend (Node.js)
COPY frontend/package*.json ./backend/
RUN cd backend && npm install --production
COPY frontend/src/server.js ./backend/src/

# 2. Setup AI Agent (Python)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ai_agent.py server.py ./

# 3. Setup Frontend (Static Files)
COPY --from=build-stage /app/frontend/build /usr/share/nginx/html

# 4. Nginx Configuration
RUN echo 'server { \
    listen 7860; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri /index.html; \
    } \
    location /api/ { \
        proxy_pass http://localhost:5003/; \
        proxy_set_header Host $host; \
    } \
    location /process-request/ { \
        proxy_pass http://localhost:8000/process-request; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/sites-available/default

# 5. Startup Script
RUN echo '#!/bin/bash\n\
python3 server.py & \n\
node backend/src/server.js & \n\
nginx -g "daemon off;"' > /app/start.sh
RUN chmod +x /app/start.sh

# Hugging Face Requirement: Non-root user with Port 7860
# (HFS provides this user by default, but we'll ensure Nginx is ready)
RUN chmod -R 777 /var/log/nginx /var/lib/nginx /run

EXPOSE 7860

CMD ["/app/start.sh"]
