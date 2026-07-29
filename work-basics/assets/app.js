(() => {
  "use strict";

  const source = window.WORK_BASICS_DATA;
  if (!source || !Array.isArray(source.characters) || !source.characters.length) {
    document.body.innerHTML = "<p style='padding:2rem'>データを読み込めませんでした。assets/data.js を確認してください。</p>";
    return;
  }

  const characters = source.characters;
  const $ = (id) => document.getElementById(id);
  const elements = {
    dial: $("dial"), dialPlate: $("dialPlate"), personNumber: $("personNumber"), dialPersonName: $("dialPersonName"),
    dialArchetype: $("dialArchetype"), previousPersonName: $("previousPersonName"), nextPersonName: $("nextPersonName"),
    personCategory: $("personCategory"), personRole: $("personRole"), previousPerson: $("previousPerson"), nextPerson: $("nextPerson"),
    mobilePersonTrack: $("mobilePersonTrack"), dataVersion: $("dataVersion"), personTypeLine: $("personTypeLine"),
    themeTitle: $("themeTitle"), personNameLine: $("personNameLine"), themeTabs: $("themeTabs"), situationText: $("situationText"),
    situationCard: document.querySelector(".situation-card"), minuteMode: $("minuteMode"), cardMode: $("cardMode"),
    copyButton: $("copyButton"), voicePersonName: $("voicePersonName"), voiceSectionLabel: $("voiceSectionLabel"),
    voiceHeading: $("voiceHeading"), readingLength: $("readingLength"), voiceText: $("voiceText"),
    keyPointText: $("keyPointText"), actionText: $("actionText"), actionDone: $("actionDone"),
    perspectiveToggle: $("perspectiveToggle"), perspectiveDetails: $("perspectiveDetails"),
    worldviewText: $("worldviewText"), decisionText: $("decisionText"), valuesText: $("valuesText"),
    otherVoicesHeading: $("otherVoicesHeading"), otherVoiceButtons: $("otherVoiceButtons"),
    favoriteButton: $("favoriteButton"), searchOpen: $("searchOpen"), searchDialog: $("searchDialog"),
    searchClose: $("searchClose"), searchInput: $("searchInput"), searchResults: $("searchResults"),
    showAllFilter: $("showAllFilter"), showFavoriteFilter: $("showFavoriteFilter"),
    favoriteCount: $("favoriteCount"), toast: $("toast")
  };

  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch { /* file preview may use an opaque origin */ } }
  };

  function safeParse(value, fallback) {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function wrapIndex(value, length = characters.length) { return (value % length + length) % length; }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]
    ));
  }

  function parseHash() {
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    return {
      characterId: params.get("c"),
      view: params.get("v"),
      sceneIndex: params.get("t"),
      mode: params.get("m")
    };
  }

  const saved = safeParse(storage.get("workBasicsDialStateV007"), {});
  const hashState = parseHash();
  const initialCharacterId = hashState.characterId || saved.characterId || "CH-HR-001";
  const favorites = new Set(safeParse(storage.get("workBasicsFavorites"), []));
  const completedActions = new Set(safeParse(storage.get("workBasicsActionsV007"), []));

  const state = {
    personIndex: Math.max(0, characters.findIndex((c) => c.id === initialCharacterId)),
    view: hashState.view === "scene" || saved.view === "scene" ? "scene" : "core",
    sceneIndex: clamp(Number(hashState.sceneIndex ?? saved.sceneIndex ?? 0), 0, 4),
    mode: hashState.mode === "card" || saved.mode === "card" ? "card" : "minute",
    favoritesOnly: false,
    dialRotation: 0,
    suppressMobileScroll: false
  };

  let toastTimer = 0;
  let mobileScrollTimer = 0;
  let dragLastAngle = null;
  let dragStepAccumulator = 0;

  function currentCharacter() { return characters[state.personIndex]; }
  function currentScene() { return currentCharacter().themes[state.sceneIndex]; }
  function currentContent() {
    const character = currentCharacter();
    if (state.view === "core") {
      return {
        id: character.core.id,
        title: character.core.title,
        situation: "",
        card: character.core.card,
        minute: character.core.minute,
        keyPoint: character.core.keyPoint,
        action: character.core.action,
        label: "人物別主本文"
      };
    }
    const theme = currentScene();
    return { ...theme, label: `場面 ${String(state.sceneIndex + 1).padStart(2, "0")}` };
  }

  function persistState() {
    const character = currentCharacter();
    storage.set("workBasicsDialStateV007", JSON.stringify({
      characterId: character.id, view: state.view, sceneIndex: state.sceneIndex, mode: state.mode
    }));
    const params = new URLSearchParams({
      c: character.id, v: state.view, t: String(state.sceneIndex), m: state.mode
    });
    history.replaceState(null, "", `#${params.toString()}`);
  }

  function changePerson(delta, sourceName = "dial") {
    setPerson(wrapIndex(state.personIndex + delta), sourceName);
  }

  function setPerson(index, sourceName = "direct", preserveContent = false) {
    const next = wrapIndex(index);
    const changed = next !== state.personIndex;
    state.personIndex = next;
    if (!preserveContent && sourceName !== "searchScene") {
      state.view = "core";
      state.sceneIndex = 0;
    }
    render({ scrollMobile: sourceName !== "mobile" });
    if (changed && sourceName !== "mobile") {
      elements.themeTabs.querySelector(".is-active")?.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }

  function setCore() {
    state.view = "core";
    render({ scrollMobile: false });
    elements.themeTabs.querySelector(".is-active")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  function setScene(index) {
    state.view = "scene";
    state.sceneIndex = clamp(index, 0, currentCharacter().themes.length - 1);
    render({ scrollMobile: false });
    elements.themeTabs.querySelector(".is-active")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  function render({ scrollMobile = true } = {}) {
    const character = currentCharacter();
    const content = currentContent();
    const previous = characters[wrapIndex(state.personIndex - 1)];
    const next = characters[wrapIndex(state.personIndex + 1)];
    const isFavorite = favorites.has(character.id);
    const actionKey = `${character.id}:${content.id}`;
    const isCore = state.view === "core";

    elements.personNumber.textContent = `${String(state.personIndex + 1).padStart(2, "0")} / ${characters.length}`;
    elements.dialPersonName.textContent = character.name;
    elements.dialArchetype.textContent = character.archetype;
    elements.previousPersonName.textContent = previous.name;
    elements.nextPersonName.textContent = next.name;
    elements.personCategory.textContent = character.category;
    elements.personRole.textContent = character.role;
    elements.dial.setAttribute("aria-valuenow", String(state.personIndex + 1));
    elements.dial.setAttribute("aria-valuemax", String(characters.length));
    elements.dial.setAttribute("aria-valuetext", character.name);

    elements.dataVersion.textContent = `${source.version.toUpperCase()} DATA · ${characters.length}人物 / 51主本文 + 255場面`;
    elements.personTypeLine.textContent = character.archetype;
    elements.themeTitle.textContent = content.title;
    elements.personNameLine.textContent = `${character.name}として考える`;
    elements.situationCard.hidden = isCore;
    elements.situationText.textContent = content.situation || "";
    elements.voicePersonName.textContent = character.name;
    elements.voiceSectionLabel.textContent = isCore ? "人物ごとの主本文" : "場面別の一人語り";
    elements.voiceHeading.innerHTML = `<span id="voicePersonName">${escapeHtml(character.name)}</span>${isCore ? "の仕事観" : "の判断"}`;
    elements.keyPointText.textContent = content.keyPoint;
    elements.actionText.textContent = content.action;
    elements.worldviewText.textContent = character.worldview;
    elements.decisionText.textContent = character.decision;
    elements.valuesText.textContent = character.values || "確認できず";
    elements.otherVoicesHeading.textContent = isCore
      ? "「仕事の基本」をほかの人物型で読む"
      : "この場面をほかの人物型で読む";

    renderContentTabs(character);
    renderVoice(content);
    renderOtherVoices();

    elements.favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    elements.favoriteButton.title = isFavorite ? "お気に入りから外す" : "お気に入りに追加";
    const completed = completedActions.has(actionKey);
    elements.actionDone.setAttribute("aria-pressed", String(completed));
    elements.actionDone.lastChild.textContent = completed ? " 今日やることに設定済み" : " 今日やることに決める";

    elements.mobilePersonTrack.querySelectorAll(".mobile-person-card").forEach((card, index) => {
      card.classList.toggle("is-active", index === state.personIndex);
      card.setAttribute("aria-current", index === state.personIndex ? "true" : "false");
    });
    if (scrollMobile) scrollMobileToPerson(state.personIndex);

    state.dialRotation = state.personIndex * 18;
    elements.dialPlate.style.transform = `rotate(${state.dialRotation}deg)`;
    persistState();
    updateFavoriteCount();
  }

  function renderContentTabs(character) {
    const buttons = [];
    const coreButton = document.createElement("button");
    coreButton.type = "button";
    coreButton.className = `theme-tab theme-tab--core${state.view === "core" ? " is-active" : ""}`;
    coreButton.setAttribute("aria-pressed", String(state.view === "core"));
    coreButton.innerHTML = "<span>MAIN</span>仕事の基本";
    coreButton.addEventListener("click", setCore);
    buttons.push(coreButton);

    character.themes.forEach((theme, index) => {
      const active = state.view === "scene" && index === state.sceneIndex;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `theme-tab${active ? " is-active" : ""}`;
      button.setAttribute("aria-pressed", String(active));
      button.innerHTML = `<span>SCENE ${String(index + 1).padStart(2, "0")}</span>${escapeHtml(theme.title)}`;
      button.addEventListener("click", () => setScene(index));
      buttons.push(button);
    });
    elements.themeTabs.replaceChildren(...buttons);
  }

  function renderVoice(content) {
    const text = state.mode === "minute" ? content.minute : content.card;
    const paragraphs = String(text || "").split(/\n\s*\n/).filter(Boolean);
    elements.voiceText.replaceChildren(...paragraphs.map((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      return p;
    }));
    elements.minuteMode.classList.toggle("is-active", state.mode === "minute");
    elements.cardMode.classList.toggle("is-active", state.mode === "card");
    elements.minuteMode.setAttribute("aria-pressed", String(state.mode === "minute"));
    elements.cardMode.setAttribute("aria-pressed", String(state.mode === "card"));
    elements.readingLength.textContent = state.mode === "minute"
      ? `1分版・${String(text).length}字`
      : `カード版・${String(text).length}字`;
  }

  function renderOtherVoices() {
    const offsets = [1, 7, 18];
    const candidates = offsets.map((offset) => wrapIndex(state.personIndex + offset));
    elements.otherVoiceButtons.replaceChildren(...candidates.map((index) => {
      const character = characters[index];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "other-voice-button";
      button.innerHTML = `<strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(character.archetype)}</span>`;
      button.addEventListener("click", () => {
        setPerson(index, "otherVoice", true);
        document.querySelector(".article-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return button;
    }));
  }

  function buildMobileTrack() {
    elements.mobilePersonTrack.replaceChildren(...characters.map((character, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mobile-person-card";
      button.dataset.index = String(index);
      button.innerHTML = `<strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(character.archetype)}</span>`;
      button.addEventListener("click", () => setPerson(index, "mobileClick"));
      return button;
    }));
  }

  function scrollMobileToPerson(index) {
    const card = elements.mobilePersonTrack.children[index];
    if (!card || matchMedia("(min-width: 901px)").matches) return;
    state.suppressMobileScroll = true;
    const left = card.offsetLeft - (elements.mobilePersonTrack.clientWidth - card.clientWidth) / 2;
    elements.mobilePersonTrack.scrollTo({ left, behavior: "smooth" });
    setTimeout(() => { state.suppressMobileScroll = false; }, 500);
  }

  function nearestMobileCardIndex() {
    const trackRect = elements.mobilePersonTrack.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let nearest = state.personIndex;
    let minDistance = Infinity;
    [...elements.mobilePersonTrack.children].forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs((rect.left + rect.width / 2) - center);
      if (distance < minDistance) { minDistance = distance; nearest = index; }
    });
    return nearest;
  }

  function getPointerAngle(event) {
    const rect = elements.dial.getBoundingClientRect();
    return Math.atan2(
      event.clientY - (rect.top + rect.height / 2),
      event.clientX - (rect.left + rect.width / 2)
    ) * 180 / Math.PI;
  }

  function normalizeAngleDelta(delta) {
    if (delta > 180) return delta - 360;
    if (delta < -180) return delta + 360;
    return delta;
  }

  function onDialPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    elements.dial.setPointerCapture(event.pointerId);
    elements.dial.classList.add("is-dragging");
    dragLastAngle = getPointerAngle(event);
    dragStepAccumulator = 0;
  }

  function onDialPointerMove(event) {
    if (dragLastAngle === null || !elements.dial.hasPointerCapture(event.pointerId)) return;
    const angle = getPointerAngle(event);
    const delta = normalizeAngleDelta(angle - dragLastAngle);
    dragLastAngle = angle;
    dragStepAccumulator += delta;
    state.dialRotation += delta;
    elements.dialPlate.style.transform = `rotate(${state.dialRotation}deg)`;
    const step = 14;
    while (dragStepAccumulator >= step) { dragStepAccumulator -= step; changePerson(1, "dial"); }
    while (dragStepAccumulator <= -step) { dragStepAccumulator += step; changePerson(-1, "dial"); }
  }

  function onDialPointerUp(event) {
    if (elements.dial.hasPointerCapture(event.pointerId)) elements.dial.releasePointerCapture(event.pointerId);
    dragLastAngle = null;
    dragStepAccumulator = 0;
    elements.dial.classList.remove("is-dragging");
  }

  function setMode(mode) {
    state.mode = mode;
    render({ scrollMobile: false });
  }

  function toggleFavorite() {
    const id = currentCharacter().id;
    if (favorites.has(id)) {
      favorites.delete(id);
      showToast("お気に入りから外しました");
    } else {
      favorites.add(id);
      showToast("お気に入りに追加しました");
    }
    storage.set("workBasicsFavorites", JSON.stringify([...favorites]));
    render({ scrollMobile: false });
  }

  function toggleAction() {
    const content = currentContent();
    const key = `${currentCharacter().id}:${content.id}`;
    if (completedActions.has(key)) completedActions.delete(key); else completedActions.add(key);
    storage.set("workBasicsActionsV007", JSON.stringify([...completedActions]));
    render({ scrollMobile: false });
    showToast(completedActions.has(key) ? "今日の行動に設定しました" : "設定を解除しました");
  }

  async function copyCurrentText() {
    const character = currentCharacter();
    const content = currentContent();
    const body = state.mode === "minute" ? content.minute : content.card;
    const blocks = [content.title, character.name, body];
    if (content.situation) blocks.splice(2, 0, content.situation);
    blocks.push(`仕事の要点：${content.keyPoint}`, `今日の行動：${content.action}`);
    const text = blocks.join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("本文をコピーしました");
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      showToast("本文をコピーしました");
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 1900);
  }

  function updateFavoriteCount() {
    elements.favoriteCount.textContent = `${favorites.size}人`;
  }

  function openSearch() {
    elements.searchDialog.showModal();
    state.favoritesOnly = false;
    elements.showAllFilter.classList.add("is-active");
    elements.showFavoriteFilter.classList.remove("is-active");
    elements.searchInput.value = "";
    renderSearchResults();
    setTimeout(() => elements.searchInput.focus(), 30);
  }

  function renderSearchResults() {
    const query = elements.searchInput.value.trim().toLocaleLowerCase("ja");
    const results = [];
    characters.forEach((character, personIndex) => {
      if (state.favoritesOnly && !favorites.has(character.id)) return;

      const coreHaystack = [
        character.name, character.archetype, character.category, character.role, character.values,
        character.core.title, character.core.card, character.core.minute, character.core.tags.join(" ")
      ].join(" ").toLocaleLowerCase("ja");
      const personMatch = !query || coreHaystack.includes(query);
      if (personMatch) {
        results.push({
          personIndex, view: "core", sceneIndex: 0, label: character.name,
          sub: `${character.archetype}｜仕事の基本`, type: "人物"
        });
      }

      if (query) {
        character.themes.forEach((theme, sceneIndex) => {
          const haystack = [theme.title, theme.situation, theme.principle, theme.tags.join(" "), theme.keyPoint, theme.card, theme.minute]
            .join(" ").toLocaleLowerCase("ja");
          if (haystack.includes(query)) {
            results.push({
              personIndex, view: "scene", sceneIndex, label: theme.title,
              sub: `${character.name}｜${theme.tags.slice(0, 3).join("・")}`, type: "場面"
            });
          }
        });
      }
    });

    const limited = results.slice(0, 100);
    elements.searchResults.replaceChildren(...(limited.length ? limited.map((result) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      button.setAttribute("role", "option");
      button.innerHTML = `<span><strong>${escapeHtml(result.label)}</strong><span>${escapeHtml(result.sub)}</span></span><em>${result.type}</em>`;
      button.addEventListener("click", () => {
        state.personIndex = result.personIndex;
        state.view = result.view;
        state.sceneIndex = result.sceneIndex;
        elements.searchDialog.close();
        render();
        document.querySelector(".article-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return button;
    }) : [Object.assign(document.createElement("div"), {
      className: "empty-result", textContent: "一致する人物・文章がありません。"
    })]));
  }

  function bindEvents() {
    elements.previousPerson.addEventListener("click", () => changePerson(-1, "button"));
    elements.nextPerson.addEventListener("click", () => changePerson(1, "button"));
    elements.dial.addEventListener("pointerdown", onDialPointerDown);
    elements.dial.addEventListener("pointermove", onDialPointerMove);
    elements.dial.addEventListener("pointerup", onDialPointerUp);
    elements.dial.addEventListener("pointercancel", onDialPointerUp);
    elements.dial.addEventListener("wheel", (event) => {
      event.preventDefault();
      changePerson(event.deltaY > 0 ? 1 : -1, "wheel");
    }, { passive: false });
    elements.dial.addEventListener("keydown", (event) => {
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) { event.preventDefault(); changePerson(1, "keyboard"); }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); changePerson(-1, "keyboard"); }
      if (event.key === "Home") { event.preventDefault(); setPerson(0, "keyboard"); }
      if (event.key === "End") { event.preventDefault(); setPerson(characters.length - 1, "keyboard"); }
    });

    elements.mobilePersonTrack.addEventListener("scroll", () => {
      if (state.suppressMobileScroll) return;
      clearTimeout(mobileScrollTimer);
      mobileScrollTimer = setTimeout(() => setPerson(nearestMobileCardIndex(), "mobile"), 90);
    }, { passive: true });

    elements.minuteMode.addEventListener("click", () => setMode("minute"));
    elements.cardMode.addEventListener("click", () => setMode("card"));
    elements.copyButton.addEventListener("click", copyCurrentText);
    elements.favoriteButton.addEventListener("click", toggleFavorite);
    elements.actionDone.addEventListener("click", toggleAction);
    elements.perspectiveToggle.addEventListener("click", () => {
      const expanded = elements.perspectiveToggle.getAttribute("aria-expanded") === "true";
      elements.perspectiveToggle.setAttribute("aria-expanded", String(!expanded));
      elements.perspectiveDetails.hidden = expanded;
    });

    elements.searchOpen.addEventListener("click", openSearch);
    elements.searchClose.addEventListener("click", () => elements.searchDialog.close());
    elements.searchDialog.addEventListener("click", (event) => {
      if (event.target === elements.searchDialog) elements.searchDialog.close();
    });
    elements.searchInput.addEventListener("input", renderSearchResults);
    elements.showAllFilter.addEventListener("click", () => {
      state.favoritesOnly = false;
      elements.showAllFilter.classList.add("is-active");
      elements.showFavoriteFilter.classList.remove("is-active");
      elements.showAllFilter.setAttribute("aria-pressed", "true");
      elements.showFavoriteFilter.setAttribute("aria-pressed", "false");
      renderSearchResults();
    });
    elements.showFavoriteFilter.addEventListener("click", () => {
      state.favoritesOnly = true;
      elements.showAllFilter.classList.remove("is-active");
      elements.showFavoriteFilter.classList.add("is-active");
      elements.showAllFilter.setAttribute("aria-pressed", "false");
      elements.showFavoriteFilter.setAttribute("aria-pressed", "true");
      renderSearchResults();
    });

    window.addEventListener("hashchange", () => {
      const parsed = parseHash();
      const index = characters.findIndex((character) => character.id === parsed.characterId);
      if (index >= 0) state.personIndex = index;
      state.view = parsed.view === "scene" ? "scene" : "core";
      if (parsed.sceneIndex != null) state.sceneIndex = clamp(Number(parsed.sceneIndex), 0, 4);
      if (["minute", "card"].includes(parsed.mode)) state.mode = parsed.mode;
      render();
    });
  }

  buildMobileTrack();
  bindEvents();
  render();

})();
