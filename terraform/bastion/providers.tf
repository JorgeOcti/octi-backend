provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project
      Environment = terraform.workspace
      Stack       = "bastion"
      ManagedBy   = "terraform"
    }
  }
}
