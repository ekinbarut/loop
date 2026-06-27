import fillRegionsReport from "../../scripts/fill-regions-report.json";
import canta1Lines from "../assets/old/canta1-lines.png";
import canta2Lines from "../assets/old/canta2-lines.png";
import canta3Lines from "../assets/old/canta3-lines.png";

const duffelMeshSeeds = fillRegionsReport["canta3-duffel-mesh"].map(
  (region) => region.seed,
);

export const paintColors = [
  { name: "Siyah", hex: "#050505" },
  { name: "Antrasit", hex: "#333333" },
  { name: "Gri", hex: "#8A8A8A" },
  { name: "Gümüş", hex: "#C9C9C9" },
  { name: "Beyaz", hex: "#FFFFFF" },
  { name: "Sarı", hex: "#FFD62E" },
  { name: "Fıstık Yeşili", hex: "#9AD32D" },
  { name: "Zümrüt", hex: "#2F7A5F" },
  { name: "Haki", hex: "#777B62" },
  { name: "Lacivert", hex: "#102B5B" },
  { name: "Kırmızı", hex: "#D5163A" },
  { name: "Fuşya", hex: "#D12B61" },
  { name: "Taba", hex: "#A95E39" },
  { name: "Bej", hex: "#D8C3A5" },
  { name: "Mercan", hex: "#F36E55" },
  { name: "Pembe", hex: "#E757C8" },
  { name: "Mor", hex: "#6B4BD8" },
  { name: "Turkuaz", hex: "#23C7D3" },
  { name: "Hardal", hex: "#E6B52E" },
  { name: "Saks Mavisi", hex: "#2169D8" },
  { name: "Bordo", hex: "#8A1E4D" },
  { name: "Açık Pembe", hex: "#E9D8DC" },
];

export const bagModels = [
  {
    id: "canta3",
    name: "Loop Barrel Pack",
    lineArt: canta3Lines,
    sections: [
      {
        key: "color1",
        label: "Ana gövde",
        defaultColor: "Haki",
        seeds: [
          [650, 720],
          [775, 610],
          [472, 833],
          [549, 691],
          [569, 888],
          [631, 824],
          [842, 777],
          [830, 569],
          [932, 627],
          [331, 715],
          [333, 713],
          [350, 997],
          [355, 988],
          [338, 920],
          [958, 479],
        ],
      },
      {
        key: "color2",
        label: "Üst panel",
        defaultColor: "Siyah",
        seeds: [
          [560, 490],
          [226, 516],
        ],
      },
      {
        key: "color3",
        label: "File panel",
        defaultColor: "Taba",
        seeds: [
          [175, 710],
          [979, 494],
          [1012, 605],
          [1016, 609],
          [1011, 612],
          [1014, 619],
          [1017, 626],
          [1012, 627],
          [1014, 635],
          [1011, 642],
          [1013, 649],
          [1010, 655],
          [246, 876],
          [249, 884],
          [255, 896],
          [204, 986],
          [217, 995],
          [230, 1002],
          [256, 1021],
          [268, 1025],
          [290, 1024],
          [299, 1020],
          [321, 1011],
          [328, 1005],
          [342, 991],
          [353, 961],
          [348, 960],
          [357, 897],
          [252, 890],
          [280, 929],
          [298, 1020],
          [126, 733],
          [151, 756],
          [179, 780],
          [220, 810],
          [230, 814],
          [79, 796],
          [112, 814],
          [118, 823],
          [113, 827],
          [267, 841],
          [116, 822],
          [152, 839],
          [157, 847],
          [176, 877],
          [181, 884],
          [195, 893],
          [167, 864],
          [265, 827],
          [306, 911],
          ...duffelMeshSeeds,
        ],
      },
      {
        key: "color4",
        label: "Şerit panel",
        defaultColor: "Lacivert",
        seeds: [
          [570, 557],
          [848, 473],
          [331, 1023],
          [727, 514],
          [325, 659],
        ],
      },
      {
        key: "color5",
        label: "Kapak detayı",
        defaultColor: "Siyah",
        seeds: [
          [374, 506],
          [358, 490],
        ],
      },
    ],
    fixedSections: [
      {
        label: "Sabit beyaz detaylar",
        color: "Beyaz",
        seeds: [
          [340, 924],
          [351, 937],
          [365, 923],
          [368, 936],
          [368, 984],
          [294, 1031],
          [338, 590],

          [364, 646],
        ],
      },
      {
        label: "Sabit siyah detaylar",
        color: "Siyah",
        seeds: [
          [632, 902],
          [607, 914],
          [426, 993],
          [700, 874],
          [233, 592],
          [188, 640],
          [957, 407],
          [920, 344],
          [821, 335],
          [854, 339],
          [826, 351],
          [831, 360],
          [810, 360],
          [842, 339],
          [902, 349],
          [870, 347],
          [877, 347],
          [922, 369],
          [884, 336],
          [931, 373],
          [273, 489],
          [569, 394],
          [572, 394],
          [344, 913],
          [368, 940],
          [350, 936],
          [356, 940],
          [357, 935],
        ],
      },
    ],
  },
  {
    id: "canta2",
    name: "Loop Roll Pack",
    lineArt: canta2Lines,
    sections: [
      {
        key: "color1",
        label: "Ana paneller",
        defaultColor: "Haki",
        seeds: [
          [571, 296],
          [484, 1085],
          [540, 930],
        ],
      },
      {
        key: "color2",
        label: "Orta paneller",
        defaultColor: "Bej",
        seeds: [
          [709, 587],
          [699, 911],
        ],
      },
      {
        key: "color3",
        label: "Fermuar bandı",
        defaultColor: "Taba",
        seeds: [[684, 674]],
      },
      {
        key: "color4",
        label: "Yan paneller",
        defaultColor: "Lacivert",
        seeds: [
          [160, 430],
          [915, 430],
          [176, 411],
          [895, 409],
        ],
      },
      {
        key: "color5",
        label: "Alt detaylar",
        defaultColor: "Bordo",
        seeds: [
          [873, 982],
          [207, 983],
          [464, 1180],
          [668, 1173],
        ],
      },
      {
        key: "color6",
        label: "Ön detay",
        defaultColor: "Saks Mavisi",
        seeds: [
          [610, 730],
          [637, 764],
        ],
      },
    ],
    fixedSections: [
      {
        label: "Sabit siyah detaylar",
        color: "Siyah",
        seeds: [
          [147, 716],
          [165, 741],
          [163, 762],
          [127, 860],
          [94, 859],
          [163, 874],
          [130, 875],
          [819, 739],
          [819, 748],
          [832, 772],
          [840, 893],
          [991, 854],
          [951, 859],
          [928, 844],
          [953, 837],
          [951, 748],
          [931, 734],
          [914, 709],
          [997, 863],
          [903, 885],
          [127, 753],
          [493, 556],
          [575, 504],
          [498, 500],
          [537, 500],
          [998, 860],
          [974, 853],
          [991, 854],
        ],
      },
    ],
  },
  {
    id: "canta1",
    name: "Loop Waist Pack",
    lineArt: canta1Lines,
    sections: [
      {
        key: "color1",
        label: "Ön panel",
        defaultColor: "Haki",
        seeds: [
          [735, 775],
          [650, 600],
          [760, 665],
        ],
      },
      {
        key: "color2",
        label: "Yan ve arka panel",
        defaultColor: "Bej",
        seeds: [
          [234, 709],
          [967, 443],
        ],
      },
      {
        key: "color3",
        label: "Üst panel",
        defaultColor: "Taba",
        seeds: [
          [472, 573],
          [376, 560],
        ],
      },
      {
        key: "color4",
        label: "Alt detay",
        defaultColor: "Saks Mavisi",
        seeds: [[414, 808]],
      },
      {
        key: "color5",
        label: "Fermuar detayı",
        defaultColor: "Sarı",
        seeds: [
          [672, 712],
          [862, 633],
          [499, 523],
          [404, 566],
          [519, 724],
        ],
      },
      {
        key: "color6",
        label: "Ara detay",
        defaultColor: "Mavi",
        seeds: [[484, 818]],
      },
    ],
    fixedSections: [
      {
        label: "Sabit siyah detaylar",
        color: "Siyah",
        seeds: [
          [399, 449],
          [442, 398],
          [544, 701],
          [388, 596],
          [403, 415],
          [384, 414],
          [410, 486],
          [447, 476],
          [396, 602],
          [386, 587],
          [380, 585],
          [543, 715],
          [561, 728],
          [563, 880],
          [326, 769],
          [558, 745],
          [569, 772],
          [356, 634],
          [367, 624],
        ],
      },
    ],
  },
];

export function colorByName(colorName) {
  return (
    paintColors.find((color) => color.name === colorName) ?? paintColors[0]
  );
}

function shuffledUniqueColors() {
  const uniqueColors = [
    ...new Map(paintColors.map((color) => [color.name, color])).values(),
  ];

  for (let index = uniqueColors.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [uniqueColors[index], uniqueColors[swapIndex]] = [
      uniqueColors[swapIndex],
      uniqueColors[index],
    ];
  }

  return uniqueColors;
}

export function buildDefaultConfig(model) {
  const sectionKeys = model.sections.map((section) => section.key);
  const shuffledColors = shuffledUniqueColors();

  if (sectionKeys.length > shuffledColors.length) {
    throw new Error(
      "Cannot randomize unique colors: section count exceeds palette size.",
    );
  }

  return Object.fromEntries(
    sectionKeys.map((sectionKey, index) => [sectionKey, shuffledColors[index]]),
  );
}

export function buildDefaultConfigsByModel() {
  return Object.fromEntries(
    bagModels.map((model) => [model.id, buildDefaultConfig(model)]),
  );
}
