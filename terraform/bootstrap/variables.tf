variable "region" {
  description = "AWS region for the Terraform state backend."
  type        = string
  default     = "sa-east-1"
}

variable "project" {
  description = "Project name. Used as a prefix for the state bucket and lock table."
  type        = string
  default     = "andes-backend"
}

variable "state_bucket_name" {
  description = "Override the auto-generated S3 bucket name for Terraform state. Must be globally unique."
  type        = string
  default     = ""
}
