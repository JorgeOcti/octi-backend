data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# OIDC identity provider for CircleCI.
#
# CircleCI mints a short-lived OIDC token per job. AWS validates the token
# against this provider and, if the trust policy below matches, issues
# temporary STS credentials. No long-lived access keys in CircleCI.
#
# The provider URL is unique per CircleCI organization: each org gets its
# own issuer at oidc.circleci.com/org/<ORG_ID>.
# ---------------------------------------------------------------------------

data "tls_certificate" "circleci_oidc" {
  url = "https://oidc.circleci.com"
}

resource "aws_iam_openid_connect_provider" "circleci" {
  url            = "https://oidc.circleci.com/org/${var.circleci_org_id}"
  client_id_list = [var.circleci_org_id]
  thumbprint_list = [
    data.tls_certificate.circleci_oidc.certificates[0].sha1_fingerprint,
  ]
}

# ---------------------------------------------------------------------------
# Trust policy — who can assume this role.
#
# - Federated principal: the OIDC provider above.
# - aud condition: token must be issued to this CircleCI org.
# - (Optional) sub condition: when circleci_project_id is set, only that
#   project's jobs can assume the role.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ci_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.circleci.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "oidc.circleci.com/org/${var.circleci_org_id}:aud"
      values   = [var.circleci_org_id]
    }

    dynamic "condition" {
      for_each = var.circleci_project_id == "" ? [] : [1]
      content {
        test     = "StringLike"
        variable = "oidc.circleci.com/org/${var.circleci_org_id}:sub"
        values   = ["org/${var.circleci_org_id}/project/${var.circleci_project_id}/*"]
      }
    }
  }
}

resource "aws_iam_role" "ci" {
  name               = "${var.project}-ci"
  description        = "Assumed by CircleCI via OIDC. Used by all environments."
  assume_role_policy = data.aws_iam_policy_document.ci_assume_role.json

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
