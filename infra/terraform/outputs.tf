output "bucket_names" {
  description = "Managed S3 bucket names by deploy target key."
  value = {
    for key, bucket in aws_s3_bucket.site : key => bucket.bucket
  }
}

output "bucket_website_endpoints" {
  description = "S3 website endpoints for targets with website_enabled = true."
  value = {
    for key, website in aws_s3_bucket_website_configuration.site : key => website.website_endpoint
  }
}

output "github_actions_deploy_user_name" {
  description = "IAM user name for GitHub Actions deploys, if created."
  value       = var.create_github_actions_deploy_user ? aws_iam_user.github_actions_deploy[0].name : null
}

output "github_actions_deploy_policy_arn" {
  description = "IAM deploy policy ARN, if created."
  value       = var.create_github_actions_deploy_user ? aws_iam_policy.github_actions_deploy[0].arn : null
}

output "shopier_products_endpoint" {
  description = "Public endpoint for the frontend VITE_SHOPIER_PRODUCTS_ENDPOINT variable."
  value       = var.enable_shopier_products_api ? "${aws_apigatewayv2_api.shopier_products[0].api_endpoint}/products" : null
}

output "shopier_access_token_secret_name" {
  description = "Secrets Manager secret name for the Shopier access token, when Terraform creates it."
  value       = var.enable_shopier_products_api && var.shopier_access_token_secret_arn == "" ? aws_secretsmanager_secret.shopier_access_token[0].name : null
}
