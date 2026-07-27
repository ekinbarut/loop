# Shopier Integration

## Current Goal

List ready-made Shopier products inside the Loop site, with images, prices, and product links.

Payment for custom configured bags is planned but not implemented yet.

## Product Listing Approach

Do not call Shopier API directly from the browser. The Shopier token must stay server-side.

Current implementation:

- API Gateway public endpoint: `GET /products`
- Lambda: `infra/lambda/shopier-products/index.mjs`
- Secret: AWS Secrets Manager Shopier access token
- Frontend env var: `VITE_SHOPIER_PRODUCTS_ENDPOINT`

The Lambda normalizes Shopier response data into the product shape expected by the React app.

## Enabling The API

In `infra/terraform/terraform.tfvars`:

```hcl
enable_shopier_products_api      = true
shopier_access_token_secret_name = "loop/shopier/access-token"
shopier_products_allowed_origins = ["https://loopdesignbags.com", "https://ekinbarut.com"]
shopier_products_limit           = 50
```

Then:

```bash
cd infra/terraform
terraform init
terraform apply
terraform output shopier_products_endpoint
```

Open AWS Secrets Manager and set the secret value for `loop/shopier/access-token`.

Accepted secret formats:

Raw token:

```text
SHOPIER_ACCESS_TOKEN
```

Or JSON:

```json
{ "accessToken": "SHOPIER_ACCESS_TOKEN" }
```

Then add the Terraform output as GitHub repository variable:

```text
VITE_SHOPIER_PRODUCTS_ENDPOINT=https://your-api-id.execute-api.eu-central-1.amazonaws.com/products
```

## Fallbacks

If the Shopier endpoint is not configured, frontend can still read from:

1. `VITE_PRODUCTS_CSV_URL`: public Google Sheet CSV.
2. `public/shopier-products.json`: local fallback.

The old Google Sheet flow remains useful if Shopier API is unavailable or if the API product shape needs manual cleanup.

## Payment Notes

Future payment integration should also go through Lambda/API Gateway, not direct browser calls.

Likely flow:

1. User configures bag.
2. Frontend sends selected model/colors/order note to Lambda.
3. Lambda creates or references a Shopier custom product/checkout flow.
4. User pays on Shopier.
5. Shopier webhook calls another Lambda.
6. The site records or forwards the order note/image if needed.

Do not store payment secrets in the frontend. Shopier should own the payment capture; the Loop backend should only create/lookup checkout resources and receive webhook confirmations.
