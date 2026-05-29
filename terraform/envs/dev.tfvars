project = "andes"
region  = "sa-east-1"

# DNS — change to your zone.
route53_zone_name = "octimize.cl"
subdomain         = "octi"

# S3 bucket the app uploads to. Must exist (Terraform doesn't create it).
s3_bucket = "andes-uploads-dev"

# Cost-tuned for dev.
single_nat_gateway       = true
availability_zones_count = 2

web = {
  cpu           = 512
  memory        = 1024
  desired_count = 1
  min_count     = 1
  max_count     = 2
}

worker = {
  cpu           = 512
  memory        = 1024
  desired_count = 1
}

billing = {
  cpu      = 512
  memory   = 1024
  schedule = "cron(0 1 1 * ? *)"
  enabled  = false # don't run billing in dev by default
}

docdb = {
  instance_class      = "db.t3.medium"
  instance_count      = 1
  backup_retention    = 1
  deletion_protection = false
  skip_final_snapshot = true
}

redis = {
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  engine_version       = "7.0"
  parameter_group_name = "default.redis7"
  transit_encryption   = false
}

mongodb_uri_override = "mongodb+srv://osacontrol:ENu5FyOjyTzScmmr@clusterandes.uln1t.mongodb.net/osaAndesProduction?authSource=admin&readPreference=secondary"
