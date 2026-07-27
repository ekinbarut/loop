# Todo And Open Questions

## Shopier Product Listing

- Keep the published Google Sheet columns aligned with the frontend CSV parser.
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
