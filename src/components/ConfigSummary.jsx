export function ConfigSummary({ config, getColorName, getSectionLabel, selectedModel, t }) {
  return (
    <section className="summary" aria-labelledby="summary-title">
      <h2 id="summary-title">{t('summaryTitle')}</h2>
      <dl>
        <div>
          <dt>{t('model')}</dt>
          <dd>{selectedModel.name}</dd>
        </div>
        {selectedModel.sections.map((section) => (
          <div key={section.key}>
            <dt>{getSectionLabel(section.label)}</dt>
            <dd>{getColorName(config[section.key])}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
