import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { BrandLogo } from './components/BrandLogo.jsx';
import { ColorSwatchGroup } from './components/ColorSwatchGroup.jsx';
import { ConfigSummary } from './components/ConfigSummary.jsx';
import { ModelSelector } from './components/ModelSelector.jsx';
import { ProductPreview } from './components/ProductPreview.jsx';
import { ProductShowcase } from './components/ProductShowcase.jsx';
import { bagModels, buildDefaultConfig, buildDefaultConfigsByModel, colorsForPalette, paintColors } from './config/bagModels.js';
import { enablePreviewDebug } from './constants/preview.js';
import { createTranslator, languages, translateColorName, translateSectionLabel } from './i18n.js';
import { fetchColorPalette } from './services/colorPalette.js';
import { buildDynamicBackgroundTheme } from './utils/colorTheme.js';
import discoGif from './assets/old/giphy.gif';
import discoMusic from './assets/old/music-short.m4a';
import loopLogo from './assets/old/loop-transparent.png';

const whatsappPhoneNumber = '905454179089';
const shopierUrl = 'https://www.shopier.com/loopdesignbags';
const partyBurstCount = 50;
const partyMinDelayMs = 1000;
const partyMaxDelayMs = 3000;

function getSavedLanguage() {
  if (typeof window === 'undefined') {
    return 'tr';
  }

  return window.localStorage.getItem('loop-language') || 'tr';
}

function getRandomPaintColor(palettes) {
  const availableColors = palettes
    ? Object.values(palettes).flat().filter((color) => color.active !== false)
    : paintColors;
  return availableColors[Math.floor(Math.random() * availableColors.length)] ?? paintColors[0];
}

function App() {
  const [language, setLanguage] = useState(getSavedLanguage);
  const [selectedModelId, setSelectedModelId] = useState(bagModels[0].id);
  const [configsByModelId, setConfigsByModelId] = useState(() => buildDefaultConfigsByModel());
  const [paletteColors, setPaletteColors] = useState(null);
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
  const t = useMemo(() => createTranslator(language), [language]);
  const getSectionLabel = (label) => translateSectionLabel(label, language);
  const getColorName = (color) => language === 'en'
    ? color.nameEn || translateColorName(color.name, language)
    : color.name;
  const dynamicTheme = useMemo(() => buildDynamicBackgroundTheme(config), [config]);

  const orderNote = useMemo(() => {
    const colorSummary = selectedModel.sections
      .map((section) => getSectionLabel(section.label) + ': ' + getColorName(config[section.key]))
      .join(', ');

    return t('orderNote', { model: selectedModel.name, summary: colorSummary });
  }, [config, language, selectedModel, t]);

  const updateModel = (modelId) => {
    stopDiscoMode();
    setSelectedModelId(modelId);
    setResetKey((currentKey) => currentKey + 1);
    setCopyStatus('');
  };

  const randomizeSelectedModel = () => {
    setConfigsByModelId((currentConfigs) => ({
      ...currentConfigs,
      [selectedModel.id]: buildDefaultConfig(selectedModel, paletteColors),
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
      setCopyStatus(t('musicFailed'));
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
    setLogoDiscoColor(getRandomPaintColor(paletteColors).hex);
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

  useEffect(() => {
    window.localStorage.setItem('loop-language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const controller = new AbortController();

    fetchColorPalette({ signal: controller.signal })
      .then((palettes) => {
        setPaletteColors(palettes);
        setConfigsByModelId((currentConfigs) => Object.fromEntries(
          bagModels.map((model) => {
            const currentConfig = currentConfigs[model.id];
            const nextConfig = Object.fromEntries(model.sections.map((section) => {
              const options = colorsForPalette(section.palette, palettes);
              const currentColor = currentConfig[section.key];
              const matchingColor = options.find((color) => color.name === currentColor.name);
              const availableColor = options.find((color) => color.active !== false);

              return [
                section.key,
                matchingColor && matchingColor.active !== false ? matchingColor : availableColor || currentColor,
              ];
            }));

            return [model.id, nextConfig];
          }),
        ));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.warn('Color palette could not be initialized.', error);
        }
      });

    return () => controller.abort();
  }, []);

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
      setCopyStatus(t('orderCopied'));
    } catch {
      setCopyStatus(t('copyFailed'));
    }
  };

  const downloadPreviewImage = () => {
    previewRef.current?.downloadImage('loop-' + selectedModel.id + '-siparis.png');
    setCopyStatus(t('imageDownloaded'));
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = 'https://wa.me/' + whatsappPhoneNumber + '?text=' + encodeURIComponent(orderNote);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setCopyStatus(t('whatsappOpened'));
  };

  return (
    <>
      <div className="page-background" style={dynamicTheme} aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <span className={'background-circle circle-' + (index + 1)} key={index} />
        ))}
      </div>
      <div className={'disco-backdrop' + (isDiscoMode ? ' is-active' : '')} aria-hidden="true" />

      <main className="app-shell">
        <header className="brand-header">
          <div className="language-switcher" aria-label="Language selection">
            {languages.map((item) => (
              <button
                className={'language-option' + (language === item.code ? ' is-active' : '')}
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                aria-pressed={language === item.code}
              >
                {item.label}
              </button>
            ))}
          </div>
          <BrandLogo className="brand-logo" src={loopLogo} alt="Loop" discoColor={logoDiscoColor} />
        </header>

        <section className="mobile-model-panel" aria-label={t('mobileModelSelection')}>
          <ModelSelector selectedModel={selectedModel} onSelect={updateModel} t={t} />
        </section>

        <div className="configurator-layout">
          <ProductPreview
            ref={previewRef}
            config={config}
            debugEnabled={enablePreviewDebug}
            model={selectedModel}
            resetKey={resetKey}
            t={t}
          />

          <section className="controls-card" aria-label={t('customizationControls')}>
            <div className="controls-heading">
              <div className="random-actions">
                <button className="text-button" type="button" onClick={randomizeSelectedModel}>
                  {t('randomize')}
                </button>
                <button
                  className={'disco-button' + (isDiscoMode ? ' is-active' : '')}
                  type="button"
                  onClick={toggleDiscoMode}
                  aria-label={isDiscoMode ? t('discoOff') : t('discoOn')}
                  aria-pressed={isDiscoMode}
                  title={isDiscoMode ? t('discoOff') : t('discoMode')}
                >
                  <img src={discoGif} alt="" />
                </button>
              </div>
            </div>

            <div className="desktop-model-selector">
              <ModelSelector selectedModel={selectedModel} onSelect={updateModel} t={t} />
            </div>

            {selectedModel.sections.map((section) => (
              <ColorSwatchGroup
                key={section.key}
                label={getSectionLabel(section.label)}
                options={colorsForPalette(section.palette, paletteColors)}
                selected={config[section.key]}
                getColorName={getColorName}
                swatchAriaLabel={(part, color) => t('setColor', { part, color })}
                unavailableLabel={t('colorUnavailable')}
                onSelect={(color) => updateSectionColor(section.key, color)}
              />
            ))}

            <ConfigSummary
              config={config}
              getColorName={getColorName}
              getSectionLabel={getSectionLabel}
              selectedModel={selectedModel}
              t={t}
            />

            <section className="order-instructions" aria-labelledby="order-instructions-title">
              <h2 id="order-instructions-title">{t('orderTitle')}</h2>
              <ol>
                <li>{t('orderStepImage')}</li>
                <li>{t('orderStepWhatsapp')}</li>
                <li>{t('orderStepSend')}</li>
              </ol>
            </section>

            <div className="action-row">
              <button className="primary-button" type="button" onClick={downloadPreviewImage}>
                {t('downloadImage')}
              </button>
              <button className="whatsapp-button" type="button" onClick={shareOnWhatsApp}>
                <span className="whatsapp-icon" aria-hidden="true">
                  <svg viewBox="0 0 32 32" focusable="false">
                    <path d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.5 28.8l6.3-1.6A12.8 12.8 0 1 0 16 3.2Zm0 2.4a10.4 10.4 0 1 1-5.3 19.3l-.4-.2-3.2.8.9-3.1-.3-.5A10.4 10.4 0 0 1 16 5.6Zm-5 5.7c-.2.5-.7 1.3-.7 2.4 0 1.4 1 3.4 2.8 5.2 2 2 4.4 3.2 6.2 3.2 1.1 0 2.2-.6 2.5-1.3.3-.6.5-1.3.4-1.5-.1-.2-.3-.3-.6-.5l-1.9-.9c-.3-.1-.5-.2-.8.2l-.8 1c-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.3-2.1-2.7-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.7l-.9-2c-.2-.5-.5-.5-.7-.5h-.6Z" />
                  </svg>
                </span>
                {t('sendWhatsApp')}
              </button>
            </div>

            <div aria-live="polite" className="copy-status">
              {copyStatus}
            </div>
          </section>
        </div>

        <ProductShowcase shopierUrl={shopierUrl} t={t} />
      </main>
    </>
  );
}

export default App;
