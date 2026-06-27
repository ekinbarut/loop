import { colorByName } from '../config/bagModels.js';
import { canvasSize } from '../constants/preview.js';

const defaultFillTolerance = 48;
const defaultMaxFillPixels = 260000;

function hexToRgba(hex) {
  const normalizedHex = hex.replace('#', '');
  const value = Number.parseInt(normalizedHex, 16);

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
    alpha: 255,
  };
}

function colorDistance(data, index, target) {
  return (
    Math.abs(data[index] - target.red) +
    Math.abs(data[index + 1] - target.green) +
    Math.abs(data[index + 2] - target.blue) +
    Math.abs(data[index + 3] - target.alpha)
  );
}

function fillPixel(data, index, color) {
  data[index] = color.red;
  data[index + 1] = color.green;
  data[index + 2] = color.blue;
  data[index + 3] = color.alpha;
}

function shouldFill(data, index, target, replacement, tolerance) {
  const alreadyReplacement =
    Math.abs(data[index] - replacement.red) < 2 &&
    Math.abs(data[index + 1] - replacement.green) < 2 &&
    Math.abs(data[index + 2] - replacement.blue) < 2 &&
    Math.abs(data[index + 3] - replacement.alpha) < 2;

  return !alreadyReplacement && colorDistance(data, index, target) <= tolerance;
}

function floodFill(imageData, startX, startY, replacement, tolerance, maxPaintedPixels = defaultMaxFillPixels) {
  const { data, width, height } = imageData;
  const startIndex = (startY * width + startX) * 4;
  const originalData = new Uint8ClampedArray(data);
  const target = {
    red: data[startIndex],
    green: data[startIndex + 1],
    blue: data[startIndex + 2],
    alpha: data[startIndex + 3],
  };

  if (!shouldFill(data, startIndex, target, replacement, tolerance)) {
    return { imageData, paintedPixels: 0 };
  }

  const stack = [[startX, startY]];
  let paintedPixels = 0;

  while (stack.length > 0) {
    const [x, y] = stack.pop();

    if (x < 0 || x >= width || y < 0 || y >= height) {
      continue;
    }

    let left = x;
    let right = x;

    while (left >= 0 && shouldFill(data, (y * width + left) * 4, target, replacement, tolerance)) {
      left -= 1;
    }

    while (right < width && shouldFill(data, (y * width + right) * 4, target, replacement, tolerance)) {
      right += 1;
    }

    left += 1;
    right -= 1;

    if (left > right) {
      continue;
    }

    for (let fillX = left; fillX <= right; fillX += 1) {
      fillPixel(data, (y * width + fillX) * 4, replacement);
      paintedPixels += 1;

      if (paintedPixels > maxPaintedPixels) {
        data.set(originalData);
        return { imageData, paintedPixels: 0, aborted: true };
      }
    }

    for (const nextY of [y - 1, y + 1]) {
      if (nextY < 0 || nextY >= height) {
        continue;
      }

      let spanActive = false;

      for (let scanX = left; scanX <= right; scanX += 1) {
        const scanIndex = (nextY * width + scanX) * 4;
        const canFill = shouldFill(data, scanIndex, target, replacement, tolerance);

        if (canFill && !spanActive) {
          stack.push([scanX, nextY]);
          spanActive = true;
        } else if (!canFill) {
          spanActive = false;
        }
      }
    }
  }

  return { imageData, paintedPixels };
}

export function applyConfiguredColors(context, model, config, lineArtImage) {
  let imageData = context.getImageData(0, 0, canvasSize.width, canvasSize.height);

  const fillSeeds = (seeds, colorNameOrHex, tolerance = defaultFillTolerance, maxPaintedPixels = defaultMaxFillPixels) => {
    const colorValue = colorNameOrHex.startsWith?.('#') ? colorNameOrHex : colorByName(colorNameOrHex).hex;
    const color = hexToRgba(colorValue);

    seeds.forEach(([x, y]) => {
      const result = floodFill(imageData, x, y, color, tolerance, maxPaintedPixels);
      imageData = result.imageData;
    });
  };

  model.sections.forEach((section) => {
    fillSeeds(section.seeds, config[section.key].hex, section.tolerance ?? defaultFillTolerance, section.maxFillPixels);
  });

  (model.fixedSections ?? []).forEach((section) => {
    fillSeeds(section.seeds, section.color, section.tolerance ?? 64, section.maxFillPixels);
  });

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.drawImage(lineArtImage, 0, 0, canvasSize.width, canvasSize.height);
  context.globalCompositeOperation = 'source-over';
}

