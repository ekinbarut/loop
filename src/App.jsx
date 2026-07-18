import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { BrandLogo } from './components/BrandLogo.jsx';
import { ColorSwatchGroup } from './components/ColorSwatchGroup.jsx';
import { ConfigSummary } from './components/ConfigSummary.jsx';
import { ModelSelector } from './components/ModelSelector.jsx';
import { ProductPreview } from './components/ProductPreview.jsx';
import { bagModels, buildDefaultConfig, buildDefaultConfigsByModel, colorsForPalette, paintColors } from './config/bagModels.js';
import { enablePreviewDebug } from './constants/preview.js';
import discoGif from './assets/old/giphy.gif';
import discoMusic from './assets/old/music-short.m4a';
import loopLogo from './assets/old/loop-transparent.png';

const whatsappPhoneNumber = '905454179089';
const shopierUrl = 'https://www.shopier.com/loopdesignbags';
const partyBurstCount = 50;
const partyMinDelayMs = 1000;
const partyMaxDelayMs = 3000;

function getRandomPaintColor() {
  return paintColors[Math.floor(Math.random() * paintColors.length)];
}

function App() {
  const [selectedModelId, setSelectedModelId] = useState(bagModels[0].id);
  const [configsByModelId, setConfigsByModelId] = useState(() => buildDefaultConfigsByModel());
  const [resetKey, setResetKey] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const previewRef = useRef(null);
  const discoIntervalRef = useRef(null);
  const discoAudioRef = useRef(null);
  const partyIntervalRef = useRef(null);
  const partyTimeoutsRef = useRef([]);
  const [isDiscoMode, setIsDiscoMode] = useState(false);
  const [logoDiscoColor, setLogoDiscoColor] = useState('');

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

  const playDiscoMusic = () => {
    if (!discoAudioRef.current) {
      const audio = new Audio(discoMusic);
      audio.loop = true;
      audio.volume = 0.5;
      discoAudioRef.current = audio;
    }

    discoAudioRef.current.currentTime = 0;
    discoAudioRef.current.play().catch(() => {
      setCopyStatus('Muzik otomatik baslatilamadi. Disco topuna tekrar dokunmayi dene.');
    });
  };

  const stopDiscoMusic = () => {
    if (!discoAudioRef.current) {
      return;
    }

    discoAudioRef.current.pause();
    discoAudioRef.current.currentTime = 0;
  };

  const clearPartyTimers = () => {
    partyTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    partyTimeoutsRef.current = [];

    if (partyIntervalRef.current) {
      window.clearInterval(partyIntervalRef.current);
      partyIntervalRef.current = null;
    }
  };

  const stopDiscoMode = () => {
    if (discoIntervalRef.current) {
      window.clearInterval(discoIntervalRef.current);
      discoIntervalRef.current = null;
    }

    clearPartyTimers();
    stopDiscoMusic();
    setIsDiscoMode(false);
    setLogoDiscoColor('');
  };

  const getRandomConfettiOrigin = () => ({
    x: Math.random(),
    y: Math.random(),
  });

  const triggerPartyConfetti = () => {
    confetti({
      origin: getRandomConfettiOrigin(),
      particleCount: 14 + Math.floor(Math.random() * 18),
      scalar: 0.8 + Math.random() * 0.8,
      spread: 35 + Math.random() * 65,
      startVelocity: 24 + Math.random() * 36,
      ticks: 140,
      zIndex: 30,
    });
  };

  const schedulePartyWave = () => {
    for (let index = 0; index < partyBurstCount; index += 1) {
      const delay = partyMinDelayMs + Math.random() * (partyMaxDelayMs - partyMinDelayMs);
      const timeoutId = window.setTimeout(() => {
        triggerPartyConfetti();
        partyTimeoutsRef.current = partyTimeoutsRef.current.filter((id) => id !== timeoutId);
      }, delay);
      partyTimeoutsRef.current.push(timeoutId);
    }
  };

  const runDiscoTick = () => {
    randomizeSelectedModel();
    setLogoDiscoColor(getRandomPaintColor().hex);
  };

  const toggleDiscoMode = () => {
    if (discoIntervalRef.current) {
      stopDiscoMode();
      return;
    }

    runDiscoTick();
    schedulePartyWave();
    playDiscoMusic();
    setIsDiscoMode(true);
    discoIntervalRef.current = window.setInterval(runDiscoTick, 500);
    partyIntervalRef.current = window.setInterval(schedulePartyWave, partyMaxDelayMs);
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

      <main className="app-shell">
      <header className="brand-header">
        <BrandLogo className="brand-logo" src={loopLogo} alt="Loop" discoColor={logoDiscoColor} />
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
                <img src={discoGif} alt="" />
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
              options={colorsForPalette(section.palette)}
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
            <a className="shopier-link" href={shopierUrl} target="_blank" rel="noreferrer">
              Mağazaya git
            </a>
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

