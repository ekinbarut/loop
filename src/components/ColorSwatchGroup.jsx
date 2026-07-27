export function ColorSwatchGroup({
  getColorName,
  label,
  options,
  selected,
  swatchAriaLabel,
  unavailableLabel,
  onSelect,
}) {
  return (
    <fieldset className="swatch-group">
      <legend>{label}</legend>
      <div className="paint-palette">
        {options.map((color) => {
          const isSelected = selected.name === color.name;
          const colorName = getColorName(color);
          const isUnavailable = color.active === false;

          return (
            <button
              className={`paint-swatch${isSelected ? ' is-selected' : ''}${isUnavailable ? ' is-unavailable' : ''}`}
              key={color.id || color.name}
              type="button"
              onClick={() => onSelect(color)}
              aria-label={isUnavailable ? `${colorName}: ${unavailableLabel}` : swatchAriaLabel(label, colorName)}
              aria-pressed={isSelected}
              disabled={isUnavailable}
              title={isUnavailable ? `${colorName} — ${unavailableLabel}` : colorName}
            >
              <span style={{ backgroundColor: color.hex }} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
