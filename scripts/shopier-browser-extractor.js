(async function extractShopierProductsForLoop() {
  const headers = ['active', 'sortOrder', 'title', 'description', 'priceText', 'imageUrl', 'productUrl'];

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function absoluteUrl(value) {
    if (!value) return '';
    try {
      return new URL(value, window.location.href).href;
    } catch {
      return '';
    }
  }

  function csvEscape(value) {
    const text = clean(value);
    return /[",\n\r]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }

  function toCsv(products) {
    return [
      headers.join(','),
      ...products.map((product) => headers.map((header) => csvEscape(product[header])).join(',')),
    ].join('\n');
  }

  function findPrice(text) {
    const normalized = clean(text);
    const match = normalized.match(/(?:₺\s*[\d.,]+|[\d.,]+\s*(?:TL|₺)|TRY\s*[\d.,]+|[\d.,]+\s*TRY)/i);
    return match ? clean(match[0]) : '';
  }

  function findBestImage(root) {
    const images = Array.from(root.querySelectorAll('img'));
    const image = images.find((item) => absoluteUrl(item.currentSrc || item.src || item.dataset.src || item.dataset.original || item.dataset.lazy)) || images[0];
    return image ? absoluteUrl(image.currentSrc || image.src || image.dataset.src || image.dataset.original || image.dataset.lazy) : '';
  }

  function findTitle(root, anchor) {
    const image = root.querySelector('img[alt]');
    const heading = root.querySelector('h1,h2,h3,h4,[class*=title i],[class*=name i]');
    const candidates = [
      image?.alt,
      heading?.textContent,
      anchor?.getAttribute('aria-label'),
      anchor?.textContent,
      root.textContent,
    ]
      .map(clean)
      .filter(Boolean);

    for (const candidate of candidates) {
      const lines = candidate.split(/(?=₺|\b\d+[,.]?\d*\s*(?:TL|TRY)\b)/i)[0]
        .split(/[\n\r]/)
        .map(clean)
        .filter(Boolean);
      const line = lines.find((item) => item.length > 2 && !findPrice(item) && !/^sepete|satın al|incele$/i.test(item));
      if (line) return line;
    }

    return '';
  }

  function productFromJsonLd(node) {
    if (!node || typeof node !== 'object') return [];
    const type = Array.isArray(node['@type']) ? node['@type'].join(' ') : node['@type'];
    const products = [];

    if (String(type || '').toLowerCase().includes('product')) {
      const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
      const image = Array.isArray(node.image) ? node.image[0] : node.image;
      const price = offers?.price ? String(offers.price) + ' ' + clean(offers.priceCurrency || 'TL') : '';
      products.push({
        active: 'TRUE',
        sortOrder: products.length + 1,
        title: clean(node.name),
        description: clean(node.description),
        priceText: price,
        imageUrl: absoluteUrl(image),
        productUrl: absoluteUrl(node.url || offers?.url || window.location.href),
      });
    }

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach((child) => products.push(...productFromJsonLd(child)));
      } else if (value && typeof value === 'object') {
        products.push(...productFromJsonLd(value));
      }
    }

    return products;
  }

  function extractJsonLdProducts() {
    return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap((script) => {
        try {
          return productFromJsonLd(JSON.parse(script.textContent));
        } catch {
          return [];
        }
      });
  }

  function extractDomProducts() {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const products = [];

    for (const anchor of anchors) {
      const href = absoluteUrl(anchor.getAttribute('href'));
      if (!href || href.includes('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      if (!href.includes('shopier.com')) continue;

      const root = anchor.closest('article, li, .product, .product-card, .card, .item, [class*=product i], [class*=listing i]') || anchor.parentElement || anchor;
      const text = clean(root.textContent);
      const imageUrl = findBestImage(root);
      const priceText = findPrice(text);
      const title = findTitle(root, anchor);

      if (!title || (!imageUrl && !priceText)) continue;
      if (/login|giriş|sepet|cart|favori|profil|mağaza|magaza/i.test(title)) continue;

      products.push({
        active: 'TRUE',
        sortOrder: products.length + 1,
        title,
        description: '',
        priceText,
        imageUrl,
        productUrl: href,
      });
    }

    return products;
  }

  function dedupe(products) {
    const seen = new Set();
    return products.filter((product) => {
      const key = clean(product.productUrl || product.title).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((product, index) => ({ ...product, sortOrder: index + 1 }));
  }

  const products = dedupe([...extractJsonLdProducts(), ...extractDomProducts()]);
  const csv = toCsv(products);

  console.table(products);
  console.log(csv);

  try {
    await navigator.clipboard.writeText(csv);
    console.log('Loop CSV copied to clipboard. Paste it into Google Sheets.');
  } catch {
    console.warn('Clipboard copy failed. Copy the CSV from the console output.');
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'loop-shopier-products.csv';
  link.click();
  URL.revokeObjectURL(link.href);

  return products;
})();
