# ===== build stage =====
FROM node:20 AS build
WORKDIR /app

COPY package*.json /app/
RUN npm ci

COPY . /app/

# ALBで /api/* を backend に流す想定（同一オリジン）
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ===== runtime stage =====
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
