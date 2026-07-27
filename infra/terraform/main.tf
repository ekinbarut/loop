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

locals {
  shopier_access_token_secret_arn = var.shopier_access_token_secret_arn != "" ? var.shopier_access_token_secret_arn : try(aws_secretsmanager_secret.shopier_access_token[0].arn, "")
}

resource "aws_secretsmanager_secret" "shopier_access_token" {
  count = var.enable_shopier_products_api && var.shopier_access_token_secret_arn == "" ? 1 : 0

  name        = var.shopier_access_token_secret_name
  description = "Shopier PAT/access token for Loop product listing API. Secret value is managed manually."
  tags        = local.tags
}

data "archive_file" "shopier_products_lambda" {
  count = var.enable_shopier_products_api ? 1 : 0

  type        = "zip"
  source_dir  = "${path.module}/../lambda/shopier-products"
  output_path = "${path.module}/.terraform/shopier-products.zip"
}

resource "aws_iam_role" "shopier_products_lambda" {
  count = var.enable_shopier_products_api ? 1 : 0

  name = "${var.project_name}-shopier-products-lambda"
  tags = local.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "shopier_products_lambda" {
  count = var.enable_shopier_products_api ? 1 : 0

  name = "${var.project_name}-shopier-products-lambda"
  role = aws_iam_role.shopier_products_lambda[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "WriteLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Sid    = "ReadShopierToken"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = local.shopier_access_token_secret_arn
      }
    ]
  })
}

resource "aws_lambda_function" "shopier_products" {
  count = var.enable_shopier_products_api ? 1 : 0

  function_name    = "${var.project_name}-shopier-products"
  role             = aws_iam_role.shopier_products_lambda[0].arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.shopier_products_lambda[0].output_path
  source_code_hash = data.archive_file.shopier_products_lambda[0].output_base64sha256
  timeout          = 10
  memory_size      = 128
  tags             = local.tags

  environment {
    variables = {
      ALLOWED_ORIGINS                 = join(",", var.shopier_products_allowed_origins)
      SHOPIER_ACCESS_TOKEN_SECRET_ARN = local.shopier_access_token_secret_arn
      SHOPIER_API_BASE_URL            = "https://api.shopier.com/v1"
      SHOPIER_PRODUCTS_LIMIT          = tostring(var.shopier_products_limit)
    }
  }
}

resource "aws_apigatewayv2_api" "shopier_products" {
  count = var.enable_shopier_products_api ? 1 : 0

  name          = "${var.project_name}-shopier-products"
  protocol_type = "HTTP"
  tags          = local.tags

  cors_configuration {
    allow_headers = ["content-type", "authorization"]
    allow_methods = ["GET", "OPTIONS"]
    allow_origins = var.shopier_products_allowed_origins
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "shopier_products" {
  count = var.enable_shopier_products_api ? 1 : 0

  api_id                 = aws_apigatewayv2_api.shopier_products[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.shopier_products[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "shopier_products" {
  count = var.enable_shopier_products_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.shopier_products[0].id
  route_key = "GET /products"
  target    = "integrations/${aws_apigatewayv2_integration.shopier_products[0].id}"
}

resource "aws_apigatewayv2_stage" "shopier_products" {
  count = var.enable_shopier_products_api ? 1 : 0

  api_id      = aws_apigatewayv2_api.shopier_products[0].id
  name        = "$default"
  auto_deploy = true
  tags        = local.tags
}

resource "aws_lambda_permission" "shopier_products_api_gateway" {
  count = var.enable_shopier_products_api ? 1 : 0

  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shopier_products[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.shopier_products[0].execution_arn}/*/*"
}
