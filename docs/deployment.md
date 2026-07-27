# Deployment

## Local Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## GitHub Actions To S3

Workflow:

```text
.github/workflows/deploy-s3.yml
```

It builds the app and deploys to two optional S3 targets:

- primary bucket under `/loop`
- secondary bucket at root

GitHub repository secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

GitHub repository variables:

```text
AWS_REGION
S3_BUCKET
S3_BUCKET_SECONDARY
CLOUDFRONT_DISTRIBUTION_ID
CLOUDFRONT_DISTRIBUTION_ID_SECONDARY
VITE_SHOPIER_PRODUCTS_ENDPOINT
VITE_PRODUCTS_CSV_URL
```

`VITE_SHOPIER_PRODUCTS_ENDPOINT` should be set after Terraform creates the Shopier products API.

## Terraform

Terraform lives in:

```text
infra/terraform
```

Common flow:

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

Do not commit:

```text
infra/terraform/terraform.tfvars
*.tfstate
*.tfstate.*
```

## Project-Local AWS Credentials

Because this may be used on a company laptop, keep personal AWS credentials project-local.

From repo root:

```bash
mkdir -p .aws
```

`.aws/credentials`:

```ini
[loop]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

`.aws/config`:

```ini
[profile loop]
region = eu-central-1
output = json
```

Then before Terraform:

```bash
export AWS_SHARED_CREDENTIALS_FILE="$PWD/.aws/credentials"
export AWS_CONFIG_FILE="$PWD/.aws/config"
```

In `terraform.tfvars`:

```hcl
aws_profile = "loop"
```

If Terraform complains that `/Users/ekin/.aws/credentials` is a directory, it means the global AWS config is broken. The project-local env vars above avoid that global path.

## `/loop` Hosting

The Vite config uses relative assets, so hosting under `https://ekinbarut.com/loop/` works as long as the built `dist` contents are uploaded under the bucket's `loop/` prefix.
