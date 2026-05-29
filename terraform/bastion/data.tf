data "aws_caller_identity" "current" {}

# Look up the main stack's VPC by name.
data "aws_vpc" "main" {
  tags = { Name = "${local.name}-vpc" }
}

# Pick one private subnet for the bastion. Any of the AZs is fine.
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "tag:Name"
    values = ["${local.name}-vpc-private-*"]
  }
}

# Security groups we'll add bastion ingress to.
data "aws_security_group" "docdb" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "group-name"
    values = ["${local.name}-docdb"]
  }
}

data "aws_security_group" "redis" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  filter {
    name   = "group-name"
    values = ["${local.name}-redis"]
  }
}

# DocDB endpoint — read from the main stack's outputs.
# The same workspace name is used so dev bastion → dev DocDB, prod → prod.
data "terraform_remote_state" "main" {
  backend   = "s3"
  workspace = terraform.workspace

  config = {
    bucket = "andes-backend-tfstate-785948112751"
    key    = "andes-backend/terraform.tfstate"
    region = "sa-east-1"
  }
}

# Latest Amazon Linux 2023 ARM64 AMI. SSM agent pre-installed.
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-arm64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
