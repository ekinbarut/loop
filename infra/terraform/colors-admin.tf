resource "aws_s3_object" "initial_colors_csv" {
  count        = var.enable_colors_admin_api ? 1 : 0
  bucket       = var.colors_bucket_name
  key          = var.colors_object_key
  source       = "${path.module}/../../colors.csv"
  content_type = "text/csv; charset=utf-8"

  lifecycle {
    ignore_changes = all
  }
}

data "archive_file" "colors_admin_lambda" {
  count       = var.enable_colors_admin_api ? 1 : 0
  type        = "zip"
  source_dir  = "${path.module}/../lambda/colors-admin"
  output_path = "${path.module}/.terraform/colors-admin.zip"
}

resource "aws_iam_role" "colors_admin_lambda" {
  count = var.enable_colors_admin_api ? 1 : 0
  name  = "${var.project_name}-colors-admin-lambda"
  tags  = local.tags
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "colors_admin_lambda" {
  count = var.enable_colors_admin_api ? 1 : 0
  name  = "${var.project_name}-colors-admin-lambda"
  role  = aws_iam_role.colors_admin_lambda[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "arn:aws:s3:::${var.colors_bucket_name}/${var.colors_object_key}"
      }
    ]
  })
}

resource "aws_lambda_function" "colors_admin" {
  count            = var.enable_colors_admin_api ? 1 : 0
  function_name    = "${var.project_name}-colors-admin"
  role             = aws_iam_role.colors_admin_lambda[0].arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.colors_admin_lambda[0].output_path
  source_code_hash = data.archive_file.colors_admin_lambda[0].output_base64sha256
  timeout          = 10
  memory_size      = 128
  tags             = local.tags
  environment {
    variables = {
      ALLOWED_ORIGINS    = join(",", var.colors_admin_allowed_origins)
      COLORS_BUCKET_NAME = var.colors_bucket_name
      COLORS_OBJECT_KEY  = var.colors_object_key
    }
  }
}

resource "aws_apigatewayv2_api" "colors_admin" {
  count         = var.enable_colors_admin_api ? 1 : 0
  name          = "${var.project_name}-colors-admin"
  protocol_type = "HTTP"
  tags          = local.tags
  cors_configuration {
    allow_headers = ["content-type"]
    allow_methods = ["GET", "PUT", "OPTIONS"]
    allow_origins = var.colors_admin_allowed_origins
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "colors_admin" {
  count                  = var.enable_colors_admin_api ? 1 : 0
  api_id                 = aws_apigatewayv2_api.colors_admin[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.colors_admin[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "colors_admin" {
  for_each  = var.enable_colors_admin_api ? toset(["GET /colors", "PUT /colors"]) : []
  api_id    = aws_apigatewayv2_api.colors_admin[0].id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.colors_admin[0].id}"
}

resource "aws_apigatewayv2_stage" "colors_admin" {
  count       = var.enable_colors_admin_api ? 1 : 0
  api_id      = aws_apigatewayv2_api.colors_admin[0].id
  name        = "$default"
  auto_deploy = true
  tags        = local.tags

  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }
}

resource "aws_lambda_permission" "colors_admin_api_gateway" {
  count         = var.enable_colors_admin_api ? 1 : 0
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.colors_admin[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.colors_admin[0].execution_arn}/*/*"
}
