# FinTrack Backend — Spring Initializr style

This backend is a Spring Boot 3.4.4 Maven project targeting Java 21, with the same dependency style you get from Spring Initializr.

## Initializr selections

- Project: Maven
- Language: Java
- Spring Boot: 3.4.4
- Packaging: Jar
- Java: 21
- Group: com.fintrack
- Artifact: fintrack-api
- Dependencies: Spring Web, Spring Data JPA, Spring Security, Validation, MySQL Driver, Lombok

JWT dependencies (JJWT 0.12.6) are added for authentication.

## Run

1. Create/use MySQL.
2. Open `src/main/resources/application.properties`.
3. Replace `YOUR_MYSQL_PASSWORD`.
4. Make sure database `fintrack` is accessible. `createDatabaseIfNotExist=true` can create it.
5. In IntelliJ, reload Maven and run `FintrackApplication`.

If Maven is installed:
`mvn clean spring-boot:run`

## API

POST `/api/auth/register`
POST `/api/auth/login`
GET/POST/PUT/DELETE `/api/transactions`
GET/PUT `/api/budget`

The transaction and budget endpoints require:
`Authorization: Bearer <JWT>`

The budget is currently kept in memory and resets when the backend restarts.
