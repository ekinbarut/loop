const baseBackground = { r: 233, g: 233, b: 233 };
const anchorInk = { r: 47, g: 37, b: 31 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: lightness * 100 };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue;

  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return { h: hue * 60, s: saturation * 100, l: lightness * 100 };
}

function hslToRgb({ h, s, l }) {
  const hue = h / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { r: value, g: value, b: value };
  }

  const hueToRgb = (p, q, t) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
}

function mixRgb(color, target, targetAmount) {
  return {
    r: Math.round(color.r * (1 - targetAmount) + target.r * targetAmount),
    g: Math.round(color.g * (1 - targetAmount) + target.g * targetAmount),
    b: Math.round(color.b * (1 - targetAmount) + target.b * targetAmount),
  };
}

function rgba(color, alpha) {
  return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')';
}

function averageHue(hslColors) {
  const vector = hslColors.reduce(
    (acc, color) => {
      const radians = (color.h * Math.PI) / 180;
      return {
        x: acc.x + Math.cos(radians),
        y: acc.y + Math.sin(radians),
      };
    },
    { x: 0, y: 0 },
  );

  return ((Math.atan2(vector.y, vector.x) * 180) / Math.PI + 360) % 360;
}

function getSelectedColor(colors, index) {
  if (colors.length === 0) {
    return baseBackground;
  }

  return colors[index % colors.length];
}

function softened(color, amount) {
  return mixRgb(color, baseBackground, amount);
}

export function buildDynamicBackgroundTheme(config) {
  const selectedColors = Object.values(config).map((color) => hexToRgb(color.hex));
  const hslColors = selectedColors.map(rgbToHsl);
  const primary = getSelectedColor(selectedColors, 0);
  const secondary = getSelectedColor(selectedColors, 1);
  const tertiary = getSelectedColor(selectedColors, 2);
  const averageSaturation = hslColors.length > 0
    ? hslColors.reduce((sum, color) => sum + color.s, 0) / hslColors.length
    : 0;
  const accent = hslToRgb({
    h: (averageHue(hslColors) + 137.5) % 360,
    s: clamp(averageSaturation * 0.86, 42, 76),
    l: 66,
  });
  const secondaryAccent = hslToRgb({
    h: (averageHue(hslColors) + 205) % 360,
    s: clamp(averageSaturation * 0.7, 34, 66),
    l: 72,
  });

  return {
    '--theme-soft-1': rgba(softened(primary, 0.36), 0.96),
    '--theme-soft-2': rgba(softened(secondary, 0.4), 0.94),
    '--theme-soft-3': rgba(softened(tertiary, 0.44), 0.9),
    '--theme-extra': rgba(softened(accent, 0.26), 0.9),
    '--theme-extra-strong': rgba(softened(secondaryAccent, 0.22), 0.94),
    '--theme-line': rgba(mixRgb(primary, anchorInk, 0.24), 0.12),
  };
}
