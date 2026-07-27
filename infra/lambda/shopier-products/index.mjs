import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const shopierApiBaseUrl = process.env.SHOPIER_API_BASE_URL || 'https://api.shopier.com/v1';
const productsLimit = Number(process.env.SHOPIER_PRODUCTS_LIMIT || 50);
const secretArn = process.env.SHOPIER_ACCESS_TOKEN_SECRET_ARN;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
let cachedAccessToken = '';

const secretsClient = new SecretsManagerClient({});

function getAllowedOrigin(event) {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || '';

  if (allowedOrigins.includes('*')) return '*';
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return allowedOrigins[0] || '*';
}

function jsonResponse(event, statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(event),
      'Access-Control-Allow-Headers': 'content-type,authorization',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Cache-Control': statusCode === 200 ? 'public, max-age=300' : 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  };
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '';
}

function extractProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function normalizeImage(product) {
  const media = Array.isArray(product.media) ? product.media : [];
  const primaryMedia = media.find((item) => item?.placement === 1) || media[0];
  const image = firstValue(
    product.imageUrl,
    product.image_url,
    product.thumbnailUrl,
    product.thumbnail_url,
    primaryMedia?.url,
    Array.isArray(product.images) ? product.images[0]?.url || product.images[0] : '',
  );

  return String(image || '');
}

function formatPrice(priceData = {}) {
  const price = firstValue(priceData.discountedPrice, priceData.price);
  const currency = firstValue(priceData.currency, 'TRY');

  if (!price) return '';

  const numericPrice = Number(String(price).replace(',', '.'));
  const formattedPrice = Number.isFinite(numericPrice)
    ? new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(numericPrice)
    : String(price);
  const currencyText = currency === 'TRY' ? 'TL' : String(currency);

  return `${formattedPrice} ${currencyText}`;
}

function normalizeProduct(product, index) {
  return {
    id: String(firstValue(product.id, product.productId, product.product_id, index)),
    title: String(firstValue(product.title, product.name, 'Loop ürünü')),
    description: String(firstValue(product.description, product.shortDescription, product.short_description)),
    priceText: formatPrice(product.priceData || product.price_data || product),
    imageUrl: normalizeImage(product),
    productUrl: String(firstValue(product.url, product.productUrl, product.product_url, product.link)),
    sortOrder: index,
    isActive: firstValue(product.stockStatus, product.stock_status) !== 'outOfStock',
  };
}

async function getAccessToken() {
  if (cachedAccessToken) return cachedAccessToken;

  if (!secretArn) {
    throw new Error('SHOPIER_ACCESS_TOKEN_SECRET_ARN is not configured.');
  }

  const result = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
  const secret = result.SecretString || Buffer.from(result.SecretBinary || '', 'base64').toString('utf8');

  try {
    const parsed = JSON.parse(secret);
    cachedAccessToken = firstValue(parsed.accessToken, parsed.access_token, parsed.token, parsed.apiKey, parsed.api_key, parsed.pat);
  } catch {
    cachedAccessToken = secret.trim();
  }

  if (!cachedAccessToken) {
    throw new Error('Shopier access token secret is empty.');
  }

  return cachedAccessToken;
}

async function fetchProducts(accessToken) {
  const params = new URLSearchParams({
    limit: String(Math.min(Math.max(productsLimit, 1), 50)),
    page: '1',
    sort: 'dateDesc',
  });
  const url = `${shopierApiBaseUrl.replace(/\/$/, '')}/products?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopier products request failed with ${response.status}: ${body.slice(0, 300)}`);
  }

  return response.json();
}

export async function handler(event) {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return jsonResponse(event, 204, {});
  }

  try {
    const accessToken = await getAccessToken();
    const payload = await fetchProducts(accessToken);
    const products = extractProducts(payload)
      .map(normalizeProduct)
      .filter((product) => product.isActive && product.title);

    return jsonResponse(event, 200, { products });
  } catch (error) {
    console.error('Shopier products failed', error);
    return jsonResponse(event, 502, {
      products: [],
      error: 'Shopier products could not be loaded.',
    });
  }
}
