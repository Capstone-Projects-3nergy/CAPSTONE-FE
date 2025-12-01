# -----------------------------
# 1) BUILD STAGE
# -----------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite production files
RUN npm run build



# -----------------------------
# 2) PRODUCTION STAGE (NGINX)
# -----------------------------
FROM nginx:1.27-alpine

# ลบ default.conf ของ nginx ออก
RUN rm /etc/nginx/conf.d/default.conf

# คัด config ของคุณไปแทน
COPY nginx.conf /etc/nginx/conf.d/default.conf

# คัดไฟล์ build ไป serve
COPY --from=build /app/dist /usr/share/nginx/html

# ซ่อน server version
RUN sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=5 \ 
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]