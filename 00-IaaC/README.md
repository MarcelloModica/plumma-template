# Deploy su AWS Elastic Beanstalk

Questa cartella contiene l'infrastruttura **Terraform** dell'applicazione, parametrica per **stage**.
Il deploy è orchestrato da una pipeline **self-contained** in `.github/workflows/deploy.yml`
(nessun reusable workflow esterno): build Maven → Terraform → pubblicazione del `.war`.

---

## 1. Stage

| Stage   | Trigger              | Ambiente EB      | Note |
|---------|----------------------|------------------|------|
| `local` | —                    | nessuno          | sviluppo sul PC (vedi README root) |
| `dev`   | push su `develop`    | **SingleInstance** | economico, non bilanciato, senza ALB/WAF |
| `prod`  | push su `main`/`master` | **LoadBalanced** | ALB + WAF + autoscaling + spot |

Lo stesso `main.tf` genera entrambi gli ambienti: i setting specifici del load balancer e il WAF
sono attivati solo quando `stage = prod` (o `environment_type = LoadBalanced`). Vedi `main.tf`
(`locals.is_lb`, `dynamic "setting"`) e `waf.tf` (`count = local.is_lb ? 1 : 0`).

## 2. File

```
00-IaaC/
├── main.tf           # application + environment (setting dinamici per stage) + backend S3
├── variables.tf      # tutte le variabili di input
├── waf.tf            # WAF + associazione ALB (solo prod)
├── outputs.tf        # nome/tipo/URL ambiente
└── environments/
    ├── dev.tfvars    # valori NON segreti per dev
    └── prod.tfvars   # valori NON segreti per prod
```

## 3. Database collegato via JDBC

Il template **non provisiona** il DB: si collega a un database esterno. La pipeline inietta come
env var dell'ambiente EB (namespace `aws:elasticbeanstalk:application:environment`):

- `JDBC_DATABASE_URL`, `JDBC_DATABASE_USERNAME`, `JDBC_DATABASE_PASSWORD`
- `JWT_SECRET`, `SPRING_PROFILES_ACTIVE`
- eventuali extra via la variabile `extra_env` (es. `OAUTH_*`).

`url`/`username` stanno nei `*.tfvars`; **password e JWT_SECRET sono segreti** e arrivano dalla
pipeline come `TF_VAR_jdbc_password` / `TF_VAR_jwt_secret` (GitHub Secrets), mai committati.

## 4. Prerequisiti AWS (una tantum)

- **Ruolo OIDC** assumibile da GitHub Actions nell'account target → secret `AWS_ROLE_TO_ASSUME`.
- Una **VPC** con **subnet** (una per AZ in prod) nella regione di deploy.
- Solo per **prod**: un **certificato ACM** `ISSUED` nella stessa regione (listener HTTPS 443) → `ssl_certificate_arn`.
- Bucket di stato/artefatti e instance profile `aws-elasticbeanstalk-ec2-role` sono creati
  automaticamente dalla pipeline al primo run.

Recupero valori di rete/certificato:

```bash
aws ec2 describe-vpcs --region <region> --query "Vpcs[].{Id:VpcId,Cidr:CidrBlock}" --output table
aws ec2 describe-subnets --region <region> --filters Name=vpc-id,Values=<VPC_ID> --query "Subnets[].{Id:SubnetId,AZ:AvailabilityZone}" --output table
aws acm list-certificates --region <region> --query "CertificateSummaryList[].{Arn:CertificateArn,Domain:DomainName}" --output table
```

## 5. GitHub Secrets richiesti

| Secret | Descrizione |
|--------|-------------|
| `AWS_ROLE_TO_ASSUME` | ARN del ruolo OIDC nell'account di destinazione |
| `JDBC_PASSWORD` | password del DB → `TF_VAR_jdbc_password` |
| `JWT_SECRET` | segreto JWT (>= 32 byte) → `TF_VAR_jwt_secret` |

## 6. Eseguire un deploy

- **Automatico**: push su `develop` (dev) o `main`/`master` (prod).
- **Manuale**: Actions → *Deploy to Elastic Beanstalk* → *Run workflow*, scegli `stage`.
- **Solo piano**: spunta `plan_only` per vedere il `terraform plan` senza applicare.

### Gate anti-distruttivo

L'apply è **bloccato** se il piano contiene `delete`/`replace`. Se è voluto e sicuro, rilancia
con `allow_destroy: true`. Non usarlo alla leggera in produzione (un replace dell'ambiente = downtime + nuovo URL).

## 7. Dopo il deploy

- L'URL è negli output Terraform (`environment_url`) o in Console EB.
- Health check: `GET /services/health/check` deve rispondere `200`.
- Log applicativi su **CloudWatch Logs** (streaming abilitato).

## 8. Note

- `main.tf`/`variables.tf`/`waf.tf` sono **generici e uguali tra i progetti**: personalizza solo i `*.tfvars` e i secrets.
- Stato Terraform separato per stage (`beanstalk/dev.tfstate`, `beanstalk/prod.tfstate`).
- Bucket di stato e artefatti sono persistenti: **non cancellarli**.
