output "state_bucket" {
  description = "S3 bucket holding Terraform state. Use as `bucket` in the main stack's backend config."
  value       = aws_s3_bucket.state.id
}

output "region" {
  description = "Region where the backend lives."
  value       = var.region
}
