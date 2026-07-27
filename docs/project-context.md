# Project Context

This document is the durable project memory for the Loop bag configurator. It exists so another laptop or future chat session can continue the work without relying on the original conversation history.

## Product Goal

Loop needs a mobile-friendly product configurator for custom handmade bags. Customers can choose a bag model, pick colors for paintable sections, preview the result immediately, download the preview image, and send a prepared WhatsApp order message.

The site also lists ready-made Shopier products and is moving toward Shopier API-backed product listing, with payment integration planned later.

## Current App

- React + Vite single-page app.
- Customer-facing UI is Turkish by default.
- There is a TR/EN language toggle in the header.
- Project files, logs, README, and developer documentation should stay in English.
- The visual configurator uses canvas flood fill over line-art bag images.
- Bag model/section/palette configuration lives in `src/config/bagModels.js`.
- Debug coordinate collection can be enabled in `src/constants/preview.js`.
- Product cards can be loaded from Shopier API, Google Sheet CSV, or local JSON fallback.

## Bag Models

Current models:

- Barrel / Duffel bag based on `canta1-lines.png`.
- Roll pack based on `canta2.jpeg`.
- Waist pack based on `canta3-lines.png`.

Each model has sections with seed coordinates. The flood-fill algorithm starts from those coordinates and colors the connected white region. Fixed sections can paint areas that should not be user-editable, such as always-black hardware/straps/details.

## Color Rules

There are two material palettes:

- Imperteks colors: fabric panels.
- Kolon colors: strap/webbing sections.

The controls must show the correct palette for each section type. The selected color names should be human-friendly, not raw `color1/color2` style labels, although section labels can still use business naming where needed.

Defaults are randomized from available section palettes. Default colors should be different across sections when possible. Manual user selection is allowed to reuse the same color in multiple sections.

## Preview And Debug

`src/components/ProductPreview.jsx` renders the canvas preview. It supports optional debug tools:

- zoom
- pan/drag
- fullscreen
- coordinate logging on click/tap

These tools are only for development and are controlled by:

```js
// src/constants/preview.js
export const enablePreviewDebug = false;
```

When adding new sections manually, enable debug, click a white region, copy the logged coordinate, and add it to the relevant section's `seeds` array in `src/config/bagModels.js`.

## Design Direction

Brand feel: playful, lively, handmade/product boutique, not sterile SaaS.

Implemented visual ideas:

- Transparent Loop logo in the header.
- Ton-sur-ton neutral base.
- Dynamic animated circular background shapes based on selected colors plus complementary derived colors.
- Disco mode using the disco GIF button, canvas-confetti, random color changes, and short music.

The dynamic background code is in `src/utils/colorTheme.js` and CSS is in `src/App.css` under `.page-background` and `.background-circle`.

## Important Safety Notes

Never commit:

- AWS access keys
- Shopier API keys/tokens
- `.env`
- `.envrc`
- `.aws/`
- `terraform.tfvars`
- Terraform state files

Shopier API credentials must never be exposed through Vite environment variables because Vite variables are bundled into browser JavaScript.
