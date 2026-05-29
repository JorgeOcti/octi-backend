# App secrets that the main stack DOESN'T own (provided by the user via the
# secrets stack) are looked up by name here. Apply terraform/secrets first;
# this stack will fail at plan time if a secret it expects doesn't exist.
#
# Anything DERIVED at apply-time (DocDB URI, IAM access keys) is managed as a
# resource right here — Terraform writes the value directly.

locals {
  # Looked-up secrets (provided externally via terraform/secrets).
  # Keep this list in sync with terraform/secrets/locals.tf::required_secret_keys.
  app_secret_keys = [
    "SECRET_KEY",
    "SENTRY_DNS",
    "PUSHER_INSTANCE_ID",
    "PUHSER_SECRET_KEY",
    "GEMINI_API_KEY",
    "MIXPANEL",
    "MAPBOX",
    "SALFA_SOAP",
  ]
}

data "aws_secretsmanager_secret" "app" {
  for_each = toset(local.app_secret_keys)
  name     = "${local.name}/app/${each.key}"
}

# --- Derived secrets (managed here because the value comes from main stack) --

locals {
  # Use the override URI if provided, otherwise the auto-generated DocDB URI.
  effective_mongodb_uri = var.mongodb_uri_override != "" ? var.mongodb_uri_override : local.docdb_uri
}

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name                    = "${local.name}/app/MONGODB_URI"
  description             = "MongoDB connection URI for ${local.name}"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  secret_id     = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = local.effective_mongodb_uri
}

resource "aws_secretsmanager_secret" "docdb_password" {
  name                    = "${local.name}/docdb/master_password"
  description             = "DocumentDB master password for ${local.name}"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "docdb_password" {
  secret_id     = aws_secretsmanager_secret.docdb_password.id
  secret_string = random_password.docdb_master.result
}

# IAM user access key for `mongoose-crate-s3`. The user + policy are
# defined in s3_uploads.tf.
resource "aws_secretsmanager_secret" "aws_access_key_id" {
  name                    = "${local.name}/app/AWS_ACCESS_KEY_ID"
  description             = "Access key for the andes-${local.env}-app-uploads IAM user"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "aws_access_key_id" {
  secret_id     = aws_secretsmanager_secret.aws_access_key_id.id
  secret_string = aws_iam_access_key.app_uploads.id
}

resource "aws_secretsmanager_secret" "aws_secret_access_key" {
  name                    = "${local.name}/app/AWS_SECRET_ACCESS_KEY"
  description             = "Secret access key for the andes-${local.env}-app-uploads IAM user"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "aws_secret_access_key" {
  secret_id     = aws_secretsmanager_secret.aws_secret_access_key.id
  secret_string = aws_iam_access_key.app_uploads.secret
}
