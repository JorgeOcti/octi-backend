variable "region" {
  description = "AWS region."
  type        = string
  default     = "sa-east-1"
}

variable "project" {
  description = "Project name. Must match the main stack."
  type        = string
  default     = "andes"
}

variable "secret_values" {
  description = <<-EOT
    Map of secret name → value. Provide via a gitignored env-specific tfvars file:
    `terraform apply -var-file=envs/dev.tfvars`.

    Any required secret missing from this map is created with placeholder
    string "REPLACE_ME". SECRET_KEY missing is also auto-generated if
    var.generate_secret_key is true.

    Keys not in `required_secret_keys` (see locals.tf) are still created — useful
    for ad-hoc additions without editing the Terraform code.

    SECURITY: these values will end up in the Terraform state file. The state
    bucket has SSE-AES256 + public-access-block, so they're only readable by
    principals with S3 read on the state bucket.
  EOT
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "generate_secret_key" {
  description = "If true and SECRET_KEY is not in var.secret_values, Terraform seeds it with a random 64-char value."
  type        = bool
  default     = true
}
