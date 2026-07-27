import { useEffect, useMemo, useRef, useState } from 'react';
import loopLogo from '../assets/old/loop-transparent.png';
import { bagModels, fabricColors, strapColors } from '../config/bagModels.js';
import { canvasSize } from '../constants/preview.js';
import { applyConfiguredColors } from '../utils/canvasFill.js';

const pairs = bagModels.flatMap((model) => [0, 1].map((variant) => ({
  id: `${model.id}-${variant}`,
  label: `${model.name} ${variant + 1}`,
  model,
  variant,
})));

function configForCard(model, variant) {
  return Object.fromEntries(model.sections.map((section, index) => {
    const palette = section.palette === 'strap' ? strapColors : fabricColors;
    const offset = variant === 0 ? 2 : 9;
    return [section.key, palette[(index * 3 + offset) % palette.length]];
  }));
}

function PaintedBag({ model, variant }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !context) return undefined;

    const image = new Image();
    image.src = model.lineArt;
    image.onload = () => {
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      applyConfiguredColors(context, model, configForCard(model, variant), image);
    };
    return () => {
      image.onload = null;
    };
  }, [model, variant]);

  return <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} />;
}

function shuffledCards() {
  return pairs
    .flatMap((pair) => [0, 1].map((copy) => ({ ...pair, key: `${pair.id}-${copy}` })))
    .sort(() => Math.random() - 0.5);
}

export function MemoryGate({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(
    () => window.sessionStorage.getItem('loop-memory-won') === 'true',
  );
  const cards = useMemo(shuffledCards, []);
  const [turned, setTurned] = useState([]);
  const [matched, setMatched] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (matched.length !== pairs.length) return;
    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem('loop-memory-won', 'true');
      setIsUnlocked(true);
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [matched]);

  const turnCard = (card) => {
    if (isChecking || turned.includes(card.key) || matched.includes(card.id)) return;

    const nextTurned = [...turned, card.key];
    setTurned(nextTurned);
    if (nextTurned.length < 2) return;

    const firstCard = cards.find((item) => item.key === nextTurned[0]);
    if (firstCard.id === card.id) {
      setMatched((current) => [...current, card.id]);
      setTurned([]);
      return;
    }

    setIsChecking(true);
    window.setTimeout(() => {
      setTurned([]);
      setIsChecking(false);
    }, 850);
  };

  if (isUnlocked) return children;

  return (
    <main className="memory-gate">
      <section className="memory-board" aria-label="Hafıza oyunu">
        {cards.map((card) => {
          const isFaceUp = turned.includes(card.key) || matched.includes(card.id);
          return (
            <button
              className={`memory-card${isFaceUp ? ' is-turned' : ''}${matched.includes(card.id) ? ' is-matched' : ''}`}
              key={card.key}
              type="button"
              aria-label={isFaceUp ? card.label : 'Kapalı kart'}
              onClick={() => turnCard(card)}
            >
              <span className="memory-card-inner">
                <span className="memory-card-front" aria-hidden="true">
                  <img src={loopLogo} alt="" />
                </span>
                <span className="memory-card-back" aria-hidden="true">
                  <PaintedBag model={card.model} variant={card.variant} />
                </span>
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
