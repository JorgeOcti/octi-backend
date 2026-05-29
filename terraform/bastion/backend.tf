# Workspace-aware (dev/prod) so the bastion targets the matching env's VPC.
terraform {
  backend "s3" {
    bucket       = "andes-backend-tfstate-785948112751"
    key          = "andes-backend/bastion.tfstate"
    region       = "sa-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
