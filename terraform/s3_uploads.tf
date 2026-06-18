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

# ---------------------------------------------------------------------------
# Public-but-domain-restricted read access to the uploads bucket.
#
# Objects are uploaded with `bucket-owner-full-control` (not public-read), so
# they're only readable via this bucket policy. The policy grants anonymous
# `s3:GetObject` ONLY when the request carries a Referer header matching one of
# var.allowed_referer_domains — so images render on our own front-ends but not
# when hotlinked from another site or opened directly.
#
# Caveat: Referer is supplied by the client and can be forged. This is hotlink
# protection, not strong security. For real guarantees, front the bucket with
# CloudFront + signed URLs / OAC.
#
# The bucket itself is NOT managed by Terraform (see var.s3_bucket); these
# resources attach to the existing bucket by name. This `aws_s3_bucket_policy`
# owns the bucket's ENTIRE policy — any policy set outside Terraform is replaced
# on apply. All three resources are gated on var.allowed_referer_domains: with
# an empty list nothing is created and the bucket stays private.
# ---------------------------------------------------------------------------

resource "aws_s3_bucket_public_access_block" "uploads" {
  count  = length(var.allowed_referer_domains) > 0 ? 1 : 0
  bucket = var.s3_bucket

  # Objects use bucket-owner-full-control, so keep public ACLs blocked entirely.
  block_public_acls  = true
  ignore_public_acls = true

  # The referer policy below is classed as a "public" policy by S3, so these
  # must be false or S3 rejects the PutBucketPolicy / ignores the policy.
  block_public_policy     = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "uploads_public_read" {
  count = length(var.allowed_referer_domains) > 0 ? 1 : 0

  statement {
    sid     = "PublicReadForAllowedReferers"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    resources = ["arn:aws:s3:::${var.s3_bucket}/*"]

    condition {
      test     = "StringLike"
      variable = "aws:Referer"
      values   = [for d in var.allowed_referer_domains : "https://${d}/*"]
    }
  }
}

resource "aws_s3_bucket_policy" "uploads" {
  count  = length(var.allowed_referer_domains) > 0 ? 1 : 0
  bucket = var.s3_bucket
  policy = data.aws_iam_policy_document.uploads_public_read[0].json

  # The public access block must permit a public policy before we attach one.
  depends_on = [aws_s3_bucket_public_access_block.uploads]
}
