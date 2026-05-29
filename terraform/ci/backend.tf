# Account-level (not per-env). The OIDC provider URL is globally unique in
# the account, so this stack uses a single state — no workspaces.
terraform {
  backend "s3" {
    bucket       = "andes-backend-tfstate-785948112751"
    key          = "andes-backend/ci.tfstate"
    region       = "sa-east-1"
    use_lockfile = true
    encrypt      = true
  }
}
