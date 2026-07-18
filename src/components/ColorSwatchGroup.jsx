export function ColorSwatchGroup({ getColorName, label, options, selected, swatchAriaLabel, onSelect }) {
  return (
    <fieldset className="swatch-group">
      <legend>{label}</legend>
      <div className="paint-palette">
        {options.map((color) => {
          const isSelected = selected.name === color.name;
          const colorName = getColorName(color);

          return (
            <button
              className={`paint-swatch${isSelected ? ' is-selected' : ''}`}
              key={color.name}
              type="button"
              onClick={() => onSelect(color)}
              aria-label={swatchAriaLabel(label, colorName)}
              aria-pressed={isSelected}
              title={colorName}
            >
              <span style={{ backgroundColor: color.hex }} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
