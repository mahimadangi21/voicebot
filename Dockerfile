# Stage 1: Build the frontend React app
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI runtime container
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python dependencies and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Copy built frontend assets from Stage 1 builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (HF Spaces defaults to 7860)
EXPOSE 7860

ENV PORT=7860

# Run the FastAPI server
CMD ["python", "server.py"]
