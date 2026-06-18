variable "region" {
  description = "AWS region."
  type        = string
  default     = "sa-east-1"
}

variable "project" {
  description = "Project name. Used as a name prefix for all resources."
  type        = string
  default     = "andes"
}

# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.30.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of AZs to span. 2 is enough for dev; 3 recommended for prod."
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway (cheaper, dev) or one per AZ (HA, prod)."
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# DNS / TLS
# ---------------------------------------------------------------------------
variable "route53_zone_name" {
  description = "Existing Route53 hosted zone name (e.g. `bwg.cl`). Looked up via data source."
  type        = string
}

variable "subdomain" {
  description = "Subdomain under the hosted zone (e.g. `andes-dev` for andes-dev.bwg.cl). Leave empty to use the apex."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# App container
# ---------------------------------------------------------------------------
variable "container_port" {
  description = "Port the Express app listens on inside the container."
  type        = number
  default     = 3030
}

variable "image_tag" {
  description = "Docker image tag to deploy. CircleCI typically passes the commit SHA. Defaults to `latest`."
  type        = string
  default     = "latest"
}

variable "node_env" {
  description = "Value for the ENV/NODE_ENV variable inside the container."
  type        = string
  default     = "production"
}

variable "ses_region" {
  description = "Region used for SES (kept separate from var.region)."
  type        = string
  default     = "us-west-2"
}

variable "site_url" {
  description = "Public-facing site URL the app should advertise."
  type        = string
  default     = ""
}

variable "mongodb_uri_override" {
  description = <<-EOT
    Temporarily route the app at a non-DocumentDB MongoDB (e.g. MongoDB Atlas)
    while you work on the migration. When empty (default), the auto-generated
    DocDB URI is used. When set:
      - this URI is written to Secrets Manager (andes-<env>/app/MONGODB_URI)
      - MONGO_TLS_CA_FILE is cleared in the ECS task env so connectMongo
        skips DocDB-specific TLS handling (Atlas uses public CAs)
    Apply -> roll the services with `aws ecs update-service --force-new-deployment`.
    To switch back to DocDB: unset this variable and apply again.
  EOT
  type        = string
  default     = ""
  sensitive   = true
}

variable "s3_bucket" {
  description = "Name of the S3 bucket the app uploads to. Surfaced to the container as S3_BUCKET (plain env var, not a secret) and used to scope the IAM task role."
  type        = string
}

variable "allowed_referer_domains" {
  description = <<-EOT
    Hostnames allowed to load objects from the uploads bucket. Each becomes an
    `aws:Referer` match (`https://<domain>/*`) in a public-read bucket policy:
    objects become publicly readable, but only when the browser sends a Referer
    header matching one of these domains (so images render on our own sites but
    not when hotlinked elsewhere or opened directly). Leave empty to keep the
    bucket private (no public policy is attached).

    NOTE: Referer is set by the client and can be forged — this is hotlink
    protection, not strong access control. For hard guarantees, front the bucket
    with CloudFront + signed URLs / OAC instead.
  EOT
  type        = list(string)
  default     = []
}

# ---------------------------------------------------------------------------
# ECS sizing
# ---------------------------------------------------------------------------
variable "web" {
  description = "Sizing for the web ECS service."
  type = object({
    cpu           = number
    memory        = number
    desired_count = number
    min_count     = number
    max_count     = number
  })
  default = {
    cpu           = 1024
    memory        = 2048
    desired_count = 1
    min_count     = 1
    max_count     = 4
  }
}

variable "worker" {
  description = "Sizing for the worker ECS service."
  type = object({
    cpu           = number
    memory        = number
    desired_count = number
  })
  default = {
    cpu           = 1024
    memory        = 2048
    desired_count = 1
  }
}

variable "billing" {
  description = "Sizing for the scheduled billing task."
  type = object({
    cpu      = number
    memory   = number
    schedule = string # EventBridge cron expression
    enabled  = bool
  })
  default = {
    cpu      = 1024
    memory   = 2048
    schedule = "cron(0 1 1 * ? *)" # 01:00 UTC on the 1st of each month
    enabled  = true
  }
}

# ---------------------------------------------------------------------------
# DocumentDB
# ---------------------------------------------------------------------------
variable "docdb" {
  description = "DocumentDB cluster sizing."
  type = object({
    instance_class      = string
    instance_count      = number
    backup_retention    = number
    deletion_protection = bool
    skip_final_snapshot = bool
  })
  default = {
    instance_class      = "db.t3.medium"
    instance_count      = 1
    backup_retention    = 7
    deletion_protection = false
    skip_final_snapshot = true
  }
}

variable "docdb_master_username" {
  description = "DocumentDB master username."
  type        = string
  default     = "osacontrol"
}

variable "docdb_database_name" {
  description = "Logical DB name used in the connection string."
  type        = string
  default     = "osaAndes"
}

# ---------------------------------------------------------------------------
# ElastiCache Redis
# ---------------------------------------------------------------------------
variable "redis" {
  description = "ElastiCache Redis sizing."
  type = object({
    node_type            = string
    num_cache_nodes      = number
    engine_version       = string
    parameter_group_name = string
    transit_encryption   = bool
  })
  default = {
    node_type            = "cache.t4g.micro"
    num_cache_nodes      = 1
    engine_version       = "7.0"
    parameter_group_name = "default.redis7"
    transit_encryption   = false
  }
}
