locals {
  env  = terraform.workspace
  name = "${var.project}-${local.env}"
}
