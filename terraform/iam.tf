# ---------------------------------------------------------------------------
# ECS task execution role — used by the ECS agent to pull images, write logs,
# and fetch secrets at task startup.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${local.name}-task-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "task_execution_secrets" {
  statement {
    effect  = "Allow"
    actions = ["secretsmanager:GetSecretValue"]
    resources = concat(
      [for s in data.aws_secretsmanager_secret.app : s.arn],
      [
        aws_secretsmanager_secret.mongodb_uri.arn,
        aws_secretsmanager_secret.aws_access_key_id.arn,
        aws_secretsmanager_secret.aws_secret_access_key.arn,
      ],
    )
  }
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  name   = "${local.name}-task-execution-secrets"
  role   = aws_iam_role.task_execution.id
  policy = data.aws_iam_policy_document.task_execution_secrets.json
}

# ---------------------------------------------------------------------------
# Task role — what the app code can do at runtime.
#
# This is what the AWS SDK picks up automatically when no static credentials
# are in the environment. SDK-based callsites (SES, AWS.S3, future v3 clients)
# get these permissions for free via the ECS metadata endpoint.
#
# The legacy mongoose-crate-s3 library does NOT use the SDK and can't consume
# this role — its callsites still rely on AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
# from Secrets Manager (see terraform/secrets/locals.tf). Once that library is
# replaced, this role covers everything.
# ---------------------------------------------------------------------------

resource "aws_iam_role" "task" {
  name               = "${local.name}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "task" {
  # SES — transactional emails sent by the app.
  statement {
    sid       = "SesSend"
    effect    = "Allow"
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }

  # S3 — scoped to the bucket name passed in via var.s3_bucket.
  statement {
    sid    = "S3ObjectAccess"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:GetObjectAcl",
      "s3:PutObjectAcl",
    ]
    resources = ["arn:aws:s3:::${var.s3_bucket}/*"]
  }

  statement {
    sid       = "S3BucketAccess"
    effect    = "Allow"
    actions   = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = ["arn:aws:s3:::${var.s3_bucket}"]
  }

  # ECS Exec — lets `aws ecs execute-command` open an interactive session
  # into the running task. The SSM agent embedded in the container talks to
  # the ssmmessages.* endpoints over these channels.
  statement {
    sid    = "EcsExecSsmMessaging"
    effect = "Allow"
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "task" {
  name   = "${local.name}-task"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task.json
}

# ---------------------------------------------------------------------------
# EventBridge scheduler role — invokes ECS RunTask for the billing job.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "events_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "events_run_task" {
  name               = "${local.name}-events-run-task"
  assume_role_policy = data.aws_iam_policy_document.events_assume.json
}

data "aws_iam_policy_document" "events_run_task" {
  statement {
    effect    = "Allow"
    actions   = ["ecs:RunTask"]
    resources = ["*"]
    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values   = [aws_ecs_cluster.main.arn]
    }
  }

  statement {
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.task_execution.arn, aws_iam_role.task.arn]
  }
}

resource "aws_iam_role_policy" "events_run_task" {
  name   = "${local.name}-events-run-task"
  role   = aws_iam_role.events_run_task.id
  policy = data.aws_iam_policy_document.events_run_task.json
}
