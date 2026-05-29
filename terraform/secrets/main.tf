resource "aws_secretsmanager_secret" "app" {
  for_each = local.secret_keys

  name                    = "${local.name}/app/${each.key}"
  description             = "App secret '${each.key}' for ${local.name}"
  recovery_window_in_days = 0
}

# Optional auto-generated value for SECRET_KEY. Only used when the user
# doesn't provide one via var.secret_values["SECRET_KEY"].
resource "random_password" "session_secret" {
  count   = var.generate_secret_key ? 1 : 0
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret_version" "app" {
  for_each = aws_secretsmanager_secret.app

  secret_id     = each.value.id
  secret_string = local.secret_values_resolved[each.key]
}
