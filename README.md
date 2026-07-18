# Loop Bag Configurator

A single-page React + Vite color configurator for Loop bags.

Customers choose a bag model, assign colors to the model's paintable sections, and copy a human-readable order note. The preview is rendered on canvas and colored with seed-based flood fill.

## Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Deploy

Netlify configuration is included in `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `dist`

After the GitHub repository is connected to Netlify, every push to the `main` branch triggers a new deploy.

## Hosting Under /loop

The Vite config uses `base: './'`, so production assets are emitted with relative paths. That lets the same `dist` folder work both at a root domain and under a subpath such as:

```text
https://ekinbarut.com/loop/
```

To host it there, copy the contents of `dist` into the web server's `/loop` directory. If a router is added later, configure its basename as `/loop` for this deployment target.

## S3 CI/CD

The GitHub Actions workflow at `.github/workflows/deploy-s3.yml` builds the app once and uploads it to two optional targets:

```text
s3://$S3_BUCKET/loop/
s3://$S3_BUCKET_SECONDARY/
```

Add the secrets and variables in GitHub under **Settings -> Secrets and variables -> Actions**:

Add as repository secrets:

- `AWS_ACCESS_KEY_ID`: AWS access key for the deploy user.
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for the deploy user.

Add as repository variables:

- `AWS_REGION`: bucket region, for example `eu-central-1`.
- `S3_BUCKET`: primary bucket name only, without `s3://`; this deploys under `/loop`.
- `S3_BUCKET_SECONDARY`: optional secondary bucket name only, without `s3://`; this deploys at the bucket root.
- `CLOUDFRONT_DISTRIBUTION_ID`: optional primary CloudFront distribution id; invalidates `/loop/*`.
- `CLOUDFRONT_DISTRIBUTION_ID_SECONDARY`: optional secondary CloudFront distribution id; invalidates `/*`.

Minimum IAM permissions for the deploy user should include `s3:ListBucket` on each target bucket. Object permissions should cover `arn:aws:s3:::PRIMARY_BUCKET/loop/*` for the primary bucket and `arn:aws:s3:::SECONDARY_BUCKET/*` for the secondary root bucket. If using CloudFront invalidation, also allow `cloudfront:CreateInvalidation` for each distribution.

## Infrastructure

AWS infrastructure is scaffolded under `infra/terraform`. Use it to manage S3 deploy buckets, deploy IAM permissions, and future backend resources such as Lambda, API Gateway, Secrets Manager, and DynamoDB.

Start with:

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
```

Do not commit `terraform.tfvars` or Terraform state files.

## Project Structure

```text
src/
  App.jsx
  App.css
  main.jsx
  components/
    ColorSwatchGroup.jsx
    ConfigSummary.jsx
    ModelSelector.jsx
    ProductPreview.jsx
  config/
    bagModels.js
    README.md
  constants/
    preview.js
  utils/
    canvasFill.js
```

## Key Files

- `src/config/bagModels.js`: Bag models, color palette, paintable sections, seed coordinates, and fixed paint regions.
- `src/components/ProductPreview.jsx`: Canvas preview plus optional debug zoom, pan, fullscreen, and coordinate logging.
- `src/utils/canvasFill.js`: Flood-fill algorithm and color application logic.
- `src/constants/preview.js`: Canvas size and the preview debug feature flag.

## Add Colors Or Sections

Color palette and model sections are configured in `src/config/bagModels.js`.

Example section:

```js
{
  key: "color6",
  label: "Yeni panel",
  defaultColor: "Saks Mavisi",
  seeds: [
    [472, 833],
    [549, 691],
  ],
}
```

The `label` and color names are customer-facing, so they can stay Turkish.

For more detailed configuration notes, see:

```text
src/config/README.md
```

## Debug Mode

Zoom, pan, fullscreen, and seed coordinate logging are only visible when preview debug mode is enabled.

`src/constants/preview.js`:

```js
export const enablePreviewDebug = false;
```

Temporarily set it to `true` when collecting new seed coordinates.

## Product Catalog

The product cards can be managed from a public Google Sheet CSV export. The app reads the URL from:

```bash
VITE_PRODUCTS_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vR121KjpdZaRNtl-qNcjOjdPGWJodW4zfNZj_3JH4DHCBiebLdSLYGmzGcKVh6MZ5J0hqudP17kpEKz/pub?output=csv
```

Recommended sheet columns:

```text
active,sortOrder,title,description,priceText,imageUrl,productUrl
```

Example row:

```text
TRUE,1,Loop Barrel Pack,Günlük kullanım için özel üretim çanta.,950 TL,https://example.com/image.jpg,https://www.shopier.com/...
```

How to get the Google Sheet link:

1. Create a Google Sheet with the columns above.
2. Use File > Share > Publish to web.
3. Pick the product sheet tab.
4. Choose CSV as the published format.
5. Copy the published CSV URL into `VITE_PRODUCTS_CSV_URL`.

Friend-facing editing rules:

- One row is one product.
- Set `active` to `TRUE` to show a product and `FALSE` to hide it.
- Use `sortOrder` to control display order.
- Put the public product image URL in `imageUrl`.
- Put the Shopier product URL in `productUrl`.

If no CSV URL is configured, the app falls back to `public/shopier-products.json` so local development and deploys still work.

Do not put Shopier API keys in Vite environment variables. Vite variables are bundled into browser code.


## Extract Shopier Products

Shopier does not provide a reliable public product listing endpoint for this app. To help maintain the Google Sheet catalog, use the local extractor:

```bash
npm run extract:shopier
```

The script opens the Shopier store in your browser and copies an extractor snippet to the clipboard. After the page loads, paste the snippet into the browser DevTools Console. It will:

- read visible product cards and JSON-LD product data when available,
- create CSV with `active,sortOrder,title,description,priceText,imageUrl,productUrl`,
- copy the CSV to clipboard,
- download `loop-shopier-products.csv`.

Paste the CSV into the Google Sheet that powers `VITE_PRODUCTS_CSV_URL`. Review the rows before publishing because Shopier markup can change.
