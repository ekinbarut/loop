import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const bucket = process.env.COLORS_BUCKET_NAME;
const key = process.env.COLORS_OBJECT_KEY || 'data/colors.csv';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((value) => value.trim());

function origin(event) {
  const requestOrigin = event.headers?.origin || '';
  if (allowedOrigins.includes('*')) return '*';
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
}

function response(event, statusCode, body, contentType = 'application/json; charset=utf-8') {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': origin(event),
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Cache-Control': 'no-store',
      'Content-Type': contentType,
    },
    body: contentType.startsWith('application/json') ? JSON.stringify(body) : body,
  };
}

function validateCsv(csv) {
  if (typeof csv !== 'string' || csv.length > 100_000) return false;
  const lines = csv.trim().split(/\r?\n/);
  if (lines[0] !== 'id,active,palette,nameTr,nameEn,hex') return false;
  return lines.slice(1).every((line) => {
    const cells = line.split(',');
    return cells.length === 6
      && ['TRUE', 'FALSE'].includes(cells[1])
      && ['fabric', 'strap'].includes(cells[2])
      && /^#[0-9a-f]{6}$/i.test(cells[5]);
  });
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === 'OPTIONS') return response(event, 204, {});

  try {
    if (method === 'GET') {
      const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return response(event, 200, await object.Body.transformToString(), 'text/csv; charset=utf-8');
    }

    if (method === 'PUT') {
      const { csv } = JSON.parse(event.body || '{}');
      if (!validateCsv(csv)) return response(event, 400, { error: 'Renk verisi geçersiz.' });
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: `${csv.trim()}\n`,
        ContentType: 'text/csv; charset=utf-8',
      }));
      return response(event, 200, { ok: true });
    }

    return response(event, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error('Colors API failed', error);
    return response(event, 500, { error: 'İşlem tamamlanamadı.' });
  }
}
