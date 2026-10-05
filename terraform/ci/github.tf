# ---------------------------------------------------------------------------
# OIDC identity provider for GitHub Actions.
#
# Mismo mecanismo que CircleCI (main.tf): el workflow pide un token OIDC de
# corta vida, AWS lo valida contra este proveedor y, si la trust policy
# coincide, entrega credenciales temporales por STS. Sin claves estáticas.
#
# A diferencia de CircleCI, el issuer de GitHub es uno solo para todo el mundo
# —no lleva el id de la organización en la URL—, así que basta un proveedor y
# la restricción se hace en el `sub` del token.
#
# Convive con CircleCI a propósito: ambos asumen el MISMO rol
# (aws_iam_role.ci), así los permisos de ECR y ECS se definen una sola vez.
# Cuando la migración esté confirmada se puede vaciar `circleci_orgs` y este
# archivo sigue funcionando igual.
# ---------------------------------------------------------------------------

data "tls_certificate" "github_oidc" {
  count = length(var.github_repos) > 0 ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  count = length(var.github_repos) > 0 ? 1 : 0

  url = "https://token.actions.githubusercontent.com"

  # GitHub emite el token para STS, no para una organización concreta.
  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = [
    data.tls_certificate.github_oidc[0].certificates[0].sha1_fingerprint,
  ]
}

# ---------------------------------------------------------------------------
# Trust policy — qué repos y qué ramas pueden asumir el rol.
#
# El `sub` de GitHub tiene la forma:
#   repo:<owner>/<repo>:ref:refs/heads/<rama>
#
# Se restringe por rama y no con `repo:owner/repo:*` porque ese comodín
# habilita CUALQUIER workflow del repo —incluido el de un pull request— a
# asumir el rol y desplegar. Sólo deploy desde las ramas que realmente
# despliegan.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "github_assume_role" {
  dynamic "statement" {
    for_each = var.github_repos

    content {
      sid     = "AssumeFromGitHub${replace(replace(title(statement.key), "-", ""), "_", "")}"
      effect  = "Allow"
      actions = ["sts:AssumeRoleWithWebIdentity"]

      principals {
        type        = "Federated"
        identifiers = [aws_iam_openid_connect_provider.github[0].arn]
      }

      condition {
        test     = "StringEquals"
        variable = "token.actions.githubusercontent.com:aud"
        values   = ["sts.amazonaws.com"]
      }

      condition {
        test     = "StringLike"
        variable = "token.actions.githubusercontent.com:sub"
        values = [
          for ref in statement.value.refs :
          "repo:${coalesce(statement.value.subject_repo, statement.value.repo)}:ref:${ref}"
        ]
      }
    }
  }
}
