# Loop AWS Infrastructure

Terraform is the source of truth for AWS resources that support the Loop configurator.

This scaffold currently manages:

- Primary S3 bucket target deployed under `/loop`.
- Optional secondary S3 bucket target deployed at bucket root.
- Optional S3 static website configuration.
- Optional public-read bucket policies for direct S3 website hosting.
- A least-privilege IAM deploy user and policy for GitHub Actions.
- An optional private S3 + CloudFront + ACM + Route 53 production site.

It intentionally does **not** create IAM access keys. Create deploy access keys manually in AWS, then store them as GitHub repository secrets.

## Production Domain Hosting

Enable the private CloudFront-backed production site in `terraform.tfvars`:

```hcl
enable_production_site    = true
production_domain_name    = "loopdesignbags.com"
production_hosted_zone_id = "YOUR_ROUTE53_HOSTED_ZONE_ID"
production_bucket_name    = "loopdesignbags.com"
```

The ACM certificate is created in `us-east-1`, as required by CloudFront. The
S3 bucket remains private and grants read access only to its CloudFront
distribution through Origin Access Control.

## First-Time Setup

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with the bucket names and AWS region you actually want.

## Project-Specific AWS Credentials

Keep your company/default AWS credentials unchanged. For this project, use a separate named AWS profile:

```bash
aws configure --profile loop
```

Then set the profile only in your local, gitignored `terraform.tfvars`:

```hcl
aws_profile = "loop"
```

Terraform will use that profile from this project while your default AWS CLI profile can remain your company account. In CI, leave `aws_profile` empty and use GitHub Actions secrets/variables instead.

If you use `direnv`, copy the repo root `.envrc.example` to `.envrc` and run `direnv allow`. The real `.envrc` is ignored by git.

Then run:

```bash
cp backend.hcl.example backend.hcl
terraform init -backend-config=backend.hcl
terraform plan
```

`backend.hcl` is local and ignored because it contains account/profile-specific
backend settings. The shared S3 backend uses versioning, encryption, public
access blocking, and an S3 lock file to prevent concurrent applies.

Only apply after reviewing the plan carefully:

```bash
terraform apply
```

## Existing Buckets

If a bucket already exists and you want Terraform to manage it, import it before applying:

```bash
terraform import 'aws_s3_bucket.site["primary"]' www.ekinbarut.com
```

Depending on which supporting resources already exist, Terraform may also need imports for ownership controls, public access block, bucket policy, or website configuration. If the bucket is already important, prefer importing over recreating.

## Deploy Paths

Set `deploy_prefix` per target:

- `deploy_prefix = "loop"` uploads to `s3://BUCKET/loop/`.
- `deploy_prefix = ""` uploads to `s3://BUCKET/`.

The GitHub Actions workflow must match these paths.

## Public vs Private Hosting

For CloudFront-backed hosting, keep:

```hcl
public_read      = false
website_enabled = false
```

For direct S3 static website hosting, you usually need:

```hcl
public_read      = true
website_enabled = true
```

Public buckets are easier to test but less locked down. Prefer CloudFront with private buckets for production.

## Destroy

Terraform makes cleanup explicit:

```bash
terraform destroy
```

S3 buckets must be empty before Terraform can destroy them. If a destroy fails because objects remain, empty the bucket first or add a controlled cleanup step.
