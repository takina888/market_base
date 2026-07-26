(function(){
"use strict";

const prismRoot = document.getElementById("prismToolPanel");
if (!prismRoot) return;

const $ = (selector, root = prismRoot) => root.querySelector(selector);
const $$ = (selector, root = prismRoot) => [...root.querySelectorAll(selector)];

const expressionEl = $("#expression");
const resultEl = $("#result");
const comparisonCardEl = $("#comparisonCard");
const unitCategoryTabsEl = $("#unitCategoryTabs");
const unitInputGridEl = $("#unitInputGrid");
const unitCategoryTitleEl = $("#unitCategoryTitle");
const unitSourceStatusEl = $("#unitSourceStatus");
const unitFieldCountEl = $("#unitFieldCount");
const applyCalculatorValueButtonEl = $("#applyCalculatorValueButton");
const toastEl = $("#toast");

let expression = "";
let currentValue = 0;
let justEvaluated = false;
let angleMode = "DEG";
let selectedCategoryId = "length";
let selectedUnitId = "m";
let wheelTimers = new WeakMap();
const unitConversionStates = new Map();

const C = {
  LIGHT_SPEED: 299_792_458,
  AU: 149_597_870_700,
  LIGHT_YEAR: 9_460_730_472_580_800,
  PARSEC: 30_856_775_814_913_672,
};

const unitCategories = [
  {
    id: "length",
    label: "長さ",
    base: "m",
    defaultUnit: "m",
    units: [
      linear("nm", "nm", "ナノメートル", 1e-9),
      linear("um", "μm", "マイクロメートル", 1e-6),
      linear("mm", "mm", "ミリメートル", 1e-3),
      linear("cm", "cm", "センチメートル", 1e-2),
      linear("m", "m", "メートル", 1),
      linear("km", "km", "キロメートル", 1e3),
      linear("inch", "inch", "インチ", 0.0254),
      linear("ft", "ft", "フィート", 0.3048),
      linear("yd", "yd", "ヤード", 0.9144),
      linear("mile", "mile", "マイル", 1609.344),
    ],
  },
  {
    id: "space",
    label: "宇宙距離",
    base: "m",
    defaultUnit: "ly",
    units: [
      linear("km-space", "km", "キロメートル", 1e3),
      linear("light-sec", "光秒", "光が1秒で進む距離", C.LIGHT_SPEED),
      linear("light-min", "光分", "光が1分で進む距離", C.LIGHT_SPEED * 60),
      linear("light-hour", "光時", "光が1時間で進む距離", C.LIGHT_SPEED * 3600),
      linear("light-day", "光日", "光が1日で進む距離", C.LIGHT_SPEED * 86400),
      linear("au", "AU", "天文単位", C.AU),
      linear("ly", "光年", "光が1年で進む距離", C.LIGHT_YEAR),
      linear("pc", "pc", "パーセク", C.PARSEC),
      linear("kpc", "kpc", "キロパーセク", C.PARSEC * 1e3),
      linear("mpc", "Mpc", "メガパーセク", C.PARSEC * 1e6),
    ],
  },
  {
    id: "area",
    label: "面積",
    base: "m²",
    defaultUnit: "m2",
    units: [
      linear("mm2", "mm²", "平方ミリメートル", 1e-6),
      linear("cm2", "cm²", "平方センチメートル", 1e-4),
      linear("m2", "m²", "平方メートル", 1),
      linear("km2", "km²", "平方キロメートル", 1e6),
      linear("tsubo", "坪", "坪", 3.3057851239669422),
      linear("ha", "ha", "ヘクタール", 10_000),
      linear("tatami", "畳", "一般的な目安", 1.62),
      linear("tokyo-dome", "東京ドーム", "基本面積", 46_755),
    ],
  },
  {
    id: "volume",
    label: "容量・体積",
    base: "L",
    defaultUnit: "l",
    units: [
      linear("ml", "mL", "ミリリットル", 1e-3),
      linear("cc", "cc", "立方センチメートル", 1e-3),
      linear("l", "L", "リットル", 1),
      linear("kl", "kL", "キロリットル", 1e3),
      linear("m3", "m³", "立方メートル", 1e3),
      linear("in3", "in³", "立方インチ", 0.016387064),
      linear("ft3", "ft³", "立方フィート", 28.316846592),
      linear("us-gal", "US gal", "米ガロン", 3.785411784),
      linear("uk-gal", "UK gal", "英ガロン", 4.54609),
      linear("fl-oz", "US fl oz", "米液量オンス", 0.0295735295625),
    ],
  },
  {
    id: "mass",
    label: "重量",
    base: "kg",
    defaultUnit: "kg",
    units: [
      linear("mg", "mg", "ミリグラム", 1e-6),
      linear("g", "g", "グラム", 1e-3),
      linear("kg", "kg", "キログラム", 1),
      linear("t", "t", "トン", 1e3),
      linear("oz", "oz", "オンス", 0.028349523125),
      linear("lb", "lb", "ポンド", 0.45359237),
      linear("st", "st", "ストーン", 6.35029318),
    ],
  },
  {
    id: "temperature",
    label: "温度",
    base: "℃",
    defaultUnit: "celsius",
    units: [
      temperatureUnit("celsius", "℃", "摂氏", (v) => v, (v) => v),
      temperatureUnit("fahrenheit", "℉", "華氏", (v) => (v - 32) * 5 / 9, (v) => v * 9 / 5 + 32),
      temperatureUnit("kelvin", "K", "ケルビン", (v) => v - 273.15, (v) => v + 273.15),
    ],
  },
  {
    id: "time",
    label: "時間",
    base: "秒",
    defaultUnit: "min",
    units: [
      linear("ms", "ms", "ミリ秒", 1e-3),
      linear("sec", "秒", "秒", 1),
      linear("min", "分", "分", 60),
      linear("hour", "時間", "時間", 3600),
      linear("day", "日", "日", 86400),
      linear("week", "週", "週", 604800),
      linear("year", "年", "365日換算", 31_536_000),
    ],
  },
  {
    id: "speed",
    label: "速度",
    base: "m/s",
    defaultUnit: "kmh",
    units: [
      linear("mps", "m/s", "メートル毎秒", 1),
      linear("mpm", "m/min", "メートル毎分", 1 / 60),
      linear("kmh", "km/h", "キロメートル毎時", 1 / 3.6),
      linear("ftmin", "ft/min", "フィート毎分", 0.3048 / 60),
      linear("mph", "mph", "マイル毎時", 0.44704),
      linear("knot", "knot", "ノット", 0.5144444444444445),
    ],
  },
  {
    id: "acceleration",
    label: "加速度",
    base: "m/s²",
    defaultUnit: "mps2",
    units: [
      linear("mps2", "m/s²", "メートル毎秒毎秒", 1),
      linear("cmps2", "cm/s²", "センチメートル毎秒毎秒", 0.01),
      linear("ftps2", "ft/s²", "フィート毎秒毎秒", 0.3048),
      linear("gal", "Gal", "ガル", 0.01),
      linear("standard-g", "g", "標準重力加速度", 9.80665),
    ],
  },
  {
    id: "pressure",
    label: "圧力",
    base: "Pa",
    defaultUnit: "kpa",
    units: [
      linear("pa", "Pa", "パスカル", 1),
      linear("kpa", "kPa", "キロパスカル", 1e3),
      linear("mpa", "MPa", "メガパスカル", 1e6),
      linear("bar", "bar", "バール", 1e5),
      linear("mbar", "mbar", "ミリバール", 100),
      linear("psi", "psi", "ポンド毎平方インチ", 6894.757293168),
      linear("kgfcm2", "kgf/cm²", "重量キログラム毎平方センチ", 98_066.5),
      linear("atm", "atm", "標準気圧", 101_325),
      linear("mmh2o", "mmH₂O", "水柱ミリメートル", 9.80665),
      linear("mh2o", "mH₂O", "水柱メートル", 9_806.65),
      linear("inh2o", "inH₂O", "水柱インチ", 249.08891),
      linear("mmhg", "mmHg", "水銀柱ミリメートル", 133.322387415),
      linear("inhg", "inHg", "水銀柱インチ", 3_386.388640341),
      linear("torr", "Torr", "トル", 101_325 / 760),
      linear("kgfm2", "kgf/m²", "重量キログラム毎平方メートル", 9.80665),
    ],
  },
  {
    id: "energy",
    label: "エネルギー",
    base: "J",
    defaultUnit: "kcal",
    units: [
      linear("j", "J", "ジュール", 1),
      linear("kj", "kJ", "キロジュール", 1e3),
      linear("mj", "MJ", "メガジュール", 1e6),
      linear("cal", "cal", "カロリー", 4.184),
      linear("kcal", "kcal", "キロカロリー", 4184),
      linear("wh", "Wh", "ワット時", 3600),
      linear("kwh", "kWh", "キロワット時", 3.6e6),
      linear("btu", "BTU", "英国熱量単位", 1055.05585262),
    ],
  },
  {
    id: "force",
    label: "力",
    base: "N",
    defaultUnit: "newton",
    units: [
      linear("newton", "N", "ニュートン", 1),
      linear("kn", "kN", "キロニュートン", 1e3),
      linear("kgf", "kgf", "重量キログラム", 9.80665),
      linear("lbf", "lbf", "重量ポンド", 4.4482216152605),
    ],
  },
  {
    id: "torque",
    label: "トルク",
    base: "N·m",
    defaultUnit: "nm-torque",
    units: [
      linear("nm-torque", "N·m", "ニュートンメートル", 1),
      linear("kgfm", "kgf·m", "重量キログラムメートル", 9.80665),
      linear("kgfcm", "kgf·cm", "重量キログラムセンチ", 0.0980665),
      linear("lbft", "lb-ft", "ポンドフィート", 1.3558179483314),
      linear("lbin", "lb-in", "ポンドインチ", 0.1129848290276167),
    ],
  },
  {
    id: "power",
    label: "電力・動力",
    base: "W",
    defaultUnit: "kw",
    units: [
      linear("w", "W", "ワット", 1),
      linear("kw", "kW", "キロワット", 1e3),
      linear("mw", "MW", "メガワット", 1e6),
      linear("ps", "PS", "仏馬力", 735.49875),
      linear("hp", "hp", "英馬力", 745.6998715822702),
      linear("btuh", "BTU/h", "BTU毎時", 0.2930710701722222),
      linear("kjh", "kJ/h", "キロジュール毎時", 1_000 / 3_600),
      linear("kcalh", "kcal/h", "キロカロリー毎時", 4_184 / 3_600),
      linear("usrt", "USRT", "米冷凍トン", 3_516.8528420666667),
    ],
  },
  {
    id: "apparent-power",
    label: "皮相電力",
    base: "VA",
    defaultUnit: "kva",
    units: [
      linear("va", "VA", "ボルトアンペア", 1),
      linear("kva", "kVA", "キロボルトアンペア", 1e3),
      linear("mva", "MVA", "メガボルトアンペア", 1e6),
    ],
  },
  {
    id: "current",
    label: "電流",
    base: "A",
    defaultUnit: "ampere",
    units: [
      linear("ua", "μA", "マイクロアンペア", 1e-6),
      linear("ma", "mA", "ミリアンペア", 1e-3),
      linear("ampere", "A", "アンペア", 1),
      linear("ka", "kA", "キロアンペア", 1e3),
    ],
  },
  {
    id: "voltage",
    label: "電圧",
    base: "V",
    defaultUnit: "volt",
    units: [
      linear("mv", "mV", "ミリボルト", 1e-3),
      linear("volt", "V", "ボルト", 1),
      linear("kv", "kV", "キロボルト", 1e3),
    ],
  },
  {
    id: "resistance",
    label: "抵抗",
    base: "Ω",
    defaultUnit: "ohm",
    units: [
      linear("mohm", "mΩ", "ミリオーム", 1e-3),
      linear("ohm", "Ω", "オーム", 1),
      linear("kohm", "kΩ", "キロオーム", 1e3),
      linear("megohm", "MΩ", "メガオーム", 1e6),
    ],
  },
  {
    id: "flow",
    label: "流量",
    base: "L/min",
    defaultUnit: "lmin",
    units: [
      linear("mlmin", "mL/min", "ミリリットル毎分", 1e-3),
      linear("lmin", "L/min", "リットル毎分", 1),
      linear("lh", "L/h", "リットル毎時", 1 / 60),
      linear("m3min", "m³/min", "立方メートル毎分", 1000),
      linear("m3h", "m³/h", "立方メートル毎時", 1000 / 60),
      linear("gpm", "US GPM", "米ガロン毎分", 3.785411784),
      linear("cfm", "CFM", "立方フィート毎分", 28.316846592),
    ],
  },
  {
    id: "density",
    label: "密度",
    base: "kg/m³",
    defaultUnit: "kgm3",
    units: [
      linear("kgm3", "kg/m³", "キログラム毎立方メートル", 1),
      linear("gcm3", "g/cm³", "グラム毎立方センチ", 1000),
      linear("kgl", "kg/L", "キログラム毎リットル", 1000),
      linear("gl", "g/L", "グラム毎リットル", 1),
      linear("lbft3", "lb/ft³", "ポンド毎立方フィート", 16.01846337396014),
    ],
  },
  {
    id: "dynamic-viscosity",
    label: "粘度",
    base: "Pa·s",
    defaultUnit: "mpas",
    units: [
      linear("pas", "Pa·s", "パスカル秒", 1),
      linear("mpas", "mPa·s", "ミリパスカル秒", 1e-3),
      linear("poise", "P", "ポアズ", 0.1),
      linear("centipoise", "cP", "センチポアズ", 1e-3),
    ],
  },
  {
    id: "kinematic-viscosity",
    label: "動粘度",
    base: "m²/s",
    defaultUnit: "cst",
    units: [
      linear("m2s", "m²/s", "平方メートル毎秒", 1),
      linear("mm2s", "mm²/s", "平方ミリメートル毎秒", 1e-6),
      linear("stokes", "St", "ストークス", 1e-4),
      linear("cst", "cSt", "センチストークス", 1e-6),
    ],
  },
  {
    id: "concentration",
    label: "濃度・比率",
    base: "比率",
    defaultUnit: "percent",
    units: [
      linear("ratio", "比率", "1を100%とする比率", 1),
      linear("percent", "%", "パーセント", 0.01),
      linear("permille", "‰", "パーミル", 0.001),
      linear("ppm", "ppm", "100万分率", 1e-6),
      linear("ppb", "ppb", "10億分率", 1e-9),
    ],
  },
  {
    id: "frequency",
    label: "周波数・回転",
    base: "Hz",
    defaultUnit: "hz",
    units: [
      linear("hz", "Hz", "毎秒回数", 1),
      linear("khz", "kHz", "キロヘルツ", 1e3),
      linear("mhz", "MHz", "メガヘルツ", 1e6),
      linear("ghz", "GHz", "ギガヘルツ", 1e9),
      linear("rps", "rps", "毎秒回転数", 1),
      linear("rpm", "rpm", "毎分回転数", 1 / 60),
    ],
  },
  {
    id: "angle",
    label: "角度",
    base: "rad",
    defaultUnit: "degree",
    units: [
      linear("degree", "°", "度", Math.PI / 180),
      linear("radian", "rad", "ラジアン", 1),
      linear("grad", "gon", "グラード", Math.PI / 200),
      linear("turn", "回転", "1回転", Math.PI * 2),
    ],
  },
  {
    id: "illuminance",
    label: "照度",
    base: "lx",
    defaultUnit: "lux",
    units: [
      linear("lux", "lx", "ルクス", 1),
      linear("kilolux", "klx", "キロルクス", 1e3),
      linear("foot-candle", "fc", "フートキャンドル", 10.763910416709722),
    ],
  },
  {
    id: "data",
    label: "データ容量",
    base: "bit",
    defaultUnit: "mb",
    units: [
      linear("bit", "bit", "ビット", 1),
      linear("byte", "Byte", "バイト", 8),
      linear("kb", "KB", "キロバイト（10進）", 8e3),
      linear("mb", "MB", "メガバイト（10進）", 8e6),
      linear("gb", "GB", "ギガバイト（10進）", 8e9),
      linear("tb", "TB", "テラバイト（10進）", 8e12),
      linear("kib", "KiB", "キビバイト（2進）", 8 * 1024),
      linear("mib", "MiB", "メビバイト（2進）", 8 * 1024 ** 2),
      linear("gib", "GiB", "ギビバイト（2進）", 8 * 1024 ** 3),
    ],
  },
];

function linear(id, symbol, name, factorToBase) {
  return {
    id,
    symbol,
    name,
    toBase: (value) => value * factorToBase,
    fromBase: (value) => value / factorToBase,
  };
}

function temperatureUnit(id, symbol, name, toBase, fromBase) {
  return { id, symbol, name, toBase, fromBase };
}

function getCategory() {
  return unitCategories.find((category) => category.id === selectedCategoryId) || unitCategories[0];
}

function getSelectedUnit() {
  const category = getCategory();
  return category.units.find((unit) => unit.id === selectedUnitId) || category.units[0];
}

function getUnitConversionState(category = getCategory()) {
  let state = unitConversionStates.get(category.id);
  if (!state) {
    const sourceUnitId = category.units.some((unit) => unit.id === selectedUnitId)
      ? selectedUnitId
      : (category.defaultUnit || category.units[0].id);
    state = { sourceUnitId, baseValue: 0, hasValue: true };
    unitConversionStates.set(category.id, state);
  }
  return state;
}

function normalizeUnitNumberText(raw) {
  const fullWidthDigits = "０１２３４５６７８９";
  return String(raw ?? "")
    .trim()
    .replace(/[０-９]/g, (char) => String(fullWidthDigits.indexOf(char)))
    .replace(/[，,\s]/g, "")
    .replaceAll("．", ".")
    .replaceAll("−", "-")
    .replaceAll("＋", "+");
}

function parseUnitInput(raw) {
  const normalized = normalizeUnitNumberText(raw);
  if (!normalized) return { empty: true, value: NaN };
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) {
    return { empty: false, value: NaN };
  }
  return { empty: false, value: Number(normalized) };
}

function formatUnitInputValue(value) {
  if (!Number.isFinite(value)) return "";
  if (Object.is(value, -0)) value = 0;
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e15 || abs < 1e-10) return value.toExponential(8).replace(/\.?0+e/, "e");
  return Number(value.toPrecision(12)).toString();
}

function formatDisplay(value) {
  if (!Number.isFinite(value)) return "エラー";
  if (Object.is(value, -0)) value = 0;
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e15 || abs < 1e-9) return value.toExponential(8).replace(/\.0+e/, "e");
  return new Intl.NumberFormat("ja-JP", {
    maximumSignificantDigits: 12,
    useGrouping: true,
  }).format(value);
}

function formatUnitValue(value) {
  if (!Number.isFinite(value)) return "—";
  if (Object.is(value, -0)) value = 0;
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e18 || abs < 1e-8) return value.toExponential(6);
  if (abs >= 1e12) return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(value);
  if (abs >= 1e6) return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 4 }).format(value);
  if (abs >= 1e3) return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 6 }).format(value);
  if (abs >= 1) return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 8 }).format(value);
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 12 }).format(value);
}

function normalizeExpression(raw) {
  return raw
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replaceAll("＋", "+")
    .replaceAll("π", "Math.PI")
    .replace(/\be\b/g, "Math.E")
    .replaceAll("^", "**");
}

function isSafeExpression(raw) {
  const normalized = normalizeExpression(raw);
  const stripped = normalized
    .replaceAll("Math.PI", "")
    .replaceAll("Math.E", "")
    .replace(/[0-9+\-*/().\s*]/g, "");
  return stripped.length === 0;
}

function evaluateExpression(raw) {
  if (!raw.trim()) return 0;
  if (!isSafeExpression(raw)) throw new Error("Unsafe expression");
  const normalized = normalizeExpression(raw);
  // Expression is constructed only from the calculator buttons and is sanitized above.
  const value = Function(`"use strict";

const prismRoot = document.getElementById("prismToolPanel");
if (!prismRoot) return; return (${normalized});`)();
  if (!Number.isFinite(value)) throw new Error("Invalid result");
  return value;
}

function trailingNumberMatch(raw) {
  return raw.match(/(?:^|[＋−×÷(])(-?(?:\d+(?:\.\d*)?|\.\d+))$/);
}

function updateDisplay({ preview = true } = {}) {
  expressionEl.textContent = expression || "\u00a0";
  let value = currentValue;

  if (preview && expression) {
    try {
      value = evaluateExpression(expression);
      currentValue = value;
    } catch {
      const match = trailingNumberMatch(expression);
      if (match) value = Number(match[1]);
    }
  }

  resultEl.textContent = formatDisplay(value);
  updateCalculatorTransferButton();
}

function appendValue(value) {
  const isDigitOrConstant = /[0-9πe.(]/.test(value);
  if (justEvaluated && isDigitOrConstant) {
    expression = "";
    currentValue = 0;
  }
  justEvaluated = false;

  const operators = ["＋", "−", "×", "÷", "^"];
  const last = expression.at(-1);

  if (operators.includes(value)) {
    if (!expression && value === "−") {
      expression = "−";
    } else if (expression && operators.includes(last)) {
      expression = expression.slice(0, -1) + value;
    } else if (expression) {
      expression += value;
    }
  } else if (value === ".") {
    const segment = expression.split(/[＋−×÷^()]/).at(-1);
    if (!segment.includes(".")) expression += segment ? "." : "0.";
  } else {
    const requiresMultiply = expression && /[0-9πe)]/.test(last) && /[πe(]/.test(value);
    expression += requiresMultiply ? `×${value}` : value;
  }
  updateDisplay();
}

function calculateEquals() {
  try {
    const value = evaluateExpression(expression || String(currentValue));
    currentValue = value;
    expression = formatRawNumber(value);
    justEvaluated = true;
    updateDisplay({ preview: false });
  } catch {
    showCalculationError();
  }
}

function formatRawNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toPrecision(14)).toString();
}

function showCalculationError() {
  resultEl.textContent = "エラー";
  navigator.vibrate?.(30);
}

function clearCalculator() {
  expression = "";
  currentValue = 0;
  justEvaluated = false;
  updateDisplay({ preview: false });
}

function toggleSign() {
  if (!expression) {
    currentValue = -currentValue;
    expression = formatRawNumber(currentValue);
  } else {
    try {
      const value = -evaluateExpression(expression);
      currentValue = value;
      expression = formatRawNumber(value);
    } catch {
      expression = expression.startsWith("−") ? expression.slice(1) : `−(${expression})`;
    }
  }
  justEvaluated = true;
  updateDisplay({ preview: false });
}

function applyPercent() {
  try {
    const value = evaluateExpression(expression || String(currentValue)) / 100;
    currentValue = value;
    expression = formatRawNumber(value);
    justEvaluated = true;
    updateDisplay({ preview: false });
  } catch {
    showCalculationError();
  }
}

function applyScientific(operation) {
  let value;
  try {
    value = evaluateExpression(expression || String(currentValue));
  } catch {
    value = currentValue;
  }

  const angleToRadians = (v) => angleMode === "DEG" ? v * Math.PI / 180 : v;
  const radiansToAngle = (v) => angleMode === "DEG" ? v * 180 / Math.PI : v;
  let output;
  let label;

  switch (operation) {
    case "sin": output = Math.sin(angleToRadians(value)); label = `sin(${formatDisplay(value)}${angleMode === "DEG" ? "°" : ""})`; break;
    case "cos": output = Math.cos(angleToRadians(value)); label = `cos(${formatDisplay(value)}${angleMode === "DEG" ? "°" : ""})`; break;
    case "tan": output = Math.tan(angleToRadians(value)); label = `tan(${formatDisplay(value)}${angleMode === "DEG" ? "°" : ""})`; break;
    case "asin": output = radiansToAngle(Math.asin(value)); label = `sin⁻¹(${formatDisplay(value)})`; break;
    case "acos": output = radiansToAngle(Math.acos(value)); label = `cos⁻¹(${formatDisplay(value)})`; break;
    case "atan": output = radiansToAngle(Math.atan(value)); label = `tan⁻¹(${formatDisplay(value)})`; break;
    case "log": output = Math.log10(value); label = `log(${formatDisplay(value)})`; break;
    case "ln": output = Math.log(value); label = `ln(${formatDisplay(value)})`; break;
    case "sqrt": output = Math.sqrt(value); label = `√(${formatDisplay(value)})`; break;
    case "square": output = value ** 2; label = `(${formatDisplay(value)})²`; break;
    case "reciprocal": output = 1 / value; label = `1/(${formatDisplay(value)})`; break;
    case "abs": output = Math.abs(value); label = `|${formatDisplay(value)}|`; break;
    case "factorial": output = factorial(value); label = `${formatDisplay(value)}!`; break;
    default: return;
  }

  if (!Number.isFinite(output)) {
    showCalculationError();
    return;
  }
  expressionEl.textContent = label;
  currentValue = output;
  expression = formatRawNumber(output);
  justEvaluated = true;
  resultEl.textContent = formatDisplay(output);
  updateCalculatorTransferButton();
}

function factorial(value) {
  if (!Number.isInteger(value) || value < 0 || value > 170) return NaN;
  let result = 1;
  for (let i = 2; i <= value; i += 1) result *= i;
  return result;
}

function handleKeyButton(button) {
  const value = button.dataset.value;
  const action = button.dataset.action;
  const scientific = button.dataset.sci;

  if (value !== undefined) appendValue(value);
  else if (scientific) applyScientific(scientific);
  else if (action === "clear") clearCalculator();
  else if (action === "backspace") {
    if (justEvaluated) clearCalculator();
    else {
      expression = expression.slice(0, -1);
      currentValue = expression ? currentValue : 0;
      updateDisplay();
    }
  }
  else if (action === "equals") calculateEquals();
  else if (action === "sign") toggleSign();
  else if (action === "percent") applyPercent();
  else if (action === "angle-mode") {
    angleMode = angleMode === "DEG" ? "RAD" : "DEG";
    $("#angleModeButton").textContent = angleMode;
  }

  if (button.matches(".prism-key")) navigator.vibrate?.(8);
}

function renderWheel(element, items, selectedId, onSelect) {
  element.innerHTML = "";
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wheel-item";
    button.dataset.id = item.id;
    button.textContent = item.label ?? item.symbol;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", item.id === selectedId ? "true" : "false");
    if (item.id === selectedId) button.classList.add("is-selected");
    button.addEventListener("click", () => {
      scrollWheelItemToCenter(element, button, true);
      selectWheelItem(element, button, onSelect);
    });
    element.appendChild(button);
  }

  requestAnimationFrame(() => scrollSelectedIntoCenter(element, false));

  element.onscroll = () => {
    clearTimeout(wheelTimers.get(element));
    wheelTimers.set(element, setTimeout(() => {
      const closest = findClosestWheelItem(element);
      if (closest) selectWheelItem(element, closest, onSelect);
    }, 90));
  };
}

function findClosestWheelItem(element) {
  const center = element.scrollTop + element.clientHeight / 2;
  let closest = null;
  let distance = Infinity;
  $$(".wheel-item", element).forEach((item) => {
    const itemCenter = item.offsetTop + item.offsetHeight / 2;
    const delta = Math.abs(itemCenter - center);
    if (delta < distance) {
      distance = delta;
      closest = item;
    }
  });
  return closest;
}

function selectWheelItem(element, item, onSelect) {
  const previous = $(".wheel-item.is-selected", element);
  if (previous === item) return;
  $$(".wheel-item", element).forEach((el) => {
    el.classList.toggle("is-selected", el === item);
    el.setAttribute("aria-selected", el === item ? "true" : "false");
  });
  onSelect(item.dataset.id);
  navigator.vibrate?.(7);
}

function scrollWheelItemToCenter(element, item, smooth = true) {
  if (!item) return;
  const target = item.offsetTop - (element.clientHeight - item.offsetHeight) / 2;
  element.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
}

function scrollSelectedIntoCenter(element, smooth = true) {
  const selected = $(".wheel-item.is-selected", element);
  scrollWheelItemToCenter(element, selected, smooth);
}

function renderUnitCategoryTabs() {
  unitCategoryTabsEl.innerHTML = "";
  unitCategories.forEach((category) => {
    const button = document.createElement("button");
    const active = category.id === selectedCategoryId;
    button.type = "button";
    button.className = "prism-unit-category-tab";
    button.dataset.categoryId = category.id;
    button.textContent = category.label;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
    if (active) button.classList.add("is-active");
    button.addEventListener("click", () => switchUnitCategory(category.id, { centerTab: true }));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = unitCategories.findIndex((item) => item.id === category.id);
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? unitCategories.length - 1
          : event.key === "ArrowLeft"
            ? (currentIndex - 1 + unitCategories.length) % unitCategories.length
            : (currentIndex + 1) % unitCategories.length;
      switchUnitCategory(unitCategories[nextIndex].id, { focusTab: true, centerTab: true });
    });
    unitCategoryTabsEl.appendChild(button);
  });
}

function switchUnitCategory(categoryId, { focusTab = false, centerTab = false } = {}) {
  const category = unitCategories.find((item) => item.id === categoryId);
  if (!category) return;
  selectedCategoryId = category.id;
  const state = getUnitConversionState(category);
  selectedUnitId = category.units.some((unit) => unit.id === state.sourceUnitId)
    ? state.sourceUnitId
    : (category.defaultUnit || category.units[0].id);
  state.sourceUnitId = selectedUnitId;
  renderUnitCategoryTabs();
  renderUnitInputGrid();
  updateUnitConverterHeader();
  updateComparisonForState();
  savePreferences();
  const selectedTab = $(`.prism-unit-category-tab[data-category-id="${category.id}"]`, unitCategoryTabsEl);
  if (selectedTab && centerTab) selectedTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  if (selectedTab && focusTab) selectedTab.focus({ preventScroll: true });
  navigator.vibrate?.(7);
}

function updateUnitConverterHeader() {
  const category = getCategory();
  const sourceUnit = getSelectedUnit();
  unitCategoryTitleEl.textContent = category.label;
  unitFieldCountEl.textContent = `${category.units.length}単位`;
  unitSourceStatusEl.textContent = `${sourceUnit.name}から換算中`;
  unitInputGridEl.setAttribute("aria-label", `${category.label}の単位入力`);
  updateCalculatorTransferButton();
}

function renderUnitInputGrid({ focusUnitId = null } = {}) {
  const category = getCategory();
  const state = getUnitConversionState(category);
  if (!category.units.some((unit) => unit.id === state.sourceUnitId)) {
    state.sourceUnitId = category.defaultUnit || category.units[0].id;
  }
  selectedUnitId = state.sourceUnitId;
  unitInputGridEl.innerHTML = "";

  category.units.forEach((unit) => {
    const field = document.createElement("label");
    field.className = "prism-unit-field";
    field.dataset.unitId = unit.id;
    if (unit.id === state.sourceUnitId) field.classList.add("is-source");

    const copy = document.createElement("span");
    copy.className = "prism-unit-field__copy";
    const symbol = document.createElement("strong");
    symbol.textContent = unit.symbol;
    const name = document.createElement("small");
    name.textContent = unit.name;
    copy.append(symbol, name);

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.className = "prism-unit-input";
    input.dataset.unitInput = unit.id;
    input.setAttribute("aria-label", `${unit.name}（${unit.symbol}）`);
    input.placeholder = "0";
    input.value = state.hasValue ? formatUnitInputValue(unit.fromBase(state.baseValue)) : "";
    input.addEventListener("focus", () => {
      setUnitSource(unit.id, { keepValue: true });
      requestAnimationFrame(() => input.select());
    });
    input.addEventListener("input", () => handleDirectUnitInput(unit, input));
    input.addEventListener("blur", () => finalizeUnitInput(unit, input));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });

    field.append(copy, input);
    unitInputGridEl.appendChild(field);
  });

  updateUnitFieldSourceStyles();
  if (focusUnitId) {
    requestAnimationFrame(() => {
      const input = $(`[data-unit-input="${focusUnitId}"]`, unitInputGridEl);
      input?.focus({ preventScroll: true });
      input?.select();
    });
  }
}

function setUnitSource(unitId, { keepValue = true } = {}) {
  const category = getCategory();
  const unit = category.units.find((item) => item.id === unitId);
  if (!unit) return;
  const state = getUnitConversionState(category);
  state.sourceUnitId = unit.id;
  selectedUnitId = unit.id;
  updateUnitFieldSourceStyles();
  updateUnitConverterHeader();
  if (!keepValue && state.hasValue) {
    const sourceInput = $(`[data-unit-input="${unit.id}"]`, unitInputGridEl);
    if (sourceInput) sourceInput.value = formatUnitInputValue(unit.fromBase(state.baseValue));
  }
  savePreferences();
}

function updateUnitFieldSourceStyles() {
  const state = getUnitConversionState();
  $$(".prism-unit-field", unitInputGridEl).forEach((field) => {
    field.classList.toggle("is-source", field.dataset.unitId === state.sourceUnitId);
  });
}

function handleDirectUnitInput(unit, input) {
  const category = getCategory();
  const state = getUnitConversionState(category);
  state.sourceUnitId = unit.id;
  selectedUnitId = unit.id;
  const parsed = parseUnitInput(input.value);
  input.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");

  if (parsed.empty) {
    state.hasValue = false;
    $$(".prism-unit-input", unitInputGridEl).forEach((other) => {
      if (other !== input) other.value = "";
    });
    updateUnitFieldSourceStyles();
    updateUnitConverterHeader();
    updateComparisonForState();
    savePreferences();
    return;
  }

  if (!Number.isFinite(parsed.value)) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    return;
  }

  state.baseValue = unit.toBase(parsed.value);
  state.hasValue = Number.isFinite(state.baseValue);
  updateOtherUnitInputs(input);
  updateUnitFieldSourceStyles();
  updateUnitConverterHeader();
  updateComparisonForState();
  savePreferences();
}

function updateOtherUnitInputs(sourceInput = null) {
  const category = getCategory();
  const state = getUnitConversionState(category);
  category.units.forEach((unit) => {
    const input = $(`[data-unit-input="${unit.id}"]`, unitInputGridEl);
    if (!input || input === sourceInput) return;
    input.value = state.hasValue ? formatUnitInputValue(unit.fromBase(state.baseValue)) : "";
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  });
}

function finalizeUnitInput(unit, input) {
  const parsed = parseUnitInput(input.value);
  if (parsed.empty) return;
  if (!Number.isFinite(parsed.value)) {
    const state = getUnitConversionState();
    input.value = state.hasValue ? formatUnitInputValue(unit.fromBase(state.baseValue)) : "";
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    return;
  }
  input.value = formatUnitInputValue(parsed.value);
}

function applyCalculatorValueToUnits() {
  const category = getCategory();
  const sourceUnit = getSelectedUnit();
  const state = getUnitConversionState(category);
  state.sourceUnitId = sourceUnit.id;
  state.baseValue = sourceUnit.toBase(Number.isFinite(currentValue) ? currentValue : 0);
  state.hasValue = Number.isFinite(state.baseValue);
  renderUnitInputGrid({ focusUnitId: sourceUnit.id });
  updateUnitConverterHeader();
  updateComparisonForState();
  savePreferences();
  showToast(`${formatDisplay(currentValue)} ${sourceUnit.symbol} を反映`);
}

function updateCalculatorTransferButton() {
  if (!applyCalculatorValueButtonEl) return;
  const sourceUnit = getSelectedUnit();
  applyCalculatorValueButtonEl.title = `電卓の答え ${formatDisplay(currentValue)} を ${sourceUnit.symbol} として反映`;
  applyCalculatorValueButtonEl.setAttribute("aria-label", applyCalculatorValueButtonEl.title);
}

function updateComparisonForState() {
  const category = getCategory();
  const state = getUnitConversionState(category);
  if (!state.hasValue || !Number.isFinite(state.baseValue)) {
    comparisonCardEl.classList.add("is-hidden");
    comparisonCardEl.innerHTML = "";
    return;
  }
  updateComparison(category, state.baseValue);
}

function updateComparison(category, baseValue) {
  const comparisons = [];
  let note = "";

  if (category.id === "area") {
    comparisons.push(["畳", `${formatUnitValue(baseValue / 1.62)} 畳`]);
    comparisons.push(["東京ドーム", `${formatUnitValue(baseValue / 46_755)} 個分`]);
    note = "畳は1畳＝1.62m²、東京ドームは基本面積46,755m²で換算。";
  } else if (category.id === "energy") {
    const kcal = baseValue / 4184;
    comparisons.push(["餃子", `約 ${formatUnitValue(kcal / 50)} 個分`]);
    comparisons.push(["ご飯1膳", `約 ${formatUnitValue(kcal / 234)} 膳分`]);
    comparisons.push(["卵", `約 ${formatUnitValue(kcal / 71)} 個分`]);
    note = "食品は一般的な目安。餃子50kcal、ご飯1膳234kcal、卵1個71kcalとして計算。";
  }

  if (!comparisons.length || !Number.isFinite(baseValue)) {
    comparisonCardEl.classList.add("is-hidden");
    comparisonCardEl.innerHTML = "";
    return;
  }

  comparisonCardEl.classList.remove("is-hidden");
  comparisonCardEl.innerHTML = `
    <h3>感覚で見る</h3>
    <ul>${comparisons.map(([name, value]) => `<li><span>${escapeHtml(name)}</span><strong>${escapeHtml(value)}</strong></li>`).join("")}</ul>
    <p class="comparison-note">${escapeHtml(note)}</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    prismRoot.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  showToast(`${text} をコピー`);
}

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 1500);
}

function setCalculatorMode(mode) {
  const isScientific = mode === "scientific";
  const standardButton = $("#standardModeButton");
  const scientificButton = $("#scientificModeButton");
  $("#standardKeypad").classList.toggle("is-hidden", isScientific);
  $("#scientificKeypad").classList.toggle("is-hidden", !isScientific);
  standardButton.classList.toggle("mb-ui-button--primary", !isScientific);
  scientificButton.classList.toggle("mb-ui-button--primary", isScientific);
  standardButton.setAttribute("aria-pressed", String(!isScientific));
  scientificButton.setAttribute("aria-pressed", String(isScientific));
}

function initializeTipCalculator() {
  const dialog = $("#tipDialog");
  const billInput = $("#billAmount");
  const currencySelect = $("#currencySymbol");
  const customRateInput = $("#customRate");
  const peopleCountEl = $("#peopleCount");
  const roundTotalInput = $("#roundTotal");
  const tipRateWheelEl = $("#tipRateWheel");
  const tipWheelValueEl = $("#tipWheelValue");
  const tipRateItems = Array.from({ length: 61 }, (_, index) => {
    const rate = index / 2;
    return { id: String(rate), label: `${formatRate(rate)}%` };
  });
  let people = 1;
  let selectedRate = 15;

  function updatePresetButtons() {
    $$('[data-rate]', $("#tipRateGrid")).forEach((button) => {
      const active = Number(button.dataset.rate) === selectedRate;
      button.classList.toggle("mb-ui-button--primary", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function syncTipWheel(rate, smooth = true) {
    const rateId = Number.isFinite(rate) && rate >= 0 && rate <= 30 && Math.abs(rate * 2 - Math.round(rate * 2)) < 1e-9
      ? String(rate)
      : null;
    let selectedItem = null;
    $$(".wheel-item", tipRateWheelEl).forEach((item) => {
      const isSelected = item.dataset.id === rateId;
      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) selectedItem = item;
    });
    if (selectedItem) scrollWheelItemToCenter(tipRateWheelEl, selectedItem, smooth);
  }

  function setTipRate(value, { syncInput = true, syncWheel = true, smoothWheel = true } = {}) {
    const parsed = Number(value);
    selectedRate = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
    if (syncInput) customRateInput.value = String(Number(selectedRate.toFixed(1)));
    tipWheelValueEl.textContent = `${formatRate(selectedRate)}%`;
    updatePresetButtons();
    if (syncWheel) syncTipWheel(selectedRate, smoothWheel);
    updateTip();
  }

  function updateTip() {
    const bill = Math.max(0, Number(billInput.value) || 0);
    let tip = bill * selectedRate / 100;
    let total = bill + tip;
    if (roundTotalInput.checked) {
      total = Math.ceil(total);
      tip = Math.max(0, total - bill);
    }
    const perPerson = people > 0 ? total / people : total;
    const currency = currencySelect.value;
    $("#tipAmount").textContent = `${currency}${formatMoney(tip)}`;
    $("#totalAmount").textContent = `${currency}${formatMoney(total)}`;
    $("#perPersonAmount").textContent = `${currency}${formatMoney(perPerson)}`;
  }

  renderWheel(tipRateWheelEl, tipRateItems, String(selectedRate), (id) => {
    selectedRate = Number(id);
    customRateInput.value = String(Number(selectedRate.toFixed(1)));
    tipWheelValueEl.textContent = `${formatRate(selectedRate)}%`;
    updatePresetButtons();
    updateTip();
  });

  $("#tipButton").addEventListener("click", () => {
    billInput.value = currentValue > 0 ? String(Number(currentValue.toFixed(2))) : "0";
    updateTip();
    dialog.showModal();
    requestAnimationFrame(() => syncTipWheel(selectedRate, false));
  });

  $$('[data-rate]', $("#tipRateGrid")).forEach((button) => {
    button.addEventListener("click", () => setTipRate(Number(button.dataset.rate)));
  });

  customRateInput.addEventListener("input", () => {
    const rawValue = Number(customRateInput.value);
    const value = Number.isFinite(rawValue) ? Math.min(100, Math.max(0, rawValue)) : 0;
    if (rawValue !== value) customRateInput.value = String(value);
    setTipRate(value, { syncInput: false });
  });

  billInput.addEventListener("input", updateTip);
  currencySelect.addEventListener("change", updateTip);
  roundTotalInput.addEventListener("change", updateTip);
  $("#peopleMinus").addEventListener("click", () => {
    people = Math.max(1, people - 1);
    peopleCountEl.textContent = String(people);
    updateTip();
  });
  $("#peoplePlus").addEventListener("click", () => {
    people = Math.min(99, people + 1);
    peopleCountEl.textContent = String(people);
    updateTip();
  });
  setTipRate(selectedRate, { smoothWheel: false });
}

function formatRate(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function formatMoney(value) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(value);
}

function savePreferences() {
  try {
    localStorage.setItem("prism-calculator-preferences", JSON.stringify({ selectedCategoryId, selectedUnitId }));
  } catch { /* ignore */ }
}

function restorePreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem("prism-calculator-preferences") || "null");
    if (!saved) return;
    const category = unitCategories.find((item) => item.id === saved.selectedCategoryId);
    if (!category) return;
    selectedCategoryId = category.id;
    selectedUnitId = category.units.some((unit) => unit.id === saved.selectedUnitId)
      ? saved.selectedUnitId
      : category.defaultUnit;
  } catch { /* ignore */ }
}

function initializeKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (prismRoot.hidden) return;
    const target = event.target;
    const isEditing = target instanceof HTMLElement && Boolean(target.closest('input, select, textarea, [contenteditable="true"]'));
    const tipDialog = $("#tipDialog");
    if (isEditing || tipDialog?.open) return;
    const keyMap = { "/": "÷", "*": "×", "-": "−", "+": "＋" };
    if (/^[0-9.]$/.test(event.key)) appendValue(event.key);
    else if (keyMap[event.key]) appendValue(keyMap[event.key]);
    else if (event.key === "Enter" || event.key === "=") calculateEquals();
    else if (event.key === "Backspace") {
      expression = expression.slice(0, -1);
      updateDisplay();
    }
    else if (event.key === "Escape") clearCalculator();
    else return;
    event.preventDefault();
  });
}

function initialize() {
  restorePreferences();
  const initialState = getUnitConversionState();
  initialState.sourceUnitId = selectedUnitId;
  renderUnitCategoryTabs();
  renderUnitInputGrid();
  updateUnitConverterHeader();
  updateComparisonForState();
  updateDisplay({ preview: false });
  initializeTipCalculator();
  initializeKeyboard();

  $$(".prism-key").forEach((button) => button.addEventListener("click", () => handleKeyButton(button)));
  $("#standardModeButton").addEventListener("click", () => setCalculatorMode("standard"));
  $("#scientificModeButton").addEventListener("click", () => setCalculatorMode("scientific"));
  applyCalculatorValueButtonEl.addEventListener("click", applyCalculatorValueToUnits);
}

let prismInitialized = false;
function ensureInitialized() {
  if (prismInitialized) return;
  prismInitialized = true;
  initialize();
}
function closePrismDialogs() {
  const dialog = $("#tipDialog");
  if (dialog?.open) dialog.close();
  document.body.classList.remove("prism-modal-open");
}
const tipDialogForBody = $("#tipDialog");
if (tipDialogForBody) {
  tipDialogForBody.addEventListener("close", () => document.body.classList.remove("prism-modal-open"));
  tipDialogForBody.addEventListener("cancel", () => document.body.classList.remove("prism-modal-open"));
  const originalShowModal = tipDialogForBody.showModal.bind(tipDialogForBody);
  tipDialogForBody.showModal = () => {
    document.body.classList.add("prism-modal-open");
    originalShowModal();
  };
}
window.MBPrismCalculator = Object.freeze({ ensureInitialized, closeDialogs: closePrismDialogs });

})();
