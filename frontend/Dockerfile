# Multi-Stage Production Dockerfile for MicroLIMS Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json vite.config.ts index.html ./
RUN npm install

COPY src/ ./src/
RUN npm run build

# NGINX Static Web Server Stage
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
