FROM node:20-bullseye-slim

# Install FFmpeg for real video rendering and audio synthesis
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    librsvg2-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
