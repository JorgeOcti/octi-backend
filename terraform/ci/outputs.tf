output "ci_role_arn" {
  description = "ARN of the IAM role CircleCI assumes. Paste this into the CircleCI context (env var AWS_ROLE_ARN)."
  value       = aws_iam_role.ci.arn
}

output "oidc_provider_arn" {
  description = "ARN of the CircleCI OIDC identity provider."
  value       = aws_iam_openid_connect_provider.circleci.arn
}

output "oidc_provider_url" {
  description = "Issuer URL of the CircleCI OIDC identity provider."
  value       = aws_iam_openid_connect_provider.circleci.url
}
