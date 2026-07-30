(function (global) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const data = global.MB_WORLD_ROUTE_V323;
  const state = {
    countryIndex: 0,
    routeIndex: 0
  };

  function bySelector(selector) {
    return document.querySelector(selector);
  }

  const elements = {
    app: bySelector('[data-world-route-app]'),
    error: bySelector('[data-route-error]'),
    countryOpen: bySelector('[data-country-open]'),
    countryName: bySelector('[data-country-name]'),
    countryRegion: bySelector('[data-country-region]'),
    countryDialog: bySelector('[data-country-dialog]'),
    countryClose: bySelector('[data-country-close]'),
    countrySearch: bySelector('[data-country-search]'),
    countryList: bySelector('[data-country-list]'),
    variantBlock: bySelector('[data-route-variant-block]'),
    variantList: bySelector('[data-route-variants]'),
    map: bySelector('[data-route-map]'),
    mapSvg: bySelector('[data-route-map-svg]'),
    flow: bySelector('[data-route-flow]'),
    ports: bySelector('[data-route-ports]'),
    note: bySelector('[data-route-note]'),
    sourcesSection: bySelector('[data-route-sources-section]'),
    sources: bySelector('[data-route-sources]'),
    previous: bySelector('[data-route-prev]'),
    next: bySelector('[data-route-next]'),
    position: bySelector('[data-route-position]')
  };

  function validateData(source) {
    if (!source || !Array.isArray(source.countries) || source.countries.length !== 20) {
      throw new Error('国別ルートデータを読み込めませんでした。');
    }

    const codes = new Set();
    source.countries.forEach((country) => {
      if (!country || !country.code || !country.name || codes.has(country.code)) {
        throw new Error('国別ルートデータに重複があります。');
      }
      codes.add(country.code);
      if (!Array.isArray(country.variants) || country.variants.length === 0) {
        throw new Error('表示できるルートがありません。');
      }
      const routeKeys = new Set();
      country.variants.forEach((route) => {
        if (!route.key || routeKeys.has(route.key)) {
          throw new Error('ルートの選択肢に重複があります。');
        }
        routeKeys.add(route.key);
        if (!Array.isArray(route.steps) || route.steps.length < 2 || route.steps.length > 5) {
          throw new Error('ルートの表示範囲が正しくありません。');
        }
        if (route.steps[0].label !== '日本') {
          throw new Error('ルートの出発地が正しくありません。');
        }
        route.steps.forEach((step) => {
          if (
            !step.label ||
            !Number.isFinite(step.lat) ||
            !Number.isFinite(step.lon) ||
            step.lat < -90 ||
            step.lat > 90 ||
            step.lon < -180 ||
            step.lon > 180
          ) {
            throw new Error('地図に表示できない地点があります。');
          }
        });
      });
    });
  }

  function showError(error) {
    console.error('World Route:', error);
    if (elements.app) elements.app.hidden = true;
    if (elements.error) {
      elements.error.hidden = false;
      elements.error.textContent = 'ルートを表示できませんでした。更新して、もう一度お試しください。';
    }
  }

  function currentCountry() {
    return data.countries[state.countryIndex];
  }

  function currentRoute() {
    return currentCountry().variants[state.routeIndex];
  }

  function initialState() {
    const params = new URLSearchParams(global.location.search);
    const countryCode = String(params.get('country') || data.defaultCountry || '').toUpperCase();
    const foundCountry = data.countries.findIndex((country) => country.code === countryCode);
    state.countryIndex = foundCountry >= 0 ? foundCountry : 0;

    const requestedRoute = params.get('route');
    const foundRoute = currentCountry().variants.findIndex((route) => route.key === requestedRoute);
    state.routeIndex = foundRoute >= 0 ? foundRoute : 0;
  }

  function updateAddress() {
    if (!global.history || typeof global.history.replaceState !== 'function') return;
    const url = new URL(global.location.href);
    url.searchParams.set('country', currentCountry().code);
    if (currentCountry().variants.length > 1) {
      url.searchParams.set('route', currentRoute().key);
    } else {
      url.searchParams.delete('route');
    }
    global.history.replaceState(null, '', url);
  }

  function makeButton(className, text) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    return button;
  }

  function renderCountryPicker() {
    elements.countryList.replaceChildren();
    const regions = new Map();

    data.countries.forEach((country, index) => {
      if (!regions.has(country.region)) regions.set(country.region, []);
      regions.get(country.region).push({ country, index });
    });

    regions.forEach((entries, region) => {
      const group = document.createElement('section');
      group.className = 'route-country-group';
      group.dataset.countryGroup = region;

      const title = document.createElement('h3');
      title.className = 'route-country-group-title';
      title.textContent = region;

      const grid = document.createElement('div');
      grid.className = 'route-country-grid';

      entries.forEach(({ country, index }) => {
        const button = makeButton('route-country-option', country.name);
        button.dataset.countryCode = country.code;
        button.dataset.countryIndex = String(index);
        button.dataset.searchText = `${country.name} ${country.region} ${country.code}`.toLowerCase();
        button.addEventListener('click', () => selectCountry(index, true));
        grid.append(button);
      });

      group.append(title, grid);
      elements.countryList.append(group);
    });
  }

  function filterCountries() {
    const query = elements.countrySearch.value.trim().toLowerCase();
    elements.countryList.querySelectorAll('[data-country-code]').forEach((button) => {
      button.hidden = query !== '' && !button.dataset.searchText.includes(query);
    });
    elements.countryList.querySelectorAll('[data-country-group]').forEach((group) => {
      group.hidden = !group.querySelector('[data-country-code]:not([hidden])');
    });
  }

  function openCountryDialog() {
    if (typeof elements.countryDialog.showModal === 'function') {
      elements.countryDialog.showModal();
    } else {
      elements.countryDialog.setAttribute('open', '');
    }
    elements.countrySearch.value = '';
    filterCountries();
    global.setTimeout(() => elements.countrySearch.focus(), 0);
  }

  function closeCountryDialog() {
    if (typeof elements.countryDialog.close === 'function') {
      elements.countryDialog.close();
    } else {
      elements.countryDialog.removeAttribute('open');
    }
  }

  function selectCountry(index, closeDialog) {
    if (index < 0 || index >= data.countries.length) return;
    state.countryIndex = index;
    state.routeIndex = 0;
    render();
    if (closeDialog) {
      closeCountryDialog();
      elements.countryOpen.focus();
    }
  }

  function renderVariants() {
    const country = currentCountry();
    elements.variantList.replaceChildren();
    elements.variantBlock.hidden = country.variants.length < 2;

    country.variants.forEach((route, index) => {
      const button = makeButton('route-variant-button', route.label);
      const selected = index === state.routeIndex;
      button.dataset.routeKey = route.key;
      button.setAttribute('aria-pressed', String(selected));
      if (selected) button.classList.add('is-selected');
      button.addEventListener('click', () => {
        state.routeIndex = index;
        render();
      });
      elements.variantList.append(button);
    });
  }

  function project(step) {
    return {
      x: ((step.lon + 180) / 360) * 1000,
      y: ((90 - step.lat) / 180) * 500
    };
  }

  function routePath(points) {
    const parts = [];
    points.slice(0, -1).forEach((point, index) => {
      const next = points[index + 1];
      if (Math.abs(next.x - point.x) <= 500) {
        parts.push(`M ${point.x.toFixed(2)} ${point.y.toFixed(2)} L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`);
        return;
      }

      if (point.x > next.x) {
        const wrappedX = next.x + 1000;
        const ratio = (1000 - point.x) / (wrappedX - point.x);
        const edgeY = point.y + ((next.y - point.y) * ratio);
        parts.push(`M ${point.x.toFixed(2)} ${point.y.toFixed(2)} L 1000 ${edgeY.toFixed(2)}`);
        parts.push(`M 0 ${edgeY.toFixed(2)} L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`);
      } else {
        const wrappedX = next.x - 1000;
        const ratio = (0 - point.x) / (wrappedX - point.x);
        const edgeY = point.y + ((next.y - point.y) * ratio);
        parts.push(`M ${point.x.toFixed(2)} ${point.y.toFixed(2)} L 0 ${edgeY.toFixed(2)}`);
        parts.push(`M 1000 ${edgeY.toFixed(2)} L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`);
      }
    });
    return parts.join(' ');
  }

  function svgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes || {}).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
    return element;
  }

  function renderMap() {
    const route = currentRoute();
    const points = route.steps.map(project);
    elements.mapSvg.replaceChildren();

    const path = svgElement('path', {
      class: 'route-map-line',
      d: routePath(points)
    });
    elements.mapSvg.append(path);

    points.forEach((point, index) => {
      const group = svgElement('g', {
        class: `route-map-point${index === 0 ? ' is-start' : ''}${index === points.length - 1 ? ' is-finish' : ''}`,
        transform: `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`
      });
      const title = svgElement('title');
      title.textContent = `${index + 1}. ${route.steps[index].label}`;
      const halo = svgElement('circle', { class: 'route-map-halo', r: 19 });
      const circle = svgElement('circle', { class: 'route-map-circle', r: 13 });
      const number = svgElement('text', {
        class: 'route-map-number',
        'text-anchor': 'middle',
        y: 4.5
      });
      number.textContent = String(index + 1);
      group.append(title, halo, circle, number);
      elements.mapSvg.append(group);
    });

    const description = route.steps.map((step, index) => `${index + 1}. ${step.label}`).join('、');
    elements.map.setAttribute('aria-label', `${currentCountry().name}へのルート。${description}`);
  }

  function renderFlow() {
    const route = currentRoute();
    elements.flow.replaceChildren();

    route.steps.forEach((step, index) => {
      const stop = document.createElement('li');
      stop.className = 'route-stop';

      const number = document.createElement('span');
      number.className = 'route-stop-number';
      number.textContent = String(index + 1);

      const label = document.createElement('strong');
      label.className = 'route-stop-label';
      label.textContent = step.label;

      stop.append(number, label);
      elements.flow.append(stop);

      if (index < route.steps.length - 1) {
        const arrow = document.createElement('li');
        arrow.className = 'route-flow-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.innerHTML = '<span class="route-arrow-wide">→</span><span class="route-arrow-narrow">↓</span>';
        elements.flow.append(arrow);
      }
    });
  }

  function renderPorts() {
    elements.ports.replaceChildren();
    currentRoute().ports.forEach((port) => {
      const item = document.createElement('li');
      item.className = 'route-port';
      item.textContent = port;
      elements.ports.append(item);
    });
  }

  function renderSources() {
    const sources = currentCountry().sources || [];
    elements.sources.replaceChildren();
    elements.sourcesSection.hidden = sources.length === 0;
    sources.forEach((source) => {
      const link = document.createElement('a');
      link.className = 'route-source-link';
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.label;
      elements.sources.append(link);
    });
  }

  function renderPickerSelection() {
    elements.countryList.querySelectorAll('[data-country-code]').forEach((button) => {
      const selected = button.dataset.countryCode === currentCountry().code;
      button.setAttribute('aria-current', selected ? 'true' : 'false');
      button.classList.toggle('is-selected', selected);
    });
  }

  function renderNavigation() {
    elements.previous.disabled = state.countryIndex === 0;
    elements.next.disabled = state.countryIndex === data.countries.length - 1;
    elements.position.textContent = `${state.countryIndex + 1} / ${data.countries.length}`;
    elements.previous.setAttribute(
      'aria-label',
      state.countryIndex > 0
        ? `前の国、${data.countries[state.countryIndex - 1].name}を見る`
        : '前の国はありません'
    );
    elements.next.setAttribute(
      'aria-label',
      state.countryIndex < data.countries.length - 1
        ? `次の国、${data.countries[state.countryIndex + 1].name}を見る`
        : '次の国はありません'
    );
  }

  function render() {
    const country = currentCountry();
    const route = currentRoute();

    elements.countryName.textContent = country.name;
    elements.countryRegion.textContent = country.region;
    elements.countryOpen.setAttribute('aria-label', `現在は${country.name}。国を選び直す`);
    elements.note.textContent = route.note;

    renderPickerSelection();
    renderVariants();
    renderMap();
    renderFlow();
    renderPorts();
    renderSources();
    renderNavigation();
    updateAddress();
  }

  function bindEvents() {
    elements.countryOpen.addEventListener('click', openCountryDialog);
    elements.countryClose.addEventListener('click', closeCountryDialog);
    elements.countrySearch.addEventListener('input', filterCountries);
    elements.countryDialog.addEventListener('click', (event) => {
      if (event.target === elements.countryDialog) closeCountryDialog();
    });
    elements.previous.addEventListener('click', () => selectCountry(state.countryIndex - 1, false));
    elements.next.addEventListener('click', () => selectCountry(state.countryIndex + 1, false));
  }

  function init() {
    try {
      validateData(data);
      initialState();
      renderCountryPicker();
      bindEvents();
      render();
    } catch (error) {
      showError(error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
