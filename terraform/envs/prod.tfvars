project = "andes"
region  = "sa-east-1"

# DNS — change to your zone.
route53_zone_name = "example.com"
subdomain         = "andes"

# S3 bucket the app uploads to. Must exist (Terraform doesn't create it).
s3_bucket = "andes-uploads-prod"

# Domains whose browsers may load uploaded images (matched via aws:Referer).
# Empty list = bucket stays private.
allowed_referer_domains = ["andes.osacontrol.com", "octi.octimize.cl"]

# HA for prod.
single_nat_gateway       = false
availability_zones_count = 3

web = {
  cpu           = 1024
  memory        = 2048
  desired_count = 2
  min_count     = 2
  max_count     = 8
}

billing = {
  cpu      = 1024
  memory   = 2048
  schedule = "cron(0 1 1 * ? *)"
  enabled  = true
}

docdb = {
  instance_class      = "db.r6g.large"
  instance_count      = 2
  backup_retention    = 14
  deletion_protection = true
  skip_final_snapshot = false
}

redis = {
  node_type            = "cache.t4g.small"
  num_cache_nodes      = 2
  engine_version       = "7.0"
  parameter_group_name = "default.redis7"
  transit_encryption   = true
}
