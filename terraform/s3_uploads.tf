# Dedicated IAM user for the legacy `mongoose-crate-s3` library.
#
# The library uses `knox`, which doesn't support the AWS SDK credential
# provider chain (so the ECS task role can't be used). It requires explicit
# static keys. We create them here, scope them tightly to the uploads
# bucket, and inject them into the ECS task via Secrets Manager.
#
# When mongoose-crate-s3 is eventually replaced, delete this whole file and
# the task role takes over (it already has the same S3 permissions).

resource "aws_iam_user" "app_uploads" {
  name = "${local.name}-app-uploads"
  path = "/app/"
}

resource "aws_iam_access_key" "app_uploads" {
  user = aws_iam_user.app_uploads.name
  # To rotate: `terraform taint aws_iam_access_key.app_uploads && terraform apply`
}

data "aws_iam_policy_document" "app_uploads" {
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
}

resource "aws_iam_user_policy" "app_uploads" {
  name   = "${local.name}-app-uploads"
  user   = aws_iam_user.app_uploads.name
  policy = data.aws_iam_policy_document.app_uploads.json
}
