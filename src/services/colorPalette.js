import { fabricColors, strapColors } from '../config/bagModels.js';

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
      if (currentRow.some(Boolean)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some(Boolean)) {
    rows.push(currentRow);
  }

  return rows;
}

function isActive(value) {
  return ['true', '1', 'yes', 'evet', 'aktif', 'active'].includes(String(value).trim().toLowerCase());
}

function fallbackPalette() {
  return {
    fabric: fabricColors.map((color, index) => ({ ...color, active: true, sortOrder: index + 1 })),
    strap: strapColors.map((color, index) => ({ ...color, active: true, sortOrder: index + 1 })),
  };
}

function csvToPalette(text) {
  const rows = parseCsv(text);
  const headers = rows[0] ?? [];
  const colors = rows.slice(1)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
    .map((color, index) => ({
      id: color.id.trim(),
      name: color.nameTr.trim(),
      nameEn: color.nameEn.trim(),
      hex: color.hex.trim(),
      palette: color.palette.trim().toLowerCase(),
      active: isActive(color.active),
      sortOrder: index + 1,
      note: (color.note || '').trim(),
    }))
    .filter((color) => ['fabric', 'strap'].includes(color.palette) && color.name && /^#[0-9a-f]{6}$/i.test(color.hex))
    .sort((first, second) => first.sortOrder - second.sortOrder);

  const palette = {
    fabric: colors.filter((color) => color.palette === 'fabric'),
    strap: colors.filter((color) => color.palette === 'strap'),
  };

  if (palette.fabric.length === 0 || palette.strap.length === 0) {
    throw new Error('Colors CSV must contain both fabric and strap rows.');
  }

  return palette;
}

export async function fetchColorPalette({ signal } = {}) {
  const endpoint = import.meta.env.VITE_COLORS_API_ENDPOINT || import.meta.env.VITE_COLORS_CSV_URL;

  if (!endpoint) {
    return fallbackPalette();
  }

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'text/csv,text/plain,*/*' },
      signal,
    });

    if (!response.ok) {
      throw new Error('Colors CSV request failed with ' + response.status);
    }

    return csvToPalette(await response.text());
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    console.warn('Colors could not be loaded. Using the built-in palette.', error);
    return fallbackPalette();
  }
}
