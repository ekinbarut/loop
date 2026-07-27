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

output "production_site_bucket_name" {
  description = "Private S3 bucket used by the production CloudFront distribution."
  value       = var.enable_production_site ? aws_s3_bucket.production_site[0].bucket : null
}

output "production_cloudfront_distribution_id" {
  description = "CloudFront distribution ID used for cache invalidations."
  value       = var.enable_production_site ? aws_cloudfront_distribution.production_site[0].id : null
}

output "production_cloudfront_domain_name" {
  description = "CloudFront-generated domain name."
  value       = var.enable_production_site ? aws_cloudfront_distribution.production_site[0].domain_name : null
}

output "production_site_url" {
  description = "Canonical HTTPS URL of the production site."
  value       = var.enable_production_site ? "https://${var.production_domain_name}" : null
}

output "colors_api_endpoint" {
  description = "Endpoint for the VITE_COLORS_API_ENDPOINT variable."
  value       = var.enable_colors_admin_api ? "${aws_apigatewayv2_api.colors_admin[0].api_endpoint}/colors" : null
}
