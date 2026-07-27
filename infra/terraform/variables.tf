variable "aws_region" {
  description = "AWS region for project resources."
  type        = string
}

variable "aws_profile" {
  description = "Optional local AWS profile name for Terraform commands. Leave empty in CI."
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project tag value used on managed AWS resources."
  type        = string
  default     = "loop-configurator"
}

variable "deploy_targets" {
  description = "S3 deploy targets. Use deploy_prefix loop for /loop hosting and an empty deploy_prefix for bucket root hosting."
  type = map(object({
    bucket_name                 = string
    deploy_prefix               = string
    public_read                 = optional(bool, false)
    website_enabled             = optional(bool, false)
    cloudfront_distribution_arn = optional(string, "")
  }))
}

variable "create_github_actions_deploy_user" {
  description = "Create an IAM user and attach least-privilege deploy permissions for GitHub Actions. Access keys are intentionally not created by Terraform."
  type        = bool
  default     = true
}

variable "github_actions_deploy_user_name" {
  description = "IAM user name for GitHub Actions deploys when create_github_actions_deploy_user is true."
  type        = string
  default     = "loop-github-actions-deploy"
}

variable "enable_shopier_products_api" {
  description = "Create Lambda + API Gateway endpoint that lists Shopier products for the frontend."
  type        = bool
  default     = false
}

variable "shopier_access_token_secret_name" {
  description = "Secrets Manager secret name used when Terraform creates the Shopier access token secret. Put the token value manually after apply."
  type        = string
  default     = "loop/shopier/access-token"
}

variable "shopier_access_token_secret_arn" {
  description = "Optional existing Secrets Manager secret ARN containing the Shopier PAT/access token. When empty, Terraform creates the secret container."
  type        = string
  default     = ""
}

variable "shopier_products_allowed_origins" {
  description = "Allowed browser origins for the Shopier products API CORS policy. Use exact production origins when possible."
  type        = list(string)
  default     = ["*"]
}

variable "shopier_products_limit" {
  description = "Maximum number of Shopier products returned to the storefront. Shopier allows up to 50 per page."
  type        = number
  default     = 50
}

variable "enable_production_site" {
  description = "Create private S3, CloudFront, ACM, and Route 53 resources for the production site."
  type        = bool
  default     = false
}

variable "production_domain_name" {
  description = "Apex domain used for the production site."
  type        = string
  default     = ""
}

variable "production_hosted_zone_id" {
  description = "Route 53 public hosted zone ID for the production domain."
  type        = string
  default     = ""
}

variable "production_bucket_name" {
  description = "Globally unique private S3 bucket name used as the CloudFront origin."
  type        = string
  default     = ""
}

variable "enable_colors_admin_api" {
  description = "Create the authenticated color CSV management API."
  type        = bool
  default     = false
}

variable "colors_bucket_name" {
  description = "Existing S3 bucket in which the mutable colors CSV is stored."
  type        = string
  default     = ""
}

variable "colors_object_key" {
  description = "S3 object key for the mutable colors CSV."
  type        = string
  default     = "data/colors.csv"
}

variable "colors_admin_allowed_origins" {
  description = "Exact browser origins allowed to call the colors API."
  type        = list(string)
  default     = ["*"]
}
