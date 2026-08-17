# Etapa 1: Construcción (Build) de Ionic/Angular
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y construir la aplicación para producción
COPY . .
RUN npm run build --prod

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

# Copiamos la configuración de Nginx para enrutamiento SPA (Single Page Application)
# Nota: Si el backend está en el mismo dominio, configuraremos el proxy en docker-compose.
# Copiamos la build compilada a la carpeta pública de nginx
COPY --from=builder /app/www /usr/share/nginx/html

# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 (HTTP)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
