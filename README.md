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

