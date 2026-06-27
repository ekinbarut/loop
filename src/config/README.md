# Çanta Modeli Ayarları

Boyanabilir alan, sabit alan veya renk paleti değiştirmek için `bagModels.js` dosyasını düzenle.

## Yeni Section Ekleme

İlgili modeli bul:

```js
{
  id: 'canta3',
  name: 'Duffel Çanta',
  sections: [
    // yeni section buraya
  ],
}
```

Yeni section örneği:

```js
{
  key: 'color6',
  label: 'Yeni panel',
  defaultColor: 'Saks Mavisi',
  seeds: [
    [472, 833],
    [549, 691],
  ],
}
```

Kurallar:

- `key` aynı model içinde benzersiz olmalı.
- Basit sıralama için `color1`, `color2`, `color3` gibi devam edebilirsin.
- `label` kullanıcıya görünen isimdir.
- `defaultColor` artık sadece referans amaçlı; uygulama açılışında her model kendi renklerini rastgele ve birbirinden farklı seçiyor.
- `seeds` önizlemede tıklayınca konsola düşen `[x, y]` koordinatlarıdır.
- Bir section içine istediğin kadar seed ekleyebilirsin.

## Boyama Taşarsa

Bir seed yanlışlıkla arka plana kaçıyorsa section'a daha düşük bir limit ekleyebilirsin:

```js
{
  key: 'color6',
  label: 'Yeni panel',
  defaultColor: 'Saks Mavisi',
  maxFillPixels: 90000,
  seeds: [[472, 833]],
}
```

Alan çok küçük kalıyorsa `maxFillPixels` değerini yükselt.

## Sabit Alan Ekleme

Kullanıcı tarafından değiştirilmeyecek ama her zaman boyanacak alanlar için `fixedSections` kullan:

```js
fixedSections: [
  {
    label: 'Sabit siyah detaylar',
    color: 'Siyah',
    seeds: [
      [100, 200],
      [140, 260],
    ],
  },
],
```

`color`, palet adı (`'Siyah'`) veya hex (`'#050505'`) olabilir.

Sabit alanlar kullanıcı seçimlerinden sonra boyanır, yani koordinatlar çakışırsa sabit alan kazanır.

Gerekirse tolerans da verebilirsin:

```js
{
  label: 'Sabit siyah detaylar',
  color: 'Siyah',
  tolerance: 160,
  seeds: [[100, 200]],
}
```

## Renk Paleti

Renkler `paintColors` içinde durur:

```js
{ name: 'Saks Mavisi', hex: '#2169D8' },
```

Şu an uygulama sadece bu listedeki renkleri gösterir.
