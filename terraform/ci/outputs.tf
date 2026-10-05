output "ci_role_arn" {
  description = "ARN of the IAM role CircleCI assumes. Paste this into the CircleCI context (env var AWS_ROLE_ARN)."
  value       = aws_iam_role.ci.arn
}

output "oidc_provider_arns" {
  description = "ARNs of the CircleCI OIDC identity providers, keyed by org name."
  value       = { for k, v in aws_iam_openid_connect_provider.circleci : k => v.arn }
}

output "oidc_provider_urls" {
  description = "Issuer URLs of the CircleCI OIDC identity providers, keyed by org name."
  value       = { for k, v in aws_iam_openid_connect_provider.circleci : k => v.url }
}

output "github_oidc_provider_arn" {
  description = "ARN del proveedor OIDC de GitHub Actions (vacío si no hay repos configurados)."
  value       = try(aws_iam_openid_connect_provider.github[0].arn, null)
}
