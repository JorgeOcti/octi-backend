output "name_prefix" {
  description = "Environment-scoped name prefix (project-workspace)."
  value       = local.name
}

output "secret_names" {
  description = "Fully-qualified Secrets Manager names that were created."
  value       = sort([for s in aws_secretsmanager_secret.app : s.name])
}

output "secret_arns" {
  description = "Map of short key → secret ARN."
  value       = { for k, s in aws_secretsmanager_secret.app : k => s.arn }
}
