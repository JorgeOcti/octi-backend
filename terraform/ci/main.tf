data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# OIDC identity providers for CircleCI — one per organization.
#
# CircleCI mints a short-lived OIDC token per job. AWS validates the token
# against the matching provider and, if the trust policy below matches, issues
# temporary STS credentials. No long-lived access keys in CircleCI.
#
# The provider URL is unique per CircleCI organization (the org UUID is part of
# the issuer), so deploying the same app from two Bitbucket workspaces needs two
# providers. They share one role, so `ci_role_arn` is the same for every org and
# nothing in CircleCI has to change when an org is added.
# ---------------------------------------------------------------------------

data "tls_certificate" "circleci_oidc" {
  url = "https://oidc.circleci.com"
}

resource "aws_iam_openid_connect_provider" "circleci" {
  for_each = var.circleci_orgs

  url            = "https://oidc.circleci.com/org/${each.value.org_id}"
  client_id_list = [each.value.org_id]
  thumbprint_list = [
    data.tls_certificate.circleci_oidc.certificates[0].sha1_fingerprint,
  ]
}

# Preserves the provider created when this stack handled a single org, so
# switching to for_each is a state move rather than a destroy/create. Only one
# provider per issuer URL can exist in an account, so a replace would have taken
# CI down for the existing org.
moved {
  from = aws_iam_openid_connect_provider.circleci
  to   = aws_iam_openid_connect_provider.circleci["osacontrol"]
}

# ---------------------------------------------------------------------------
# Trust policy — who can assume this role.
#
# One statement per org:
# - Federated principal: that org's OIDC provider.
# - aud condition: token must be issued to that CircleCI org.
# - (Optional) sub condition: when project_id is set, only that project's jobs
#   can assume the role. The sub claim looks like
#   org/<org>/project/<project>/user/<user>, hence the trailing wildcard.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ci_assume_role" {
  dynamic "statement" {
    for_each = var.circleci_orgs

    content {
      sid     = "AssumeFrom${replace(title(statement.key), "-", "")}"
      effect  = "Allow"
      actions = ["sts:AssumeRoleWithWebIdentity"]

      principals {
        type        = "Federated"
        identifiers = [aws_iam_openid_connect_provider.circleci[statement.key].arn]
      }

      condition {
        test     = "StringEquals"
        variable = "oidc.circleci.com/org/${statement.value.org_id}:aud"
        values   = [statement.value.org_id]
      }

      dynamic "condition" {
        for_each = statement.value.project_id == "" ? [] : [1]
        content {
          test     = "StringLike"
          variable = "oidc.circleci.com/org/${statement.value.org_id}:sub"
          values   = ["org/${statement.value.org_id}/project/${statement.value.project_id}/*"]
        }
      }
    }
  }
}

# Un solo rol para los dos proveedores: los permisos de ECR/ECS se definen una
# vez y no se desincronizan entre CI viejo y nuevo. Ver github.tf.
data "aws_iam_policy_document" "ci_assume_role_combined" {
  source_policy_documents = compact([
    length(var.circleci_orgs) > 0 ? data.aws_iam_policy_document.ci_assume_role.json : "",
    length(var.github_repos) > 0 ? data.aws_iam_policy_document.github_assume_role.json : "",
  ])
}

resource "aws_iam_role" "ci" {
  name               = "${var.project}-ci"
  description        = "Assumed by CircleCI and GitHub Actions via OIDC. Used by all environments."
  assume_role_policy = data.aws_iam_policy_document.ci_assume_role_combined.json

  # OIDC sessions are short-lived; cap at 1 hour for safety.
  max_session_duration = 3600
}

# ---------------------------------------------------------------------------
# Permissions the CI role has once assumed.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ci" {
  # ECR — get auth token (must be * per AWS).
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  # ECR — push to the env-specific repos only.
  statement {
    sid    = "EcrPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:ListImages",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = local.ecr_repo_arns
  }

  # ECS — describe services + clusters (for `aws ecs wait services-stable`).
  statement {
    sid    = "EcsDescribe"
    effect = "Allow"
    actions = [
      "ecs:DescribeServices",
      "ecs:DescribeTasks",
      "ecs:DescribeTaskDefinition",
      "ecs:ListTasks",
      "ecs:ListServices",
    ]
    resources = ["*"]
    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values   = local.ecs_cluster_arns
    }
  }

  # ECS — roll specific services.
  statement {
    sid    = "EcsUpdateService"
    effect = "Allow"
    actions = [
      "ecs:UpdateService",
    ]
    resources = local.ecs_service_arns
  }
}

resource "aws_iam_role_policy" "ci" {
  name   = "${var.project}-ci"
  role   = aws_iam_role.ci.id
  policy = data.aws_iam_policy_document.ci.json
}
