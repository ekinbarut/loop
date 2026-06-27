# Bag Model Configuration

Edit `bagModels.js` when you need to change paintable regions, fixed regions, or the color palette.

The customer-facing UI is Turkish, so model names, section labels, and color names may intentionally be Turkish.

## Add A New Section

Find the target model:

```js
{
  id: 'canta3',
  name: 'Duffel Çanta',
  sections: [
    // add the new section here
  ],
}
```

Add a section:

```js
{
  key: 'color6',
  label: 'Yeni panel',
  defaultColor: 'Saks Mavisi',
  seeds: [
    [472, 833],
    [549, 691],
  ],
}
```

Rules:

- `key` must be unique within the model.
- Use `color1`, `color2`, `color3`, etc. for simple ordering.
- `label` is shown in the customer-facing UI.
- `defaultColor` is mainly a reference value; initial colors are randomized per model and kept unique within that model.
- `seeds` are `[x, y]` canvas coordinates logged from preview debug clicks.
- A section can contain as many seeds as needed.

## If A Fill Leaks

If a seed leaks into the background or another large area, add a lower pixel limit to that section:

```js
{
  key: 'color6',
  label: 'Yeni panel',
  defaultColor: 'Saks Mavisi',
  maxFillPixels: 90000,
  seeds: [[472, 833]],
}
```

If the fill becomes too small, increase `maxFillPixels`.

## Add Fixed Regions

Use `fixedSections` for areas that should always be painted but should not appear as editable controls:

```js
fixedSections: [
  {
    label: 'Sabit siyah detaylar',
    color: 'Siyah',
    seeds: [
      [100, 200],
      [140, 260],
    ],
  },
],
```

`color` can be a palette color name like `'Siyah'` or a hex color like `'#050505'`.

Fixed regions are painted after user-editable regions, so they win when coordinates overlap.

You can also set a custom fill tolerance:

```js
{
  label: 'Sabit siyah detaylar',
  color: 'Siyah',
  tolerance: 160,
  seeds: [[100, 200]],
}
```

## Color Palette

Colors live in `paintColors`:

```js
{ name: 'Saks Mavisi', hex: '#2169D8' },
```

The app only shows colors from that list.

