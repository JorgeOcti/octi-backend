locals {
  env  = terraform.workspace
  name = "${var.project}-${local.env}"

  domain = var.subdomain == "" ? var.route53_zone_name : "${var.subdomain}.${var.route53_zone_name}"

  common_tags = {
    Project     = var.project
    Environment = local.env
    ManagedBy   = "terraform"
  }
}
