locals {
  tags = {
    Project   = var.project_name
    ManagedBy = "terraform"
  }

  object_resource_arns = [
    for target in values(var.deploy_targets) :
    target.deploy_prefix == "" ?
    "arn:aws:s3:::${target.bucket_name}/*" :
    "arn:aws:s3:::${target.bucket_name}/${trimsuffix(target.deploy_prefix, "/")}/*"
  ]

  cloudfront_distribution_arns = compact([
    for target in values(var.deploy_targets) : target.cloudfront_distribution_arn
  ])
}

resource "aws_s3_bucket" "site" {
  for_each = var.deploy_targets

  bucket = each.value.bucket_name

  tags = merge(local.tags, {
    Name       = each.value.bucket_name
    DeployKey  = each.key
    DeployPath = each.value.deploy_prefix == "" ? "/" : "/${trimsuffix(each.value.deploy_prefix, "/")}/"
  })
}

resource "aws_s3_bucket_ownership_controls" "site" {
  for_each = aws_s3_bucket.site

  bucket = each.value.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  for_each = var.deploy_targets

  bucket = aws_s3_bucket.site[each.key].id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = !each.value.public_read
  restrict_public_buckets = !each.value.public_read
}

resource "aws_s3_bucket_website_configuration" "site" {
  for_each = {
    for key, target in var.deploy_targets : key => target
    if target.website_enabled
  }

  bucket = aws_s3_bucket.site[each.key].id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = each.value.deploy_prefix == "" ? "index.html" : "${trimsuffix(each.value.deploy_prefix, "/")}/index.html"
  }
}

resource "aws_s3_bucket_policy" "public_read" {
  for_each = {
    for key, target in var.deploy_targets : key => target
    if target.public_read
  }

  bucket = aws_s3_bucket.site[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadSiteObjects"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = each.value.deploy_prefix == "" ? "${aws_s3_bucket.site[each.key].arn}/*" : "${aws_s3_bucket.site[each.key].arn}/${trimsuffix(each.value.deploy_prefix, "/")}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.site]
}

resource "aws_iam_user" "github_actions_deploy" {
  count = var.create_github_actions_deploy_user ? 1 : 0

  name = var.github_actions_deploy_user_name
  tags = local.tags
}

resource "aws_iam_policy" "github_actions_deploy" {
  count = var.create_github_actions_deploy_user ? 1 : 0

  name        = "${var.project_name}-github-actions-deploy"
  description = "Allows GitHub Actions to deploy Loop static assets to configured S3 targets."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "ListTargetBuckets"
          Effect = "Allow"
          Action = [
            "s3:ListBucket"
          ]
          Resource = [
            for target in values(var.deploy_targets) : "arn:aws:s3:::${target.bucket_name}"
          ]
        },
        {
          Sid    = "SyncTargetObjects"
          Effect = "Allow"
          Action = [
            "s3:DeleteObject",
            "s3:GetObject",
            "s3:PutObject"
          ]
          Resource = local.object_resource_arns
        }
      ],
      length(local.cloudfront_distribution_arns) == 0 ? [] : [
        {
          Sid    = "InvalidateCloudFront"
          Effect = "Allow"
          Action = [
            "cloudfront:CreateInvalidation"
          ]
          Resource = local.cloudfront_distribution_arns
        }
      ]
    )
  })
}

resource "aws_iam_user_policy_attachment" "github_actions_deploy" {
  count = var.create_github_actions_deploy_user ? 1 : 0

  user       = aws_iam_user.github_actions_deploy[0].name
  policy_arn = aws_iam_policy.github_actions_deploy[0].arn
}
