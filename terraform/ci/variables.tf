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

variable "circleci_org_id" {
  description = "CircleCI organization UUID. Find in CircleCI UI: Organization Settings → Overview → Organization ID."
  type        = string
}

variable "circleci_project_id" {
  description = "(Optional) CircleCI project UUID. If set, the assume-role trust policy is scoped to this project. Find in Project Settings → Overview → Project ID. Leave empty to allow any project in the org to assume the role (less secure)."
  type        = string
  default     = ""
}

variable "environments" {
  description = "Environments the CI role can deploy to. Used to scope IAM permissions to the specific ECR repos and ECS services."
  type        = list(string)
  default     = ["dev", "prod"]
}
