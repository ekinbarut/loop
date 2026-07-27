import { useEffect, useState } from 'react';

const endpoint = import.meta.env.VITE_COLORS_API_ENDPOINT || '';

function parseCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  if (header !== 'id,active,palette,nameTr,nameEn,hex') throw new Error('CSV biçimi geçersiz.');
  return lines.filter(Boolean).map((line) => {
    const [id, active, palette, nameTr, nameEn, hex] = line.split(',');
    return { id, active: active === 'TRUE', palette, nameTr, nameEn, hex };
  });
}

function toCsv(colors) {
  const rows = colors.map((color) => [
    color.id, color.active ? 'TRUE' : 'FALSE', color.palette,
    color.nameTr.replaceAll(',', ' '), color.nameEn.replaceAll(',', ' '), color.hex.toLowerCase(),
  ].join(','));
  return ['id,active,palette,nameTr,nameEn,hex', ...rows].join('\n');
}

export function ColorAdmin() {
  const [colors, setColors] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!endpoint) return;
    fetch(endpoint).then((result) => {
      if (!result.ok) throw new Error('Renkler yüklenemedi.');
      return result.text();
    }).then((csv) => setColors(parseCsv(csv))).catch((error) => setStatus(error.message));
  }, []);

  const update = (index, patch) => setColors((current) => current.map((color, colorIndex) => (
    colorIndex === index ? { ...color, ...patch } : color
  )));

  const save = async () => {
    setStatus('Kaydediliyor…');
    try {
      const result = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: toCsv(colors) }),
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error);
      setStatus('Renkler kaydedildi.');
    } catch (error) {
      setStatus(error.message || 'Kaydedilemedi.');
    }
  };

  if (!endpoint) {
    return <main className="admin-shell"><p>VITE_COLORS_API_ENDPOINT ayarlanmamış.</p></main>;
  }

  return (
    <main className="admin-shell">
      <header className="admin-header"><div><h1>Renk yönetimi</h1><p>Değişiklikler müşteri ekranına doğrudan yansır.</p></div><button onClick={save}>Kaydet</button></header>
      {['fabric', 'strap'].map((palette) => (
        <section className="admin-palette" key={palette}>
          <h2>{palette === 'fabric' ? 'İmperteks renkleri' : 'Kolon renkleri'}</h2>
          {colors.map((color, index) => color.palette === palette && (
            <div className="admin-color-row" key={color.id}>
              <input aria-label={`${color.nameTr} renk seçici`} type="color" value={color.hex} onChange={(e) => update(index, { hex: e.target.value })} />
              <input aria-label="Renk adı" value={color.nameTr} onChange={(e) => update(index, { nameTr: e.target.value })} />
              <input className="admin-hex" aria-label="Hex kodu" value={color.hex} pattern="#[0-9a-fA-F]{6}" onChange={(e) => update(index, { hex: e.target.value })} />
              <label className="admin-toggle"><input type="checkbox" checked={color.active} onChange={(e) => update(index, { active: e.target.checked })} /><span />{color.active ? 'Aktif' : 'Pasif'}</label>
            </div>
          ))}
        </section>
      ))}
      <div className="admin-actions"><button onClick={save}>Kaydet</button>{status && <p>{status}</p>}</div>
    </main>
  );
}
