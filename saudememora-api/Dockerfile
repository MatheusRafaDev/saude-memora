FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app
COPY . .

# Use o profile de produção
RUN mvn clean install -DskipTests -Pprod

# Etapa final
FROM eclipse-temurin:21-jdk-jammy

EXPOSE 8080

COPY --from=build /app/target/saudememora-0.0.1-SNAPSHOT.jar app.jar

# Use o profile prod e aguarde o banco de dados
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]