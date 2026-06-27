export function ColorSwatchGroup({ label, options, selected, onSelect }) {
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

