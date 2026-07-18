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
