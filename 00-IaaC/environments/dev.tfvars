# Stage DEV — Elastic Beanstalk SingleInstance (economico, non bilanciato).
# I SEGRETI (jdbc_password, jwt_secret) NON vanno qui: passali dalla pipeline
# come variabili d'ambiente TF_VAR_jdbc_password / TF_VAR_jwt_secret.
# Anche jdbc_url/jdbc_username possono arrivare da CI se preferisci.

stage            = "dev"
spring_profile   = "dev"

aws_region       = "eu-central-1"
application_name = "plumma-template-dev"
environment_name = "plumma-template-dev"
project_tag      = "plumma-template-dev"

# Rete (compila con i valori del tuo account/regione)
vpc_id  = "vpc-xxxxxxxxxxxxxxxxx"
subnets = "subnet-aaaa,subnet-bbbb"

# DB esterno collegato via JDBC (host/porta/schema del tuo DB dev)
jdbc_url      = "jdbc:mariadb://your-dev-db-host:3306/plumma_template?useUnicode=yes&characterEncoding=UTF-8&allowPublicKeyRetrieval=true"
jdbc_username = "app"

# Sizing minimale per contenere i costi
instance_type = "t4g.small"
min_size      = "1"
max_size      = "1"
