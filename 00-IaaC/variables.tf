# ---------------------------------------------------------------------------
# Variabili dell'infrastruttura Elastic Beanstalk.
# Alimentate dal workflow GitHub Actions via TF_VAR_* o -var-file (tfvars).
# ---------------------------------------------------------------------------

variable "aws_region" {
  description = "Regione AWS di deploy (deve combaciare con VPC/subnet/certificato)"
  type        = string
}

variable "stage" {
  description = "Stage logico: dev (SingleInstance, economico) o prod (LoadBalanced)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.stage)
    error_message = "stage deve essere 'dev' o 'prod'."
  }
}

variable "environment_type" {
  description = "Tipo ambiente EB: SingleInstance o LoadBalanced. Se vuoto, derivato dallo stage."
  type        = string
  default     = ""
  validation {
    condition     = contains(["", "SingleInstance", "LoadBalanced"], var.environment_type)
    error_message = "environment_type deve essere '', 'SingleInstance' o 'LoadBalanced'."
  }
}

variable "application_name" {
  description = "Nome della Elastic Beanstalk Application"
  type        = string
}

variable "environment_name" {
  description = "Nome dell'ambiente Elastic Beanstalk"
  type        = string
}

variable "project_tag" {
  description = "Valore del tag PROJECT e prefisso nomi WAF"
  type        = string
}

variable "solution_stack_name" {
  description = "Solution stack EB (risolto dinamicamente dalla pipeline)"
  type        = string
}

# --- Rete ---
variable "vpc_id" {
  description = "VPC in cui creare l'ambiente"
  type        = string
}

variable "subnets" {
  description = "Subnet (elenco separato da virgola) per istanze e load balancer"
  type        = string
}

variable "ssl_certificate_arn" {
  description = "ARN certificato ACM per il listener HTTPS 443 (obbligatorio solo per stage prod/LoadBalanced)"
  type        = string
  default     = ""
}

# --- Runtime applicativo iniettato come env var EB ---
variable "spring_profile" {
  description = "Valore di SPRING_PROFILES_ACTIVE (es. dev|prod)"
  type        = string
}

variable "jdbc_url" {
  description = "JDBC_DATABASE_URL del DB esterno collegato all'app"
  type        = string
}

variable "jdbc_username" {
  description = "JDBC_DATABASE_USERNAME"
  type        = string
}

variable "jdbc_password" {
  description = "JDBC_DATABASE_PASSWORD"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT_SECRET (>= 32 byte)"
  type        = string
  sensitive   = true
}

variable "extra_env" {
  description = "Env var applicative aggiuntive (es. OAUTH_*), iniettate nell'ambiente EB"
  type        = map(string)
  default     = {}
}

# --- Sizing / knob ---
variable "instance_type" {
  type    = string
  default = "t4g.small"
}

variable "instance_architecture" {
  type    = string
  default = "arm64"
}

variable "min_size" {
  type    = string
  default = "1"
}

variable "max_size" {
  type    = string
  default = "1"
}

variable "health_check_path" {
  type    = string
  default = "/services/health/check"
}

variable "root_volume_type" {
  type    = string
  default = "gp3"
}

variable "root_volume_size" {
  type    = string
  default = "10"
}

variable "jvm_xms" {
  type    = string
  default = "512m"
}

variable "jvm_xmx" {
  type    = string
  default = "1538m"
}

variable "ec2_instance_profile_name" {
  description = "Instance profile EB EC2 (condiviso a livello account, garantito dalla pipeline)."
  type        = string
  default     = "aws-elasticbeanstalk-ec2-role"
}
