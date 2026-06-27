import React, { useEffect, useMemo, useRef, useState } from 'react';
import { bagModels, buildDefaultConfig, buildDefaultConfigsByModel, colorByName, paintColors } from './config/bagModels.js';

const canvasSize = {
  width: 1080,
  height: 1350,
};

const minZoom = 0.75;
const maxZoom = 8;
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

function ModelSelector({ selectedModel, onSelect }) {
  return (
    <section className="model-selector" aria-label="Çanta modeli seç">
      {bagModels.map((model) => (
        <button
          className={`model-button${selectedModel.id === model.id ? ' is-selected' : ''}`}
          key={model.id}
          type="button"
          onClick={() => onSelect(model.id)}
          aria-pressed={selectedModel.id === model.id}
        >
          <img src={model.lineArt} alt="" />
          <span>{model.name}</span>
        </button>
      ))}
    </section>
  );
}

function applyConfiguredColors(context, model, config, lineArtImage) {
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

  // Fixed sections are applied last so they always win when seeds overlap.
  (model.fixedSections ?? []).forEach((section) => {
    fillSeeds(section.seeds, section.color, section.tolerance ?? 64, section.maxFillPixels);
  });

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.drawImage(lineArtImage, 0, 0, canvasSize.width, canvasSize.height);
  context.globalCompositeOperation = 'source-over';
}

function ProductPreview({ config, model, resetKey }) {
  const canvasRef = useRef(null);
  const fullscreenImageRef = useRef(null);
  const pointersRef = useRef(new Map());
  const fullscreenPointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const fullscreenGestureRef = useRef(null);
  const [debugPoint, setDebugPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreenZoom, setFullscreenZoom] = useState(1);
  const [fullscreenPan, setFullscreenPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });

    if (!canvas || !context) {
      return undefined;
    }

    const image = new Image();
    image.src = model.lineArt;

    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      applyConfiguredColors(context, model, config, image);
      setFullscreenImage(canvas.toDataURL('image/png'));
    };

    return () => {
      image.onload = null;
    };
  }, [config, model, resetKey]);

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    pointersRef.current.clear();
    gestureRef.current = null;
  }, [model.id, resetKey]);

  const logPoint = (clientX, clientY, rect) => {
    const x = Math.floor(((clientX - rect.left) / rect.width) * canvasSize.width);
    const y = Math.floor(((clientY - rect.top) / rect.height) * canvasSize.height);

    if (x < 0 || x > canvasSize.width || y < 0 || y > canvasSize.height) {
      return;
    }

    const copyValue = `[${x}, ${y}],`;

    setDebugPoint({ x, y });
    console.log(copyValue);
  };

  const handlePreviewPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const points = [...pointersRef.current.values()];

    if (points.length === 1) {
      gestureRef.current = {
        type: 'pan',
        startX: event.clientX,
        startY: event.clientY,
        startPan: pan,
        moved: false,
      };
    }

    if (points.length === 2) {
      const [firstPoint, secondPoint] = points;
      const distance = Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);

      gestureRef.current = {
        type: 'pinch',
        startDistance: distance,
        startZoom: zoom,
        startPan: pan,
      };
    }
  };

  const handlePreviewPointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) {
      return;
    }

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const gesture = gestureRef.current;
    const points = [...pointersRef.current.values()];

    if (!gesture) {
      return;
    }

    if (gesture.type === 'pan' && points.length === 1) {
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const moved = Math.hypot(deltaX, deltaY) > 4;

      gestureRef.current = { ...gesture, moved };
      setPan({
        x: gesture.startPan.x + deltaX,
        y: gesture.startPan.y + deltaY,
      });
    }

    if (gesture.type === 'pinch' && points.length >= 2) {
      const [firstPoint, secondPoint] = points;
      const distance = Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);
      const nextZoom = Math.min(maxZoom, Math.max(minZoom, gesture.startZoom * (distance / gesture.startDistance)));

      setZoom(nextZoom);
    }
  };

  const handlePreviewPointerUp = (event) => {
    const canvas = canvasRef.current;
    const gesture = gestureRef.current;

    pointersRef.current.delete(event.pointerId);

    if (canvas && gesture?.type === 'pan' && !gesture.moved) {
      logPoint(event.clientX, event.clientY, canvas.getBoundingClientRect());
    }

    if (pointersRef.current.size === 0) {
      gestureRef.current = null;
    }
  };

  const handleFullscreenPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    fullscreenPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const points = [...fullscreenPointersRef.current.values()];

    if (points.length === 1) {
      fullscreenGestureRef.current = {
        type: 'pan',
        startX: event.clientX,
        startY: event.clientY,
        startPan: fullscreenPan,
        moved: false,
      };
    }

    if (points.length === 2) {
      const [firstPoint, secondPoint] = points;
      const distance = Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);

      fullscreenGestureRef.current = {
        type: 'pinch',
        startDistance: distance,
        startZoom: fullscreenZoom,
      };
    }
  };

  const handleFullscreenPointerMove = (event) => {
    if (!fullscreenPointersRef.current.has(event.pointerId)) {
      return;
    }

    fullscreenPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const gesture = fullscreenGestureRef.current;
    const points = [...fullscreenPointersRef.current.values()];

    if (!gesture) {
      return;
    }

    if (gesture.type === 'pan' && points.length === 1) {
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const moved = Math.hypot(deltaX, deltaY) > 4;

      fullscreenGestureRef.current = { ...gesture, moved };
      setFullscreenPan({
        x: gesture.startPan.x + deltaX,
        y: gesture.startPan.y + deltaY,
      });
    }

    if (gesture.type === 'pinch' && points.length >= 2) {
      const [firstPoint, secondPoint] = points;
      const distance = Math.hypot(secondPoint.x - firstPoint.x, secondPoint.y - firstPoint.y);

      setFullscreenZoom(Math.min(maxZoom, Math.max(minZoom, gesture.startZoom * (distance / gesture.startDistance))));
    }
  };

  const handleFullscreenPointerUp = (event) => {
    const image = fullscreenImageRef.current;
    const gesture = fullscreenGestureRef.current;

    fullscreenPointersRef.current.delete(event.pointerId);

    if (image && gesture?.type === 'pan' && !gesture.moved) {
      logPoint(event.clientX, event.clientY, image.getBoundingClientRect());
    }

    if (fullscreenPointersRef.current.size === 0) {
      fullscreenGestureRef.current = null;
    }
  };

  const openFullscreen = () => {
    const canvas = canvasRef.current;

    if (canvas) {
      setFullscreenImage(canvas.toDataURL('image/png'));
    }

    setFullscreenZoom(1);
    setFullscreenPan({ x: 0, y: 0 });
    setIsFullscreen(true);
  };

  return (
    <section className="preview-card" aria-label={`${model.name} renk önizlemesi`}>
      <div className="preview-tools" aria-label="Önizleme araçları">
        <button type="button" onClick={() => setZoom((currentZoom) => Math.max(minZoom, currentZoom - 0.5))}>
          -
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((currentZoom) => Math.min(maxZoom, currentZoom + 0.5))}>
          +
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          Sıfırla
        </button>
        <button type="button" onClick={openFullscreen}>
          Tam ekran
        </button>
      </div>

      <div
        className="bag-artboard-shell"
        onPointerDown={handlePreviewPointerDown}
        onPointerMove={handlePreviewPointerMove}
        onPointerUp={handlePreviewPointerUp}
        onPointerCancel={handlePreviewPointerUp}
      >
        <div
          className="bag-artboard"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <canvas
            aria-label={`${model.name} renkli çizim`}
            className="paint-canvas"
            height={canvasSize.height}
            ref={canvasRef}
            role="img"
            width={canvasSize.width}
          />
        </div>
      </div>

      {isFullscreen && (
        <div className="fullscreen-preview" role="dialog" aria-modal="true" aria-label={`${model.name} tam ekran önizleme`}>
          <div className="fullscreen-toolbar">
            <p>{debugPoint ? `Son nokta: [${debugPoint.x}, ${debugPoint.y}],` : 'Koordinat almak için görsele tıkla.'}</p>
            <button type="button" onClick={() => setIsFullscreen(false)}>
              Kapat
            </button>
          </div>
          <div
            className="fullscreen-canvas-shell"
            onPointerDown={handleFullscreenPointerDown}
            onPointerMove={handleFullscreenPointerMove}
            onPointerUp={handleFullscreenPointerUp}
            onPointerCancel={handleFullscreenPointerUp}
          >
            <img
              alt={`${model.name} tam ekran renkli çizim`}
              className="fullscreen-image"
              ref={fullscreenImageRef}
              src={fullscreenImage}
              style={{ transform: `translate(${fullscreenPan.x}px, ${fullscreenPan.y}px) scale(${fullscreenZoom})` }}
            />
          </div>
        </div>
      )}
      <p className="debug-point" aria-live="polite">
        {debugPoint ? `Son nokta: [${debugPoint.x}, ${debugPoint.y}],` : 'Koordinat almak için önizlemeye tıkla.'}
      </p>
    </section>
  );
}

function ColorSwatchGroup({ label, options, selected, onSelect }) {
  return (
    <fieldset className="swatch-group">
      <legend>{label}</legend>
      <div className="paint-palette">
        {options.map((color) => {
          const isSelected = selected.name === color.name;

          return (
            <button
              className={`paint-swatch${isSelected ? ' is-selected' : ''}`}
              key={color.name}
              type="button"
              onClick={() => onSelect(color)}
              aria-label={`${label} rengini ${color.name} yap`}
              aria-pressed={isSelected}
              title={color.name}
            >
              <span style={{ backgroundColor: color.hex }} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ConfigSummary({ config, orderNote, selectedModel }) {
  return (
    <section className="summary" aria-labelledby="summary-title">
      <h2 id="summary-title">Seçimler</h2>
      <dl>
        <div>
          <dt>Model</dt>
          <dd>{selectedModel.name}</dd>
        </div>
        {selectedModel.sections.map((section) => (
          <div key={section.key}>
            <dt>{section.label}</dt>
            <dd>{config[section.key].name}</dd>
          </div>
        ))}
      </dl>
      <p>{orderNote}</p>
    </section>
  );
}

function App() {
  const [selectedModelId, setSelectedModelId] = useState(bagModels[0].id);
  const [configsByModelId, setConfigsByModelId] = useState(() => buildDefaultConfigsByModel());
  const [resetKey, setResetKey] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');

  const selectedModel = bagModels.find((model) => model.id === selectedModelId) ?? bagModels[0];
  const config = configsByModelId[selectedModel.id];

  const orderNote = useMemo(() => {
    const colorSummary = selectedModel.sections
      .map((section) => `${section.label}: ${config[section.key].name}`)
      .join(', ');

    return `Loop özel çanta siparişi: Model: ${selectedModel.name}, ${colorSummary}.`;
  }, [config, selectedModel]);

  const updateModel = (modelId) => {
    setSelectedModelId(modelId);
    setResetKey((currentKey) => currentKey + 1);
    setCopyStatus('');
  };

  const resetConfig = () => {
    setConfigsByModelId((currentConfigs) => ({
      ...currentConfigs,
      [selectedModel.id]: buildDefaultConfig(selectedModel),
    }));
    setResetKey((currentKey) => currentKey + 1);
    setCopyStatus('');
  };

  const updatePart = (part, color) => {
    setConfigsByModelId((currentConfigs) => ({
      ...currentConfigs,
      [selectedModel.id]: {
        ...currentConfigs[selectedModel.id],
        [part]: color,
      },
    }));
    setCopyStatus('');
  };

  const copyOrderNote = async () => {
    try {
      await navigator.clipboard.writeText(orderNote);
      setCopyStatus('Sipariş notu kopyalandı.');
    } catch {
      setCopyStatus('Kopyalama başarısız oldu. Sipariş notunu elle seçip kopyalayabilirsin.');
    }
  };

  return (
    <main className="app-shell">
      <header className="brand-header">
        <p>Kişiye özel renk seçimi</p>
        <h1>Loop</h1>
      </header>

      <div className="configurator-layout">
        <ProductPreview
          config={config}
          model={selectedModel}
          resetKey={resetKey}
        />

        <section className="controls-card" aria-label="Özelleştirme kontrolleri">
          <div className="controls-heading">
            <h2>Model ve renkleri seç</h2>
            <button className="text-button" type="button" onClick={resetConfig}>
              Rastgele
            </button>
          </div>

          <ModelSelector selectedModel={selectedModel} onSelect={updateModel} />

          {selectedModel.sections.map((section) => (
            <ColorSwatchGroup
              key={section.key}
              label={section.label}
              options={paintColors}
              selected={config[section.key]}
              onSelect={(color) => updatePart(section.key, color)}
            />
          ))}

          <ConfigSummary
            config={config}
            orderNote={orderNote}
            selectedModel={selectedModel}
          />

          <div className="action-row">
            <button className="primary-button" type="button" onClick={copyOrderNote}>
              Sipariş notunu kopyala
            </button>
            <button className="secondary-button" type="button" onClick={copyOrderNote}>
              Notu oluştur
            </button>
          </div>

          <div aria-live="polite" className="copy-status">
            {copyStatus}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
