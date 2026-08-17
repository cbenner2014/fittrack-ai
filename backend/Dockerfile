# Etapa 1: Construcción (Build)
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app
# Copiamos el archivo de dependencias primero para aprovechar la caché de Docker
COPY pom.xml .
# Descargamos dependencias sin construir aún
RUN mvn dependency:go-offline -B
# Copiamos el código fuente
COPY src ./src
# Compilamos y empaquetamos (saltando tests para mayor rapidez en despliegue)
RUN mvn clean package -DskipTests

# Etapa 2: Ejecución (Run)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiamos el .jar compilado desde la etapa de construcción
COPY --from=builder /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Exponemos el puerto de Spring Boot
EXPOSE 8080

# Configuramos límites de memoria para Java (-Xmx1G para no saturar los 4GB del servidor)
ENTRYPOINT ["java", "-Xmx1G", "-Xms256M", "-jar", "app.jar"]
