import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorSwatchGroup } from './components/ColorSwatchGroup.jsx';
import { ConfigSummary } from './components/ConfigSummary.jsx';
import { ModelSelector } from './components/ModelSelector.jsx';
import { ProductPreview } from './components/ProductPreview.jsx';
import { bagModels, buildDefaultConfig, buildDefaultConfigsByModel, paintColors } from './config/bagModels.js';
import { enablePreviewDebug } from './constants/preview.js';
import confettiImage from './assets/old/confetti.png';

const whatsappPhoneNumber = '905454179089';
const confettiPieces = Array.from({ length: 64 }, (_, index) => ({
  id: index,
  delay: `${-(index * 0.21).toFixed(2)}s`,
  drift: `${((index % 9) - 4) * 24}px`,
  duration: `${5.5 + (index % 7) * 0.62}s`,
  left: `${(index * 11) % 100}%`,
  size: `${34 + (index % 6) * 8}px`,
}));

function App() {
  const [selectedModelId, setSelectedModelId] = useState(bagModels[0].id);
  const [configsByModelId, setConfigsByModelId] = useState(() => buildDefaultConfigsByModel());
  const [resetKey, setResetKey] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const previewRef = useRef(null);
  const discoIntervalRef = useRef(null);
  const [isDiscoMode, setIsDiscoMode] = useState(false);

  const selectedModel = bagModels.find((model) => model.id === selectedModelId) ?? bagModels[0];
  const config = configsByModelId[selectedModel.id];

  const orderNote = useMemo(() => {
    const colorSummary = selectedModel.sections
      .map((section) => `${section.label}: ${config[section.key].name}`)
      .join(', ');

    return `Merhaba, Loop özel çanta siparişi vermek istiyorum. Model: ${selectedModel.name}, ${colorSummary}. Görseli de mesaja ekledim.`;
  }, [config, selectedModel]);

  const updateModel = (modelId) => {
    stopDiscoMode();
    setSelectedModelId(modelId);
    setResetKey((currentKey) => currentKey + 1);
    setCopyStatus('');
  };

  const randomizeSelectedModel = () => {
    setConfigsByModelId((currentConfigs) => ({
      ...currentConfigs,
      [selectedModel.id]: buildDefaultConfig(selectedModel),
    }));
    setResetKey((currentKey) => currentKey + 1);
    setCopyStatus('');
  };

  const stopDiscoMode = () => {
    if (discoIntervalRef.current) {
      window.clearInterval(discoIntervalRef.current);
      discoIntervalRef.current = null;
    }

    setIsDiscoMode(false);
  };

  const toggleDiscoMode = () => {
    if (discoIntervalRef.current) {
      stopDiscoMode();
      return;
    }

    randomizeSelectedModel();
    setIsDiscoMode(true);
    discoIntervalRef.current = window.setInterval(randomizeSelectedModel, 500);
  };

  useEffect(() => stopDiscoMode, []);

  const updateSectionColor = (sectionKey, color) => {
    setConfigsByModelId((currentConfigs) => ({
      ...currentConfigs,
      [selectedModel.id]: {
        ...currentConfigs[selectedModel.id],
        [sectionKey]: color,
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

  const downloadPreviewImage = () => {
    previewRef.current?.downloadImage(`loop-${selectedModel.id}-siparis.png`);
    setCopyStatus('Görsel indirildi. WhatsApp mesajına görseli ekleyebilirsin.');
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(orderNote)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setCopyStatus('WhatsApp mesajı açıldı. Görseli indirdiysen mesaja ekleyebilirsin.');
  };

  return (
    <>
      <div className={`disco-backdrop${isDiscoMode ? ' is-active' : ''}`} aria-hidden="true" />

      <div className={`confetti-rain${isDiscoMode ? ' is-active' : ''}`} aria-hidden="true">
        {confettiPieces.map((piece) => (
          <img
            alt=""
            className="confetti-piece"
            key={piece.id}
            src={confettiImage}
            style={{
              '--confetti-delay': piece.delay,
              '--confetti-drift': piece.drift,
              '--confetti-duration': piece.duration,
              '--confetti-left': piece.left,
              '--confetti-size': piece.size,
            }}
          />
        ))}
      </div>

      <main className="app-shell">
      <header className="brand-header">
        <p>Kişiye özel renk seçimi</p>
        <h1>Loop</h1>
      </header>

      <section className="mobile-model-panel" aria-label="Mobil çanta modeli seçimi">
        <ModelSelector selectedModel={selectedModel} onSelect={updateModel} />
      </section>

      <div className="configurator-layout">
        <ProductPreview
          ref={previewRef}
          config={config}
          debugEnabled={enablePreviewDebug}
          model={selectedModel}
          resetKey={resetKey}
        />

        <section className="controls-card" aria-label="Özelleştirme kontrolleri">
          <div className="controls-heading">
            <h2>Renkleri seç</h2>
            <div className="random-actions">
              <button className="text-button" type="button" onClick={randomizeSelectedModel}>
                Rastgele
              </button>
              <button
                className={`disco-button${isDiscoMode ? ' is-active' : ''}`}
                type="button"
                onClick={toggleDiscoMode}
                aria-label={isDiscoMode ? 'Disko modunu kapat' : 'Disko modunu aç'}
                aria-pressed={isDiscoMode}
                title={isDiscoMode ? 'Disko modunu kapat' : 'Disko modu'}
              >
                🪩
              </button>
            </div>
          </div>

          <div className="desktop-model-selector">
            <ModelSelector selectedModel={selectedModel} onSelect={updateModel} />
          </div>

          {selectedModel.sections.map((section) => (
            <ColorSwatchGroup
              key={section.key}
              label={section.label}
              options={paintColors}
              selected={config[section.key]}
              onSelect={(color) => updateSectionColor(section.key, color)}
            />
          ))}

          <ConfigSummary
            config={config}
            selectedModel={selectedModel}
          />

          <section className="order-instructions" aria-labelledby="order-instructions-title">
            <h2 id="order-instructions-title">Sipariş için</h2>
            <ol>
              <li>Görseli indir veya ekran görüntüsü al.</li>
              <li>WhatsApp mesajını aç.</li>
              <li>Görseli WhatsApp mesajına ekleyip gönder.</li>
            </ol>
          </section>

          <div className="action-row">
            <button className="primary-button" type="button" onClick={downloadPreviewImage}>
              Görseli indir
            </button>
            <button className="whatsapp-button" type="button" onClick={shareOnWhatsApp}>
              <span className="whatsapp-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32" focusable="false">
                  <path d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.5 28.8l6.3-1.6A12.8 12.8 0 1 0 16 3.2Zm0 2.4a10.4 10.4 0 1 1-5.3 19.3l-.4-.2-3.2.8.9-3.1-.3-.5A10.4 10.4 0 0 1 16 5.6Zm-5 5.7c-.2.5-.7 1.3-.7 2.4 0 1.4 1 3.4 2.8 5.2 2 2 4.4 3.2 6.2 3.2 1.1 0 2.2-.6 2.5-1.3.3-.6.5-1.3.4-1.5-.1-.2-.3-.3-.6-.5l-1.9-.9c-.3-.1-.5-.2-.8.2l-.8 1c-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.3-2.1-2.7-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.7l-.9-2c-.2-.5-.5-.5-.7-.5h-.6Z" />
                </svg>
              </span>
              WhatsApp ile gönder
            </button>
          </div>

          <div aria-live="polite" className="copy-status">
            {copyStatus}
          </div>
        </section>
      </div>
      </main>
    </>
  );
}

export default App;

