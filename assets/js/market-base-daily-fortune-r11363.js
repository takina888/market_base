(() => {
  "use strict";
  const root = document.getElementById("mbDailyFortune");
  if (!root) return;

  const starsEl = document.getElementById("mbDailyFortuneStars");
  const messageEl = document.getElementById("mbDailyFortuneMessage");
  const swatchEl = document.getElementById("mbDailyFortuneSwatch");
  const colorEl = document.getElementById("mbDailyFortuneColor");
  if (!starsEl || !messageEl || !swatchEl || !colorEl) return;

  const fortunes = Object.freeze([
    { stars: 5, message: "一歩先の準備が実を結ぶ" },
    { stars: 4, message: "早めの確認が良い流れをつくる" },
    { stars: 4, message: "小さな改善が成果につながる" },
    { stars: 4, message: "順序を整えると軽やかに進む" },
    { stars: 4, message: "一言聞くと新しい発見がある" },
    { stars: 5, message: "新しい企業に良いヒントがある" },
    { stars: 5, message: "思い切った一歩が好機を呼ぶ" },
    { stars: 4, message: "数字を見直すと自信につながる" },
    { stars: 5, message: "丁寧な共有が良い結果を生む" },
    { stars: 4, message: "一つずつ進めば着実に前進" },
    { stars: 4, message: "早めの相談が次の一歩につながる" },
    { stars: 5, message: "新しい視点が突破口になる" }
  ]);

  const colors = Object.freeze([
    { name: "ネイビー", value: "#1f3a5f" },
    { name: "スカイブルー", value: "#4d9de0" },
    { name: "エメラルド", value: "#2a9d8f" },
    { name: "オレンジ", value: "#f28c28" },
    { name: "ボルドー", value: "#8b2f4b" },
    { name: "ラベンダー", value: "#8e7cc3" },
    { name: "ターコイズ", value: "#26a6a1" },
    { name: "ゴールド", value: "#c9961a" },
    { name: "コーラル", value: "#e76f51" },
    { name: "アイボリー", value: "#f2e8cf" },
    { name: "モスグリーン", value: "#5f7c3a" },
    { name: "チャコール", value: "#4a4f57" }
  ]);

  let timer = 0;
  let renderedDay = "";

  function localDayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function hashText(text) {
    let hash = 2166136261;
    for (const char of text) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function nextLocalMidnight(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  }

  function render(date = new Date()) {
    const dayKey = localDayKey(date);
    if (dayKey === renderedDay) return;
    renderedDay = dayKey;

    const fortune = fortunes[hashText(`${dayKey}|fortune`) % fortunes.length];
    const color = colors[hashText(`${dayKey}|color`) % colors.length];
    const stars = `${"★".repeat(fortune.stars)}${"☆".repeat(5 - fortune.stars)}`;

    starsEl.textContent = stars;
    messageEl.textContent = fortune.message;
    swatchEl.style.backgroundColor = color.value;
    colorEl.textContent = color.name;
    root.setAttribute("aria-label", `今日の運勢 ${fortune.stars}つ星。${fortune.message}。ラッキーカラーは${color.name}です。`);
  }

  function schedule() {
    window.clearTimeout(timer);
    const delay = Math.max(250, nextLocalMidnight().getTime() - Date.now() + 200);
    timer = window.setTimeout(() => {
      renderedDay = "";
      render();
      schedule();
    }, Math.min(delay, 2147483647));
  }

  render();
  schedule();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
})();
