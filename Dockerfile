FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_AMAP_KEY=
ARG VITE_AMAP_SECURITY_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AMAP_KEY=$VITE_AMAP_KEY
ENV VITE_AMAP_SECURITY_KEY=$VITE_AMAP_SECURITY_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:docker

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
