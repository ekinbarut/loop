import { useEffect, useRef } from 'react';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function BrandLogo({ alt, className = '', discoColor, src }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!discoColor) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });

    if (!canvas || !context) {
      return;
    }

    let isCancelled = false;
    const image = new Image();
    image.src = src;

    image.onload = () => {
      if (isCancelled) {
        return;
      }

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const color = hexToRgb(discoColor);

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        const brightness = red * 0.299 + green * 0.587 + blue * 0.114;

        if (alpha > 0 && brightness < 120) {
          pixels[index] = color.r;
          pixels[index + 1] = color.g;
          pixels[index + 2] = color.b;
        }
      }

      context.putImageData(imageData, 0, 0);
    };

    return () => {
      isCancelled = true;
    };
  }, [discoColor, src]);

  return (
    <span className={'brand-logo-frame ' + className} aria-label={alt} role="img">
      <img className="brand-logo-static" src={src} alt="" aria-hidden="true" />
      <canvas
        className={'brand-logo-canvas' + (discoColor ? ' is-visible' : '')}
        ref={canvasRef}
        aria-hidden="true"
      />
    </span>
  );
}
