terraform {
  backend "s3" {
    # NB: bucket e region vengono riscritti dalla pipeline (backend-config)
    # prima di 'terraform init'. Il backend S3 non supporta variabili.
    bucket       = "PLACEHOLDER-STATE-BUCKET"
    key          = "beanstalk/app.tfstate"
    region       = "eu-west-1"
    use_lockfile = true
    encrypt      = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# Locals: stage -> tipo ambiente e costruzione dinamica dei setting EB.
# ---------------------------------------------------------------------------
locals {
  environment_type = var.environment_type != "" ? var.environment_type : (
    var.stage == "prod" ? "LoadBalanced" : "SingleInstance"
  )
  is_lb = local.environment_type == "LoadBalanced"

  # Env var applicative iniettate nell'ambiente (DB via JDBC, profilo, JWT, extra).
  app_env = merge(
    {
      SPRING_PROFILES_ACTIVE = var.spring_profile
      JDBC_DATABASE_URL      = var.jdbc_url
      JDBC_DATABASE_USERNAME = var.jdbc_username
      JDBC_DATABASE_PASSWORD = var.jdbc_password
      JWT_SECRET             = var.jwt_secret
    },
    var.extra_env
  )

  env_settings = [
    for k, v in local.app_env : {
      namespace = "aws:elasticbeanstalk:application:environment"
      name      = k
      value     = v
    }
  ]

  # Setting comuni a entrambi gli stage.
  base_settings = [
    # Networking
    { namespace = "aws:ec2:vpc", name = "VPCId", value = var.vpc_id },
    { namespace = "aws:ec2:vpc", name = "Subnets", value = var.subnets },
    { namespace = "aws:ec2:vpc", name = "AssociatePublicIpAddress", value = "true" },

    # Processo applicativo
    { namespace = "aws:elasticbeanstalk:environment:process:default", name = "Port", value = "80" },
    { namespace = "aws:elasticbeanstalk:environment:process:default", name = "HealthCheckPath", value = var.health_check_path },

    # Ruoli
    { namespace = "aws:elasticbeanstalk:environment", name = "ServiceRole", value = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-elasticbeanstalk-service-role" },
    { namespace = "aws:autoscaling:launchconfiguration", name = "IamInstanceProfile", value = var.ec2_instance_profile_name },

    # Launch configuration
    { namespace = "aws:autoscaling:launchconfiguration", name = "RootVolumeType", value = var.root_volume_type },
    { namespace = "aws:autoscaling:launchconfiguration", name = "RootVolumeSize", value = var.root_volume_size },
    { namespace = "aws:autoscaling:launchconfiguration", name = "InstanceType", value = var.instance_type },
    { namespace = "aws:ec2:instances", name = "SupportedArchitectures", value = var.instance_architecture },

    # JVM / proxy
    { namespace = "aws:elasticbeanstalk:environment:proxy", name = "ProxyServer", value = "apache" },
    { namespace = "aws:elasticbeanstalk:container:tomcat:jvmoptions", name = "Xms", value = var.jvm_xms },
    { namespace = "aws:elasticbeanstalk:container:tomcat:jvmoptions", name = "Xmx", value = var.jvm_xmx },

    # Health & logging
    { namespace = "aws:elasticbeanstalk:healthreporting:system", name = "SystemType", value = "enhanced" },
    { namespace = "aws:elasticbeanstalk:cloudwatch:logs", name = "StreamLogs", value = "true" },
    { namespace = "aws:elasticbeanstalk:cloudwatch:logs", name = "RetentionInDays", value = "7" },
    { namespace = "aws:elasticbeanstalk:cloudwatch:logs", name = "DeleteOnTerminate", value = "false" },

    # Managed platform updates
    { namespace = "aws:elasticbeanstalk:managedactions", name = "ManagedActionsEnabled", value = "true" },
    { namespace = "aws:elasticbeanstalk:managedactions", name = "PreferredStartTime", value = "Mon:08:50" },
    { namespace = "aws:elasticbeanstalk:managedactions:platformupdate", name = "UpdateLevel", value = "patch" },
  ]

  # Setting solo per ambienti bilanciati (prod).
  lb_settings = [
    { namespace = "aws:elasticbeanstalk:environment", name = "EnvironmentType", value = "LoadBalanced" },
    { namespace = "aws:elasticbeanstalk:environment", name = "LoadBalancerType", value = "application" },

    { namespace = "aws:elbv2:listener:443", name = "ListenerEnabled", value = "true" },
    { namespace = "aws:elbv2:listener:443", name = "Protocol", value = "HTTPS" },
    { namespace = "aws:elbv2:listener:443", name = "SSLCertificateArns", value = var.ssl_certificate_arn },
    { namespace = "aws:elbv2:listener:default", name = "ListenerEnabled", value = "false" },

    # Deployment rolling
    { namespace = "aws:elasticbeanstalk:command", name = "DeploymentPolicy", value = "RollingWithAdditionalBatch" },
    { namespace = "aws:elasticbeanstalk:command", name = "BatchSizeType", value = "Percentage" },
    { namespace = "aws:elasticbeanstalk:command", name = "BatchSize", value = "30" },
    { namespace = "aws:elasticbeanstalk:command", name = "Timeout", value = "600" },

    # Scaling
    { namespace = "aws:autoscaling:asg", name = "MinSize", value = var.min_size },
    { namespace = "aws:autoscaling:asg", name = "MaxSize", value = var.max_size },
    { namespace = "aws:autoscaling:asg", name = "Availability Zones", value = "Any" },
    { namespace = "aws:autoscaling:trigger", name = "MeasureName", value = "CPUUtilization" },
    { namespace = "aws:autoscaling:trigger", name = "Unit", value = "Percent" },
    { namespace = "aws:autoscaling:trigger", name = "Statistic", value = "Average" },
    { namespace = "aws:autoscaling:trigger", name = "Period", value = "5" },
    { namespace = "aws:autoscaling:trigger", name = "BreachDuration", value = "5" },
    { namespace = "aws:autoscaling:trigger", name = "UpperThreshold", value = "70" },
    { namespace = "aws:autoscaling:trigger", name = "UpperBreachScaleIncrement", value = "1" },
    { namespace = "aws:autoscaling:trigger", name = "LowerThreshold", value = "25" },
    { namespace = "aws:autoscaling:trigger", name = "LowerBreachScaleIncrement", value = "-1" },

    # Spot (risparmio in prod)
    { namespace = "aws:ec2:instances", name = "EnableSpot", value = "true" },
    { namespace = "aws:ec2:instances", name = "SpotFleetOnDemandBase", value = "1" },
    { namespace = "aws:ec2:instances", name = "SpotFleetOnDemandAboveBasePercentage", value = "70" },
    { namespace = "aws:ec2:instances", name = "SpotAllocationStrategy", value = "capacity-optimized" },
  ]

  # Setting solo per ambienti a istanza singola (dev, gratuito/non bilanciato).
  singleinstance_settings = [
    { namespace = "aws:elasticbeanstalk:environment", name = "EnvironmentType", value = "SingleInstance" },
  ]

  settings = concat(
    local.base_settings,
    local.env_settings,
    local.is_lb ? local.lb_settings : local.singleinstance_settings,
  )
}

# 1. Beanstalk Application
resource "aws_elastic_beanstalk_application" "app" {
  name        = var.application_name
  description = "Elastic Beanstalk application for ${var.project_tag}"

  tags = {
    PROJECT = var.project_tag
  }
}

# 2. Ambiente Elastic Beanstalk (setting generati dinamicamente per stage)
resource "aws_elastic_beanstalk_environment" "env" {
  name                = var.environment_name
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = var.solution_stack_name

  dynamic "setting" {
    for_each = local.settings
    content {
      namespace = setting.value.namespace
      name      = setting.value.name
      value     = setting.value.value
    }
  }

  tags = {
    PROJECT = var.project_tag
  }
}

# NB: il ruolo/instance profile EB EC2 (var.ec2_instance_profile_name) e'
# infrastruttura condivisa a livello di account: viene garantito esistente
# dalla pipeline e NON e' gestito qui, per evitare collisioni di state.
