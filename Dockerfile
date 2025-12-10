# Use Node.js 18 with Python support
FROM node:18-bullseye

# Install Python and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy Python requirements
COPY ai_engine/requirements.txt ./ai_engine/

# Install Python dependencies
RUN pip3 install -r ai_engine/requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads outputs logs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PYTHON_PATH=python3

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]