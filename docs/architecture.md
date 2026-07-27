# Architecture

## Frontend

The app is a React + Vite SPA.

Main entry points:

- `src/main.jsx`: React root.
- `src/App.jsx`: top-level app state and orchestration.
- `src/App.css`: global styling and responsive layout.
- `src/i18n.js`: simple TR/EN translation helper.

Components:

- `BrandLogo.jsx`: transparent Loop logo and disco recoloring.
- `ModelSelector.jsx`: bag model picker.
- `ProductPreview.jsx`: canvas preview, flood fill, debug coordinate tools, image download.
- `ColorSwatchGroup.jsx`: palette controls.
- `ConfigSummary.jsx`: selected color summary and order actions.
- `ProductShowcase.jsx`: ready-made product cards.

Services and utilities:

- `src/services/shopierProducts.js`: product loading and normalization.
- `src/utils/canvasFill.js`: flood-fill and fixed/user section paint order.
- `src/utils/colorTheme.js`: dynamic background color variables.

## Bag Configuration

`src/config/bagModels.js` is the main business configuration file.

It defines:

- material color palettes
- bag models
- model images
- paintable sections
- fixed sections
- default colors
- seed coordinates
- palette type for each section

A section roughly looks like:

```js
{
  key: "mainBody",
  label: "Ana govde",
  palette: "imperteks",
  defaultColor: "Imperteks bej",
  seeds: [
    [472, 833],
    [549, 691],
  ],
}
```

Fixed sections should win over user-editable sections if seed regions overlap. This prevents always-black areas from being overridden by normal section colors.

## Product Listing Data Flow

`ProductShowcase` calls `fetchShopierProducts()`.

Priority order:

1. `VITE_SHOPIER_PRODUCTS_ENDPOINT`: serverless Shopier API proxy.
2. `VITE_PRODUCTS_CSV_URL`: public Google Sheet CSV fallback.
3. `public/shopier-products.json`: local fallback.

The frontend expects normalized product objects:

```js
{
  id: "...",
  title: "Loop Barrel Pack",
  description: "",
  priceText: "2.950 TL",
  imageUrl: "https://...",
  productUrl: "https://www.shopier.com/...",
  sortOrder: 1,
  isActive: true,
}
```

## Shopier Serverless API

Source:

```text
infra/lambda/shopier-products/index.mjs
```

Infrastructure:

```text
infra/terraform/main.tf
infra/terraform/variables.tf
infra/terraform/outputs.tf
```

The Lambda reads the Shopier access token from AWS Secrets Manager and calls the Shopier products endpoint. API Gateway exposes a browser-safe endpoint for the frontend.

## Hosting

The app is built once with Vite and can be deployed in two modes:

- root bucket/domain
- `/loop` subpath under another domain

Vite uses relative asset paths, so the same build can work in both hosting modes.
