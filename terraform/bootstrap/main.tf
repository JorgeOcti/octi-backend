provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

locals {
  bucket_name = coalesce(var.state_bucket_name, "${var.project}-tfstate-${data.aws_caller_identity.current.account_id}")

  tags = {
    Project   = var.project
    ManagedBy = "terraform"
    Purpose   = "tfstate-bootstrap"
  }
}

resource "aws_s3_bucket" "state" {
  bucket = local.bucket_name
  tags   = local.tags
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
