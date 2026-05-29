# Same S3 bucket as the main stack, different key.
# Workspaces (dev, prod) namespace the state under env:/<workspace>/.
terraform {
  backend "s3" {
    bucket       = "andes-backend-tfstate-785948112751"
    key          = "andes-backend/secrets.tfstate"
    region       = "sa-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
