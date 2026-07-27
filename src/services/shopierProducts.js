const fallbackProducts = [
  {
    id: 'custom-loop-bag',
    title: 'Custom Loop Çanta',
    description: 'Renklerini seçtiğin özel üretim Loop çanta siparişi için Shopier sayfasına geçebilirsin.',
    priceText: 'Shopier’de incele',
    imageUrl: '',
    productUrl: 'https://www.shopier.com/loopdesignbags',
  },
];

function normalizeCell(value) {
  const text = String(value ?? '').trim();
  const lower = text.toLowerCase();

  if (!text || lower === 'undefined' || lower === 'null' || lower === 'nan' || text === '-') {
    return '';
  }

  return text;
}

function firstValue(...values) {
  return values.map(normalizeCell).find((value) => value !== '') ?? '';
}

function isTruthyCell(value) {
  return ['true', '1', 'yes', 'evet', 'aktif', 'active'].includes(String(value).trim().toLowerCase());
}

function parseCsv(text) {
  const rows = [];
  let currentCell = '';
  let currentRow = [];
  let isInQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (isInQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        isInQuotes = !isInQuotes;
      }
      continue;
    }

    if (char === ',' && !isInQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !isInQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

function csvToProducts(text) {
  const rows = parseCsv(text);
  const headers = rows[0]?.map((header) => header.trim()) ?? [];

  return rows.slice(1).map((row) => Object.fromEntries(
    headers.map((header, index) => [header, row[index] ?? '']),
  ));
}

function normalizeImage(product) {
  const image = firstValue(
    product.image,
    product.imageUrl,
    product.image_url,
    product.coverImage,
    product.cover_image,
    product.thumbnail,
    product.thumbnailUrl,
    product.thumbnail_url,
    Array.isArray(product.images) ? product.images[0] : undefined,
  );

  if (!image) {
    return '';
  }

  if (typeof image === 'string') {
    return image;
  }

  return firstValue(image.url, image.src, image.href, image.original, image.medium, image.large, '');
}

function normalizePrice(product) {
  const formatted = firstValue(
    product.priceText,
    product.formattedPrice,
    product.formatted_price,
    product.price_text,
  );

  if (formatted) {
    return String(formatted);
  }

  const price = firstValue(product.price, product.amount, product.salePrice, product.sale_price);
  const currency = firstValue(product.currency, product.currencyCode, product.currency_code, 'TL');

  if (price === undefined || price === null || price === '') {
    return '';
  }

  return String(price) + ' ' + String(currency);
}

function normalizeProduct(product, index) {
  return {
    id: String(firstValue(product.id, product.productId, product.product_id, product.sku, index)),
    title: String(firstValue(product.title, product.name, product.productName, product.product_name, 'Loop ürünü')),
    description: String(firstValue(product.description, product.shortDescription, product.short_description)),
    priceText: normalizePrice(product),
    imageUrl: normalizeImage(product),
    productUrl: String(firstValue(product.url, product.link, product.productUrl, product.product_url, product.permalink, '')),
    sortOrder: Number(firstValue(product.sortOrder, product.sort_order, product.order, index)),
    isActive: product.active === undefined || product.active === '' ? true : isTruthyCell(product.active),
  };
}

function extractProducts(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.products)) {
    return payload.products;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

async function fetchJsonProducts(endpoint, signal) {
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error('Product request failed with ' + response.status);
  }

  const payload = await response.json();
  return extractProducts(payload);
}

async function fetchCsvProducts(endpoint, signal) {
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'text/csv,text/plain,*/*',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error('CSV product request failed with ' + response.status);
  }

  return csvToProducts(await response.text());
}

function cleanProducts(products) {
  return products
    .map(normalizeProduct)
    .filter((product) => product.isActive && product.title)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

export async function fetchShopierProducts({ signal } = {}) {
  const shopierEndpoint = import.meta.env.VITE_SHOPIER_PRODUCTS_ENDPOINT;
  const csvEndpoint = import.meta.env.VITE_PRODUCTS_CSV_URL;
  const sources = [
    shopierEndpoint ? { type: 'json', endpoint: shopierEndpoint } : null,
    csvEndpoint ? { type: 'csv', endpoint: csvEndpoint } : null,
    { type: 'json', endpoint: './shopier-products.json' },
  ].filter(Boolean);

  for (const source of sources) {
    try {
      const rawProducts = source.type === 'csv'
        ? await fetchCsvProducts(source.endpoint, signal)
        : await fetchJsonProducts(source.endpoint, signal);
      const products = cleanProducts(rawProducts);

      if (products.length > 0) {
        return products;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }

      console.warn(`Products could not be loaded from ${source.type} source. Trying the next fallback.`, error);
    }
  }

  return fallbackProducts;
}
