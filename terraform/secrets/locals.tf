locals {
  env  = terraform.workspace
  name = "${var.project}-${local.env}"

  # Canonical list of secrets the app needs. Every key here gets a Secrets
  # Manager entry, even if no value is provided (placeholder fallback).
  #
  # AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are NOT here — they're
  # provisioned by the main stack (terraform/s3_uploads.tf), which creates
  # a dedicated IAM user and writes the access key directly to Secrets Manager.
  required_secret_keys = [
    "SECRET_KEY",
    "SENTRY_DNS",
    "PUSHER_INSTANCE_ID",
    "PUHSER_SECRET_KEY", # sic — matches the typo in the existing app
    "GEMINI_API_KEY",
    "MIXPANEL",
    "MAPBOX",
    "SALFA_SOAP",
  ]

  # All secrets to create = required + any extras passed via secret_values.
  # nonsensitive() on the keys: secret NAMES (e.g. "SENTRY_DNS") aren't
  # sensitive even though the map is — only the values are. Terraform's
  # sensitive propagation is conservative; we tell it the keys are safe to
  # use as for_each identifiers.
  secret_keys = toset(concat(
    local.required_secret_keys,
    nonsensitive(keys(var.secret_values)),
  ))

  # Resolved value for each secret. Resolution order:
  #   1. user-provided value in var.secret_values (per env)
  #   2. random_password for SECRET_KEY (if generate_secret_key = true)
  #   3. "REPLACE_ME" placeholder
  secret_values_resolved = {
    for key in local.secret_keys :
    key => (
      contains(keys(var.secret_values), key) ? var.secret_values[key] :
      (key == "SECRET_KEY" && var.generate_secret_key) ? random_password.session_secret[0].result :
      "REPLACE_ME"
    )
  }

  common_tags = {
    Project     = var.project
    Environment = local.env
    ManagedBy   = "terraform"
    Stack       = "secrets"
  }
}
