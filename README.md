# Plumma Template

Template full-stack pronto al deploy: **backend Spring Boot** + **frontend React (Vite + TanStack)**
impacchettati in un unico `.war`, con **database collegato via JDBC** e deploy su **AWS Elastic
Beanstalk** tramite **GitHub Actions**.

## Cosa include

- **Login completo**: username/password + **Google** + **Microsoft 365** (OAuth2/OIDC), JWT stateless.
- **Utente demo locale** creato al primo avvio (configurato nelle properties), oltre alle utenze su DB.
- **Entità CRUD di esempio** (`Item`) che dimostra il wiring JPA/JDBC end-to-end.
- **i18n** (Italiano / English) lato frontend.
- **3 stage**: `local` → `dev` (Beanstalk SingleInstance, economico) → `prod` (Beanstalk LoadBalanced con ALB, WAF, autoscaling).

## Struttura

```
plumma-template/
├── backend/     # Spring Boot (package com.plumma.template), packaging WAR
├── frontend/    # React + Vite + TanStack Router (build copiata in static/ del WAR)
├── 00-IaaC/     # Terraform Elastic Beanstalk, parametrico per stage
├── .github/workflows/deploy.yml   # pipeline self-contained
└── pom.xml      # reactor Maven multi-modulo (groupId com.plumma)
```

## Sviluppo locale (stage `local`)

Il profilo `local` gira **senza database esterno**: usa un H2 in-memory, così l'app parte
subito dopo il clone. Utente pronto all'uso: **admin / admin**.

Modo più rapido (un solo processo: backend + SPA sulla stessa porta 8080):

```bash
./mvnw clean package
java -Dspring.profiles.active=local -jar backend/target/plumma-template.war
```

Poi apri http://localhost:8080 e fai login con **admin / admin** → welcome page.

In alternativa, con hot-reload del frontend (backend su 8080, frontend su 3000):

```bash
# terminale 1 — backend
./mvnw -pl backend -am spring-boot:run -Dspring-boot.run.profiles=local
# terminale 2 — frontend (proxa /api,/token,/services su 8080)
cd frontend && npm install && npm run dev
```

> H2 è in-memory: i dati si azzerano ad ogni riavvio. Per usare un DB reale in locale, avvia
> un MariaDB e lancia senza il profilo `local` (vedi `backend/README.md`).

## Build unico (WAR con frontend incluso)

```bash
./mvnw clean package
```

Produce `target/plumma-template.war` (e `backend/target/plumma-template.war`). Avvio standalone:

```bash
java -jar backend/target/plumma-template.war
```

## Deploy (in breve)

Il deploy è automatico: push su `develop` → **dev**, push su `main`/`master` → **prod**;
oppure manuale da **Actions → Deploy to Elastic Beanstalk**. La guida completa è qui sotto;
dettagli infrastrutturali e troubleshooting in [`00-IaaC/README.md`](00-IaaC/README.md).

## Personalizzare il template

1. Rinomina groupId/artifact/package se vuoi (`com.plumma.template` → il tuo).
2. Sostituisci l'entità `Item` con il tuo dominio.
3. Configura i provider OAuth (env `OAUTH_*`) e ruota i segreti.
4. Compila `00-IaaC/environments/{dev,prod}.tfvars` con VPC/subnet/certificato e i secrets in GitHub.

---

# Guida completa: dal clone al deploy in produzione

Questa guida accompagna uno sviluppatore da zero: clonare il repo, sviluppare in locale,
portare le modifiche su GitHub e arrivare al deploy in `dev` e `prod`. I passaggi marcati
**(prima volta)** vanno fatti una sola volta per progetto/account.

## 0. Prerequisiti

**Strumenti locali**

| Strumento | Versione | Note |
|-----------|----------|------|
| JDK | 21 | imposta `JAVA_HOME` sul JDK 21 |
| Node.js | 22.x | include npm |
| Maven | 3.9.x | oppure usa il wrapper `./mvnw` incluso |
| Git | recente | |
| Docker *(opzionale)* | — | per un MariaDB locale veloce |

**Account AWS** (serve solo per il deploy, non per lo sviluppo locale): un utente/ruolo con
permessi per Elastic Beanstalk, EC2/VPC, S3, IAM, WAF, CloudWatch.

---

## 1. Clonare il repository

```bash
git clone <URL-DEL-TUO-REPO>.git
cd plumma-template
```

> Se stai creando un **nuovo progetto** dal template, dopo il clone puoi rinominare
> package/groupId/artifact (`com.plumma.template` → il tuo) e sostituire l'entità `Item`.

---

## 2. Sviluppo in locale (stage `local`)

Il profilo `local` parte **senza alcun database esterno** (usa un H2 in-memory) con un utente già
pronto **admin / admin**: è il modo più veloce per verificare che tutto funzioni subito dopo il clone.

### 2.1 Avvio rapido — un solo processo (backend + SPA su :8080)

```bash
./mvnw clean package
java -Dspring.profiles.active=local -jar backend/target/plumma-template.war
```

Apri http://localhost:8080 e fai login con **admin / admin** → welcome page.
(I dati vivono in RAM e si azzerano a ogni riavvio.)

### 2.2 Sviluppo con hot-reload del frontend

```bash
# terminale 1 — backend (H2, profilo local)
./mvnw -pl backend -am spring-boot:run -Dspring-boot.run.profiles=local
# terminale 2 — frontend su :3000 (proxa /api,/token,/services su :8080)
cd frontend && npm install && npm run dev
```

Apri http://localhost:3000 e fai login con **admin / admin**.

### 2.3 (opzionale) DB reale in locale invece di H2

Per provare con MariaDB (come in dev/prod), avvia un DB e lancia **senza** il profilo `local`:

```bash
docker run --name plumma-db -e MARIADB_ROOT_PASSWORD=root \
  -e MARIADB_DATABASE=plumma_template -p 3306:3306 -d mariadb:11
./mvnw -pl backend -am spring-boot:run
```

I default puntano a `localhost:3306` (root/root) e l'utente demo diventa **demo / demo1234**.
Per override personali crea `backend/src/main/resources/application-local.properties` (git-ignorato).

### 2.4 (opzionale) Login Google / Microsoft 365 in locale

Registra le app sui provider e imposta gli env `OAUTH_*` (vedi `backend/README.md`).
Redirect URI da registrare: `http://localhost:8080/api/public/oauth/{google|azure}/callback`.
Senza configurazione i pulsanti social restituiscono "not configured" (il login user/password funziona comunque).

---

## 3. Portare le modifiche su GitHub

Il branch determina lo stage di deploy:

| Branch | Stage deployato |
|--------|-----------------|
| `develop` | **dev** (SingleInstance) |
| `main` / `master` | **prod** (LoadBalanced) |

Flusso consigliato: lavora su un branch di feature, poi apri PR verso `develop`.

```bash
git checkout -b feature/mia-modifica
# ... modifiche ...
git add -A
git commit -m "Descrizione della modifica"
git push -u origin feature/mia-modifica
# apri una Pull Request verso 'develop' su GitHub
```

Al merge su `develop` parte in automatico il deploy in **dev**.

---

## 4. Setup una-tantum per il deploy **(prima volta)**

Prima del primissimo deploy vanno preparate tre cose: i prerequisiti AWS, i GitHub Secrets e i file `*.tfvars`.

### Dove vanno i parametri (riepilogo)

Ci sono **solo due posti** da compilare — nient'altro va toccato (`main.tf`, `variables.tf`,
`waf.tf` sono generici):

| Dove | Cosa ci va | Segreti? |
|------|-----------|----------|
| **File** `00-IaaC/environments/dev.tfvars` e `prod.tfvars` | regione, nomi, VPC, subnet, certificato (prod), `jdbc_url`, `jdbc_username`, sizing | No (committabili) |
| **GitHub Secrets** (Settings → Secrets and variables → Actions) | `AWS_ROLE_TO_ASSUME`, `JDBC_PASSWORD`, `JWT_SECRET` | Sì (mai nei file) |

### Cosa viene creato al primo deploy

Al **primo** run del workflow, Terraform fa `apply` e **crea da zero** in AWS:

- l'**Elastic Beanstalk Application + Environment** (in prod anche **ALB + WAF + autoscaling**);
- automaticamente, se mancano: i **bucket S3** di stato/artefatti e l'instance profile `aws-elasticbeanstalk-ec2-role`.

Ai run successivi Terraform **aggiorna** invece di ricreare.

> ⚠️ **Il database NON viene creato dal template**: è "esterno". L'ambiente EB viene creato, ma il
> DB deve **già esistere** ed essere raggiungibile — l'app ci si collega tramite `jdbc_url` +
> `JDBC_PASSWORD`. Prepara un DB per dev e uno per prod prima del deploy.

### 4.1 (prima volta) Prerequisiti sull'account AWS

1. **Ruolo OIDC per GitHub Actions**: crea un IAM Role con trust policy verso
   `token.actions.githubusercontent.com` limitata al tuo repo, e i permessi elencati al punto 0.
   Annota il suo **ARN**.
2. **Rete**: individua una **VPC** e le sue **subnet** (una per AZ, almeno 2 per prod) nella
   regione scelta.
3. **Certificato ACM (solo prod)**: un certificato `ISSUED` nella **stessa regione** dell'ambiente,
   per il listener HTTPS 443. Annota l'**ARN**.
4. **Database**: prepara un DB raggiungibile dall'ambiente EB (uno per dev, uno per prod) e
   annota host/porta/schema, utente e password.

> Bucket di stato/artefatti Terraform e l'instance profile `aws-elasticbeanstalk-ec2-role`
> vengono creati **automaticamente** dalla pipeline al primo run.

Comandi utili per recuperare i valori:

```bash
aws ec2 describe-vpcs --region <region> --query "Vpcs[].{Id:VpcId,Cidr:CidrBlock}" --output table
aws ec2 describe-subnets --region <region> --filters Name=vpc-id,Values=<VPC_ID> --query "Subnets[].{Id:SubnetId,AZ:AvailabilityZone}" --output table
aws acm list-certificates --region <region> --query "CertificateSummaryList[].{Arn:CertificateArn,Domain:DomainName}" --output table
```

### 4.2 (prima volta) GitHub Secrets

In **Settings → Secrets and variables → Actions** del repo, crea:

| Secret | Valore |
|--------|--------|
| `AWS_ROLE_TO_ASSUME` | ARN del ruolo OIDC (punto 4.1.1) |
| `JDBC_PASSWORD` | password del DB → iniettata come `TF_VAR_jdbc_password` |
| `JWT_SECRET` | segreto JWT, **≥ 32 byte** → `TF_VAR_jwt_secret` |

> Suggerimento: usa un `JWT_SECRET` diverso tra dev e prod se vuoi ambienti isolati (puoi
> gestirlo con GitHub *Environments*). I segreti **non** vanno mai messi nei file `*.tfvars`.

### 4.3 (prima volta) Compilare i file `*.tfvars`

Sono gli **unici file da modificare** per collegare il template al tuo account. Uno per stage:
[`00-IaaC/environments/dev.tfvars`](00-IaaC/environments/dev.tfvars) e
[`00-IaaC/environments/prod.tfvars`](00-IaaC/environments/prod.tfvars).

| Campo | Dove trovarlo | dev | prod |
|-------|---------------|-----|------|
| `aws_region` | regione scelta (es. `eu-central-1`) | ✅ | ✅ |
| `application_name` / `environment_name` / `project_tag` | nomi a piacere (spesso = nome repo) | ✅ | ✅ |
| `vpc_id` | punto 4.1.2 | ✅ | ✅ |
| `subnets` | punto 4.1.2 (separate da virgola) | ✅ | ✅ |
| `ssl_certificate_arn` | punto 4.1.3 | — | ✅ (obbligatorio) |
| `jdbc_url` | host/porta/schema del DB | ✅ | ✅ |
| `jdbc_username` | utente DB | ✅ | ✅ |
| `instance_type`, `min_size`, `max_size` | sizing (default sensati) | opz. | opz. |

`stage` e `spring_profile` sono già impostati (`dev`/`prod`) e di norma non si toccano.

Commita i `*.tfvars` compilati (non contengono segreti):

```bash
git add 00-IaaC/environments/dev.tfvars 00-IaaC/environments/prod.tfvars
git commit -m "Config infrastruttura dev/prod"
```

---

## 5. Deploy in `dev`

Due modi:

- **Automatico**: merge/push su `develop`.
- **Manuale/anteprima**: GitHub → **Actions → Deploy to Elastic Beanstalk → Run workflow**,
  scegli `stage = dev`. Alla prima esecuzione conviene spuntare **`plan_only`** per rivedere il
  `terraform plan` senza applicare nulla; se il piano è ok, rilancia senza `plan_only`.

La pipeline: builda il WAR → esegue Terraform (crea l'ambiente SingleInstance) → pubblica il WAR su EB.

---

## 6. Promuovere in `prod`

Quando `dev` è verificato, porta le modifiche su `main`/`master` (di norma via PR `develop` → `main`):

```bash
git checkout main
git merge develop
git push
```

Il push su `main` avvia il deploy in **prod** (LoadBalanced, con ALB + WAF + autoscaling).

**Gate anti-distruttivo**: se il `terraform plan` prevede `delete`/`replace`, l'apply si **blocca**.
Se la modifica distruttiva è voluta e sicura, rilancia il workflow manualmente con
**`allow_destroy = true`**. Non usarlo alla leggera in produzione (un replace dell'ambiente = downtime + nuovo URL).

---

## 7. Verifica post-deploy

- L'URL dell'ambiente è negli **output Terraform** (`environment_url`) o in **Console AWS → Elastic Beanstalk**.
- Health check: `GET https://<url>/services/health/check` deve rispondere `200`.
- La home `/` deve servire la SPA React; il login demo (o le tue utenze) deve funzionare.
- Log applicativi su **CloudWatch Logs** (streaming abilitato).

---

## 8. Riepilogo del flusso quotidiano

```
clone → branch feature → sviluppo locale (DB + backend + frontend)
      → commit & push → PR verso develop → deploy DEV automatico
      → verifica su dev → PR develop→main → deploy PROD automatico
```

## 9. Trasferire il repo nell'organizzazione **PLUMMA-PROJECT**

Al termine, il repository va spostato sotto l'organizzazione GitHub **PLUMMA-PROJECT**.

**Come trasferirlo** (serve essere owner del repo e avere i permessi nell'org):
GitHub → repo **Settings → General → Danger Zone → Transfer ownership** → nuovo owner
`PLUMMA-PROJECT`. In alternativa, crea il repo direttamente dentro l'org e fai `git push`.

**Dopo il trasferimento aggiorna** (altrimenti i deploy si rompono):

1. **Remote locale**:
   ```bash
   git remote set-url origin https://github.com/PLUMMA-PROJECT/plumma-template.git
   ```
2. **Trust policy del ruolo OIDC in AWS** — la condizione `token.actions.githubusercontent.com:sub`
   punta al percorso `repo:<owner>/<repo>:*`: cambiala da
   `repo:MarcelloModica/plumma-template:*` a **`repo:PLUMMA-PROJECT/plumma-template:*`**,
   altrimenti l'assunzione del ruolo fallisce con *AccessDenied*.
3. **Secrets**: i secret *di repo* seguono il repo nel trasferimento; se usi secret *di
   organizzazione*, assicurati che il repo vi abbia accesso. Ricontrolla `AWS_ROLE_TO_ASSUME`,
   `JDBC_PASSWORD`, `JWT_SECRET`.
4. **Actions / branch protection / Environments**: verifica che siano abilitati secondo le policy dell'org.

> GitHub mantiene un redirect dal vecchio URL, ma è meglio aggiornare comunque i remote e i riferimenti.

---

## 10. Checklist "prima volta"

- [ ] Ruolo OIDC AWS creato → ARN
- [ ] VPC + subnet individuate; certificato ACM per prod
- [ ] DB pronti (dev/prod) con credenziali
- [ ] GitHub Secrets: `AWS_ROLE_TO_ASSUME`, `JDBC_PASSWORD`, `JWT_SECRET`
- [ ] `dev.tfvars` e `prod.tfvars` compilati e committati
- [ ] Primo deploy dev in `plan_only`, poi apply
- [ ] Promozione in prod via merge su `main`/`master`
- [ ] Repo trasferito nell'org **PLUMMA-PROJECT** e trust policy OIDC aggiornata
- [ ] (Sicurezza) segreti reali ruotati, `app.demo-user.enabled=false` in prod se non serve
