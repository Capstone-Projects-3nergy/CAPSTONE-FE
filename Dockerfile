# -----------------------------
# 1) BUILD STAGE
# -----------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# -----------------------------
# 2) PRODUCTION STAGE (NGINX)
# -----------------------------
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 👉 แก้ไข: เอาไฟล์ dist ไปวางที่ root ของ Nginx ไปเลย
COPY --from=build /app/dist /usr/share/nginx/html

RUN sed -i 's/# server_tokens off;/server_tokens off;/' /etc/nginx/nginx.conf
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=5 \ 
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]