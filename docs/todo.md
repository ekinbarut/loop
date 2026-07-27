# Todo And Open Questions

## Immediate

- Run `terraform init` after adding the `archive` provider.
- Run `terraform plan` with `enable_shopier_products_api = true`.
- Apply Terraform to create the Shopier products API.
- Put the Shopier token into AWS Secrets Manager.
- Add `VITE_SHOPIER_PRODUCTS_ENDPOINT` to GitHub repository variables.
- Push and verify the product listing uses the Shopier API in production.

## Shopier Product Listing

- Confirm the exact Shopier product response shape with the real token.
- Adjust `infra/lambda/shopier-products/index.mjs` if image/product URL fields differ from expectations.
- Decide whether out-of-stock products should be hidden or displayed as sold out.
- Remove the temporary `test` keyword from `ProductShowcase` when no longer needed.

## Custom Payment

- Decide whether custom bags will be purchased through one fixed Shopier custom product or dynamic checkout/product creation.
- Design the order payload: model, section colors, generated preview image, order note, language, timestamp.
- Add webhook handling before relying on payment confirmation.

## Configurator

- Keep adding/refining seed coordinates in `src/config/bagModels.js` as bag artwork changes.
- Confirm fixed sections still override user sections after every new seed addition.
- Revisit logo text coloring if the line-art logo regions are too small or not flood-fillable.

## UX And Design

- Test mobile layout after every major UI change.
- Keep debug preview tools behind `enablePreviewDebug`.
- Keep disco mode playful but optional and non-blocking.
- Watch asset sizes, especially GIF/audio.
