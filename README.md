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

The GitHub Actions workflow at `.github/workflows/deploy-s3.yml` builds the app and uploads it to:

```text
s3://$S3_BUCKET/loop/
```

Add these repository secrets in GitHub under **Settings -> Secrets and variables -> Actions -> New repository secret**:

- `AWS_ACCESS_KEY_ID`: AWS access key for the deploy user.
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for the deploy user.
- `AWS_REGION`: bucket region, for example `eu-central-1`.
- `S3_BUCKET`: bucket name only, without `s3://`.
- `CLOUDFRONT_DISTRIBUTION_ID`: optional; add it only if `ekinbarut.com` is served through CloudFront and you want automatic cache invalidation.

Minimum IAM permissions for the deploy user should include `s3:ListBucket` on the bucket and `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on `arn:aws:s3:::YOUR_BUCKET/loop/*`. If using CloudFront invalidation, also allow `cloudfront:CreateInvalidation` for the distribution.

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

