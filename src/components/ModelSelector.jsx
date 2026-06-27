import { bagModels } from '../config/bagModels.js';

export function ModelSelector({ selectedModel, onSelect }) {
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

