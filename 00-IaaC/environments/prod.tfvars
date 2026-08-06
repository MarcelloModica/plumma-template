# Stage PROD — Elastic Beanstalk LoadBalanced (ALB + WAF + scaling + spot).
# I SEGRETI (jdbc_password, jwt_secret) NON vanno qui: passali dalla pipeline
# come variabili d'ambiente TF_VAR_jdbc_password / TF_VAR_jwt_secret.

stage          = "prod"
spring_profile = "prod"

aws_region       = "eu-central-1"
application_name = "plumma-template"
environment_name = "plumma-template"
project_tag      = "plumma-template"

# Rete (una subnet per AZ)
vpc_id  = "vpc-xxxxxxxxxxxxxxxxx"
subnets = "subnet-aaaa,subnet-bbbb,subnet-cccc"

# Certificato ACM (stessa regione dell'ALB) per il listener HTTPS 443
ssl_certificate_arn = "arn:aws:acm:eu-central-1:<account>:certificate/xxxxxxxx"

# DB esterno collegato via JDBC (host/porta/schema del tuo DB prod)
jdbc_url      = "jdbc:mariadb://your-prod-db-host:3306/plumma_template?useUnicode=yes&characterEncoding=UTF-8&allowPublicKeyRetrieval=true&useSSL=true&trustServerCertificate=true"
jdbc_username = "app"

# Sizing prod
instance_type = "t4g.small"
min_size      = "2"
max_size      = "4"
