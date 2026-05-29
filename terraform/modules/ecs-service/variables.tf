variable "name" {
  description = "Service name (suffix). Final resource name is name_prefix-name."
  type        = string
}

variable "name_prefix" {
  description = "Prefix used for all named resources."
  type        = string
}

variable "cluster_id" {
  description = "ECS cluster id (arn) to attach the service to."
  type        = string
}

variable "image" {
  description = "Container image URI (repo:tag)."
  type        = string
}

variable "command" {
  description = "Container command override. Empty list keeps the image default."
  type        = list(string)
  default     = []
}

variable "container_port" {
  description = "Port exposed by the container. Only used when an ALB target group is wired."
  type        = number
  default     = 0
}

variable "cpu" {
  description = "Fargate task CPU units."
  type        = number
}

variable "memory" {
  description = "Fargate task memory (MiB)."
  type        = number
}

variable "desired_count" {
  description = "Desired running task count."
  type        = number
  default     = 1
}

variable "environment" {
  description = "Plain environment variables: name → value."
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Secret env vars: container var name → Secrets Manager secret ARN."
  type        = map(string)
  default     = {}
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN (used by the agent to pull images / fetch secrets)."
  type        = string
}

variable "task_role_arn" {
  description = "Task role ARN (used by app code at runtime)."
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for task ENIs."
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security groups attached to task ENIs."
  type        = list(string)
}

variable "log_group_name" {
  description = "CloudWatch Log group name for awslogs driver."
  type        = string
}

variable "log_region" {
  description = "Region for the log group (usually same as the AWS provider)."
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN to attach. Leave null for worker-style services."
  type        = string
  default     = null
}

variable "health_check_path" {
  description = "HTTP health check path for the container-level health check. Empty = no container healthcheck."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Extra tags."
  type        = map(string)
  default     = {}
}
