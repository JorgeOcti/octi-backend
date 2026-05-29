resource "random_password" "docdb_master" {
  length      = 32
  special     = false # DocumentDB rejects several special chars in the password
  min_lower   = 4
  min_upper   = 4
  min_numeric = 4
}

resource "aws_docdb_subnet_group" "main" {
  name       = "${local.name}-docdb"
  subnet_ids = module.vpc.database_subnets
}

resource "aws_docdb_cluster_parameter_group" "main" {
  family = "docdb5.0"
  name   = "${local.name}-docdb-pg"

  # TLS is required by default; mongoose connects with `tls=true`.
  parameter {
    name  = "tls"
    value = "enabled"
  }
}

resource "aws_docdb_cluster" "main" {
  cluster_identifier              = "${local.name}-docdb"
  engine                          = "docdb"
  engine_version                  = "5.0.0"
  master_username                 = var.docdb_master_username
  master_password                 = random_password.docdb_master.result
  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  backup_retention_period         = var.docdb.backup_retention
  preferred_backup_window         = "03:00-04:00"
  storage_encrypted               = true
  deletion_protection             = var.docdb.deletion_protection
  skip_final_snapshot             = var.docdb.skip_final_snapshot
  final_snapshot_identifier       = var.docdb.skip_final_snapshot ? null : "${local.name}-docdb-final-${formatdate("YYYYMMDDHHmmss", timestamp())}"

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

resource "aws_docdb_cluster_instance" "main" {
  count              = var.docdb.instance_count
  identifier         = "${local.name}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.docdb.instance_class
}

locals {
  # DocumentDB uses a TLS cert bundled with the AWS root CA. The app must point
  # `tlsCAFile` at /opt/global-bundle.pem (the repo already ships global-bundle.pem)
  # OR set tlsAllowInvalidCertificates=false with the bundle baked into the image.
  docdb_uri = format(
    "mongodb://%s:%s@%s:%s/%s?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false",
    var.docdb_master_username,
    random_password.docdb_master.result,
    aws_docdb_cluster.main.endpoint,
    aws_docdb_cluster.main.port,
    var.docdb_database_name,
  )
}
