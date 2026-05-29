data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_route53_zone" "main" {
  name         = var.route53_zone_name
  private_zone = false
}
