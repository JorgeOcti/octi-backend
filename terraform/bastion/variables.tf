variable "region" {
  description = "AWS region. Must match the main stack."
  type        = string
  default     = "sa-east-1"
}

variable "project" {
  description = "Project name. Must match the main stack."
  type        = string
  default     = "andes"
}

variable "instance_type" {
  description = "EC2 instance type for the bastion. Default is the cheapest practical option (~$3.9/mo when running)."
  type        = string
  default     = "t4g.nano"
}
