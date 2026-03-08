FROM node:22-alpine AS build

ARG APP_NAME=angular-splitfy-frontend

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.29-alpine

ARG APP_NAME=angular-splitfy-frontend

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/${APP_NAME}/browser /usr/share/nginx/html

EXPOSE 4242
