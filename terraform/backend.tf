# Remote state.
#
# Bucket is provisioned by terraform/bootstrap. The bucket name includes the
# AWS account ID (globally unique) — adjust if your account differs.
# Workspaces (dev, prod) auto-isolate state under env:/<workspace>/<key>.
#
# Locking is done via S3 object locks (use_lockfile = true). The legacy
# DynamoDB lock table is no longer needed.
terraform {
  backend "s3" {
    bucket       = "andes-backend-tfstate-785948112751"
    key          = "andes-backend/terraform.tfstate"
    region       = "sa-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
