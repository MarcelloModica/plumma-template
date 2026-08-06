# Backend (Spring Boot)

API REST Spring Boot del template, package base `com.plumma.template`, packaging **WAR**
(esegue sia standalone come JAR sia dentro Tomcat di Elastic Beanstalk). Serve anche la SPA
React compilata (copiata in `classpath:/static/` durante la build del monorepo).

## Endpoint principali

| Endpoint | Auth | Descrizione |
|----------|------|-------------|
| `POST /token` | pubblico | Login username/password → `{ accessToken, tokenType, expiresIn }` |
| `GET /api/public/oauth/{google\|azure}/start` | pubblico | Avvio login OAuth (redirect al provider) |
| `GET /api/public/oauth/{provider}/callback` | pubblico | Callback OAuth → JWT → redirect al frontend |
| `GET /services/health/check` | pubblico | Health check per il load balancer |
| `GET/POST/PUT/DELETE /api/items` | JWT | CRUD di esempio (entità `Item`) |

Sicurezza stateless: JWT HMAC HS256 (`SecurityConfig`, `JwtConfig`). Il claim `role` diventa
authority `ROLE_<RUOLO>`.

## Utente demo locale

Al primo avvio, se la tabella `app_user` è vuota, viene creato l'utente demo definito in
`application.properties` (`app.demo-user.*`) — default **demo / demo1234**, ruolo `admin`.
Le utenze reali vivono su DB. Disabilita in produzione con `APP_DEMO_USER_ENABLED=false`.

## Database / connettore JDBC

Datasource configurato in `application.properties`. Il **connettore** è esplicito:

```properties
spring.datasource.driver-class-name=${JDBC_DATABASE_DRIVER:org.mariadb.jdbc.Driver}
spring.datasource.url=${JDBC_DATABASE_URL:jdbc:mariadb://localhost:3306/plumma_template?...}
```

Per cambiare DB (es. PostgreSQL): sostituisci la dipendenza `mariadb-java-client` in `pom.xml`
con il driver desiderato e aggiorna `driver-class-name`/`url`. In dev/prod i valori arrivano
dagli env var iniettati da Terraform.

## Profili

| Profilo | ddl-auto | Swagger | Uso |
|---------|----------|---------|-----|
| default/`local` | `update` | on | sviluppo locale |
| `dev` | `update` | on | EB SingleInstance |
| `prod` | `validate` | off | EB LoadBalanced |

Il profilo attivo è scelto per-ambiente da `SPRING_PROFILES_ACTIVE` (iniettato da Terraform).
In locale puoi creare `application-local.properties` per sovrascrivere valori (es. password DB).

## OAuth (Google / Microsoft 365)

Configura i provider via env `OAUTH_*` (vedi `application.properties`). Registra come redirect URI:
`<OAUTH_BACKEND_BASE_URL>/api/public/oauth/{google|azure}/callback`. Se non configurato, il
relativo pulsante di login restituisce un errore "not configured".

## Comandi

```bash
# run in sviluppo
./mvnw -pl backend spring-boot:run
# build del WAR (dalla root, include il frontend)
./mvnw clean package
```
