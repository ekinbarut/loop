export function ConfigSummary({ config, selectedModel }) {
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
    </section>
  );
}
