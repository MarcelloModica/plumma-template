output "environment_name" {
  description = "Nome dell'ambiente Elastic Beanstalk"
  value       = aws_elastic_beanstalk_environment.env.name
}

output "environment_type" {
  description = "Tipo di ambiente risolto (SingleInstance | LoadBalanced)"
  value       = local.environment_type
}

output "environment_url" {
  description = "URL/CNAME dell'ambiente Elastic Beanstalk"
  value       = aws_elastic_beanstalk_environment.env.cname
}

output "application_name" {
  description = "Nome della Elastic Beanstalk Application"
  value       = aws_elastic_beanstalk_application.app.name
}
