import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { canvasSize, maxZoom, minZoom } from '../constants/preview.js';
import { applyConfiguredColors } from '../utils/canvasFill.js';

export const ProductPreview = forwardRef(function ProductPreview({ config, model, resetKey, debugEnabled }, ref) {
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

  useImperativeHandle(ref, () => ({
    getImageBlob() {
      const canvas = canvasRef.current;

      if (!canvas) {
        return Promise.resolve(null);
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    },
    downloadImage(filename = 'loop-bag.png') {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename;
      link.click();
    },
  }));

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

      if (debugEnabled) {
        setFullscreenImage(canvas.toDataURL('image/png'));
      }
    };

    return () => {
      image.onload = null;
    };
  }, [config, debugEnabled, model, resetKey]);

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

    setDebugPoint({ x, y });
    console.log(`[${x}, ${y}],`);
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
      {debugEnabled && (
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
      )}

      <div
        className={`bag-artboard-shell${debugEnabled ? ' is-debug-enabled' : ''}`}
        onPointerDown={debugEnabled ? handlePreviewPointerDown : undefined}
        onPointerMove={debugEnabled ? handlePreviewPointerMove : undefined}
        onPointerUp={debugEnabled ? handlePreviewPointerUp : undefined}
        onPointerCancel={debugEnabled ? handlePreviewPointerUp : undefined}
      >
        <div
          className="bag-artboard"
          style={debugEnabled ? { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` } : undefined}
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

      {debugEnabled && isFullscreen && (
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

      {debugEnabled && (
        <p className="debug-point" aria-live="polite">
          {debugPoint ? `Son nokta: [${debugPoint.x}, ${debugPoint.y}],` : 'Koordinat almak için önizlemeye tıkla.'}
        </p>
      )}
    </section>
  );
});
