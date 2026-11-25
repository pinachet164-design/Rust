/*
 * Экономика Rust — логика и интерфейс.
 * Обычный скрипт, без ES-модулей: работает при открытии index.html с диска.
 */
(function () {
  'use strict';

  var DATA = window.RUST_DATA;
  if (!DATA) { return; }

  var STORAGE_KEY = 'rust-econ-v1';

  var BUYBACK_DEFAULTS = { resources: 0.45, components: 0.55, 'default': 0.67 };

  var DEFAULTS = {
    rubRate: Number(DATA.settings.rubRate) || 5,
    yieldMultiplier: Number(DATA.settings.yieldMultiplier) || 1,
    yieldK: isFinite(DATA.settings.yieldK) ? Number(DATA.settings.yieldK) : 0.7,
    scrapPrice: Number(DATA.settings.scrapPrice) || 25,
    markup: isFinite(DATA.settings.markup) ? Number(DATA.settings.markup) : 0.25,
    buyback: {}
  };
  Object.keys(BUYBACK_DEFAULTS).forEach(function (key) {
    var raw = DATA.settings.buyback ? DATA.settings.buyback[key] : null;
    DEFAULTS.buyback[key] = isFinite(raw) ? Number(raw) : BUYBACK_DEFAULTS[key];
  });

  function defaultSettings() {
    return {
      rubRate: DEFAULTS.rubRate,
      yieldMultiplier: DEFAULTS.yieldMultiplier,
      yieldK: DEFAULTS.yieldK,
      scrapPrice: DEFAULTS.scrapPrice,
      markup: DEFAULTS.markup,
      buyback: {
        resources: DEFAULTS.buyback.resources,
        components: DEFAULTS.buyback.components,
        'default': DEFAULTS.buyback['default']
      }
    };
  }

  // Таблица предметов: по умолчанию из js/data.js, но её можно заменить
  // импортом JSON (своим же экспортом) — тогда она живёт в localStorage.
  var BASE_ITEMS = DATA.items;
  var items = BASE_ITEMS.slice();
  var byId = {};
  items.forEach(function (item) { byId[item.id] = item; });
  var categoriesById = {};
  DATA.categories.forEach(function (c) { categoriesById[c.id] = c; });

  var KNOWN_FIELDS = ['id', 'name', 'category', 'basePrice', 'craft', 'recycle', 'verified'];

  function normalizeItems(input) {
    if (!Array.isArray(input)) { throw new Error('items'); }
    var seen = {};
    var list = [];
    input.forEach(function (raw) {
      if (!raw || typeof raw !== 'object') { return; }
      var id = String(raw.id || '').trim();
      if (!id || seen[id]) { return; }
      seen[id] = true;
      var item = {
        id: id,
        name: String(raw.name || id),
        category: categoriesById[raw.category] ? raw.category : 'misc'
      };
      if (isFinite(raw.basePrice) && Number(raw.basePrice) >= 0) {
        item.basePrice = Number(raw.basePrice);
      }
      if (raw.verified === false) { item.verified = false; }
      if (raw.craft && typeof raw.craft === 'object') {
        var craft = { output: 1, ingredients: [] };
        if (isFinite(raw.craft.output) && Number(raw.craft.output) > 0) {
          craft.output = Number(raw.craft.output);
        }
        if (Array.isArray(raw.craft.ingredients)) {
          raw.craft.ingredients.forEach(function (ing) {
            if (!ing || !ing.id) { return; }
            var amount = Number(ing.amount);
            if (!isFinite(amount) || amount <= 0) { return; }
            craft.ingredients.push({ id: String(ing.id), amount: amount });
          });
        }
        if (craft.ingredients.length) { item.craft = craft; }
      }
      if (Array.isArray(raw.recycle) && raw.recycle.length) {
        var recycle = [];
        raw.recycle.forEach(function (out) {
          if (!out || !out.id) { return; }
          var amount = Number(out.amount);
          if (!isFinite(amount) || amount <= 0) { return; }
          recycle.push({ id: String(out.id), amount: amount });
        });
        if (recycle.length) { item.recycle = recycle; }
      }
      // Поля из будущих версий (время крафта, верстак, стак) не теряем
      Object.keys(raw).forEach(function (key) {
        if (KNOWN_FIELDS.indexOf(key) === -1) { item[key] = raw[key]; }
      });
      list.push(item);
    });
    if (!list.length) { throw new Error('empty'); }
    return list;
  }

  // null — вернуть таблицу из js/data.js
  function setItems(list) {
    if (list == null) {
      items = BASE_ITEMS.slice();
      state.items = null;
    } else {
      items = normalizeItems(list);
      state.items = items;
    }
    byId = {};
    items.forEach(function (item) { byId[item.id] = item; });
    clearCache();
  }

  var state = {
    settings: defaultSettings(),
    items: null,
    overrides: {},
    category: 'weapons',
    search: '',
    craftOnly: false,
    sort: 'name',
    view: 'list',
    openedId: null
  };

  /* =====================  Утилиты  ===================== */

  function clampNumber(value, min, max, fallback) {
    var n = Number(value);
    if (!isFinite(n)) { return fallback; }
    if (n < min) { return min; }
    if (n > max) { return max; }
    return n;
  }

  function num(value) {
    var rounded = Math.round(value);
    return Math.abs(rounded) >= 1000
      ? rounded.toLocaleString('ru-RU')
      : String(rounded);
  }

  // Все расчёты идут в тугриках; рубли и скрап — только отображение.
  function rubRate() {
    var rate = Number(state.settings.rubRate);
    return rate > 0 ? rate : 1;
  }

  function scrapRate() {
    var price = Number(state.settings.scrapPrice);
    return price > 0 ? price : 1;
  }

  function fmtT(value) { return num(value) + ' ₸'; }
  function fmtR(value) { return num(value / rubRate()) + ' ₽'; }
  function fmtS(value) { return num(value / scrapRate()) + ' скрап'; }
  function fmtAlt(value) { return fmtR(value) + ' · ' + fmtS(value); }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function categoryName(id) {
    var cat = categoriesById[id];
    return cat ? cat.name : id;
  }

  function plural(count, one, few, many) {
    var mod10 = count % 10;
    var mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) { return one; }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) { return few; }
    return many;
  }

  var toastTimer = null;
  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) { return; }
    el.textContent = message;
    el.classList.add('toast--show');
    if (toastTimer) { clearTimeout(toastTimer); }
    toastTimer = setTimeout(function () {
      el.classList.remove('toast--show');
    }, 1800);
  }

  /* =====================  Сохранение  ===================== */

  function sanitizeBuyback(input) {
    var result = {
      resources: DEFAULTS.buyback.resources,
      components: DEFAULTS.buyback.components,
      'default': DEFAULTS.buyback['default']
    };
    if (input && typeof input === 'object') {
      Object.keys(result).forEach(function (key) {
        if (isFinite(input[key])) {
          result[key] = clampNumber(input[key], 0, 0.95, result[key]);
        }
      });
    }
    return result;
  }

  function sanitizeSettings(input) {
    var result = defaultSettings();
    if (!input || typeof input !== 'object') { return result; }
    if (isFinite(input.rubRate) && Number(input.rubRate) > 0) { result.rubRate = clampNumber(input.rubRate, 0.01, 100000, DEFAULTS.rubRate); }
    if (isFinite(input.yieldMultiplier) && Number(input.yieldMultiplier) > 0) { result.yieldMultiplier = clampNumber(input.yieldMultiplier, 0.1, 1000, DEFAULTS.yieldMultiplier); }
    if (isFinite(input.yieldK)) { result.yieldK = clampNumber(input.yieldK, 0, 3, DEFAULTS.yieldK); }
    if (isFinite(input.scrapPrice) && Number(input.scrapPrice) > 0) { result.scrapPrice = clampNumber(input.scrapPrice, 0.01, 1000000, DEFAULTS.scrapPrice); }
    if (isFinite(input.markup)) { result.markup = clampNumber(input.markup, -0.9, 10, DEFAULTS.markup); }
    result.buyback = sanitizeBuyback(input.buyback);
    return result;
  }

  function sanitizeOverrides(input) {
    var result = {};
    if (!input || typeof input !== 'object') { return result; }
    Object.keys(input).forEach(function (id) {
      if (!byId[id]) { return; }
      var raw = input[id];
      if (!raw || typeof raw !== 'object') { return; }
      var entry = {};
      if (isFinite(raw.buy) && Number(raw.buy) >= 0) { entry.buy = Number(raw.buy); }
      if (isFinite(raw.sell) && Number(raw.sell) >= 0) { entry.sell = Number(raw.sell); }
      if (entry.buy != null || entry.sell != null) { result[id] = entry; }
    });
    return result;
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        settings: state.settings,
        items: state.items,
        overrides: state.overrides,
        view: state.view
      }));
    } catch (e) {
      toast('Не удалось сохранить: хранилище недоступно');
    }
  }

  function loadState() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return;
    }
    if (!raw) { return; }
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.settings) {
        var loaded = sanitizeSettings(parsed.settings);
        Object.keys(loaded).forEach(function (key) { state.settings[key] = loaded[key]; });
      }
      if (parsed && Array.isArray(parsed.items)) {
        try { setItems(parsed.items); } catch (e) { setItems(null); }
      }
      state.overrides = sanitizeOverrides(parsed && parsed.overrides);
      if (parsed && parsed.view === 'table') { state.view = 'table'; }
    } catch (e) {
      // повреждённые данные не должны ломать страницу
    }
  }

  /* =====================  Экономика  ===================== */

  var fairCache = {};

  function clearCache() {
    fairCache = {};
  }

  // Цена сырья при текущем множителе добычи: basePrice / (multiplier ^ K)
  function rawPrice(item) {
    var multiplier = state.settings.yieldMultiplier;
    if (!(multiplier > 0)) { multiplier = 1; }
    var k = state.settings.yieldK;
    return item.basePrice / Math.pow(multiplier, k);
  }

  // Справедливая цена: стоимость крафта либо ручная баз цена.
  // Рекурсивно, с защитой от циклов и кэшем.
  function fairPrice(id, stack) {
    if (fairCache[id] != null) { return fairCache[id]; }
    var item = byId[id];
    if (!item) { return 0; }

    stack = stack || [];
    if (stack.indexOf(id) !== -1) {
      // цикл в рецептах — используем базовую цену или 0
      return item.basePrice || 0;
    }
    stack.push(id);

    var value;
    if (item.craft && item.craft.ingredients && item.craft.ingredients.length) {
      var sum = 0;
      item.craft.ingredients.forEach(function (ing) {
        if (!byId[ing.id]) { return; }
        sum += fairPrice(ing.id, stack) * (Number(ing.amount) || 0);
      });
      value = sum / (Number(item.craft.output) || 1);
    } else if (item.basePrice != null) {
      value = item.category === 'resources' ? rawPrice(item) : Number(item.basePrice);
    } else {
      value = 0;
    }

    stack.pop();
    fairCache[id] = value;
    return value;
  }

  // Доля себестоимости, которую администратор платит игроку при выкупе.
  function buybackRate(categoryId) {
    var map = state.settings.buyback || {};
    if (map[categoryId] != null) { return Number(map[categoryId]); }
    return map['default'] != null ? Number(map['default']) : BUYBACK_DEFAULTS['default'];
  }

  function buyPrice(id) {
    var ov = state.overrides[id];
    if (ov && ov.buy != null) { return ov.buy; }
    return fairPrice(id) * (1 + state.settings.markup);
  }

  function sellPrice(id) {
    var ov = state.overrides[id];
    if (ov && ov.sell != null) { return ov.sell; }
    var item = byId[id];
    return fairPrice(id) * buybackRate(item ? item.category : 'default');
  }

  function recycleValue(item) {
    if (!item.recycle || !item.recycle.length) { return 0; }
    var sum = 0;
    item.recycle.forEach(function (out) {
      if (!byId[out.id]) { return; }
      // Сколько администратор заплатит за полученные ресурсы.
      sum += sellPrice(out.id) * (Number(out.amount) || 0);
    });
    return sum;
  }

  /* =====================  Данные списка  ===================== */

  function itemsForCategory(categoryId) {
    var cat = categoriesById[categoryId];
    return items.filter(function (item) {
      if (cat && cat.virtual) {
        return cat.sources.indexOf(item.category) !== -1;
      }
      return item.category === categoryId;
    });
  }

  function visibleItems() {
    var query = state.search.trim().toLowerCase();
    var list = itemsForCategory(state.category).filter(function (item) {
      if (state.craftOnly && !(item.craft && item.craft.ingredients && item.craft.ingredients.length)) {
        return false;
      }
      if (query) {
        var inName = item.name.toLowerCase().indexOf(query) !== -1;
        var inId = item.id.toLowerCase().indexOf(query) !== -1;
        if (!inName && !inId) { return false; }
      }
      return true;
    });

    if (state.sort === 'price-asc') {
      list.sort(function (a, b) { return buyPrice(a.id) - buyPrice(b.id); });
    } else if (state.sort === 'price-desc') {
      list.sort(function (a, b) { return buyPrice(b.id) - buyPrice(a.id); });
    } else {
      list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    }
    return list;
  }

  /* =====================  Интерфейс  ===================== */

  function renderCategories() {
    var nav = document.getElementById('cats');
    var html = '';
    DATA.categories.forEach(function (cat) {
      var active = cat.id === state.category ? ' is-active' : '';
      html += '<button type="button" class="cat' + active + '" data-cat="' + escapeHtml(cat.id) + '">' +
        escapeHtml(cat.name) + '</button>';
    });
    nav.innerHTML = html;
  }

  function chipsHtml(item, stack) {
    if (!item.craft || !item.craft.ingredients.length) { return ''; }
    stack = stack || [];
    var html = '<div class="chips">';
    item.craft.ingredients.forEach(function (ing) {
      var sub = byId[ing.id];
      if (!sub) { return; }
      var amount = (Number(ing.amount) || 0) * (1 / (Number(item.craft.output) || 1));
      var shown = amount % 1 === 0 ? String(amount) : amount.toFixed(2).replace('.', ',');
      html += '<button type="button" class="chip" data-open="' + escapeHtml(sub.id) + '" title="Открыть карточку">' +
        escapeHtml(sub.name) + ' ×' + shown + '</button>';
    });
    html += '</div>';
    return html;
  }

  function renderList() {
    var list = visibleItems();
    var ul = document.getElementById('list');
    var empty = document.getElementById('empty');
    var count = document.getElementById('count');

    var title = document.getElementById('catTitle');
    if (title) { title.textContent = categoryName(state.category); }
    count.textContent = list.length + ' ' + plural(list.length, 'предмет', 'предмета', 'предметов');

    renderTable(list);

    if (!list.length) {
      ul.innerHTML = '';
      empty.hidden = state.view === 'table';
      return;
    }
    empty.hidden = true;

    var html = '';
    list.forEach(function (item) {
      var badge = item.verified === false ? '<span class="tag" title="Рецепт или разборка требуют проверки">проверить</span>' : '';
      var fair = fairPrice(item.id);
      var buy = buyPrice(item.id);
      var sell = sellPrice(item.id);
      html += '<li class="item' + (state.openedId === item.id ? ' is-open' : '') + '" data-id="' + escapeHtml(item.id) + '">' +
        '<div class="item-main">' +
          '<div class="item-row">' +
            '<button type="button" class="item-name" data-open="' + escapeHtml(item.id) + '">' +
              escapeHtml(item.name) + badge +
            '</button>' +
            chipsHtml(item) +
          '</div>' +
          '<div class="item-sub">' +
            '<button type="button" class="copy" data-copy="' + escapeHtml(item.id) + '" title="Скопировать shortname">' +
              escapeHtml(item.id) +
            '</button>' +
            '<span class="copy-hint">Копировать</span>' +
          '</div>' +
        '</div>' +
        '<div class="item-price">' +
          '<strong title="Цена продажи игроку">' + fmtT(buy) + '</strong>' +
          '<span>' + fmtAlt(buy) + '</span>' +
          '<span class="item-price-alt">себест. ' + fmtT(fair) + ' · выкуп ' + fmtT(sell) + '</span>' +
        '</div>' +
      '</li>';
    });
    ul.innerHTML = html;
  }

  /* =====================  Таблица цен  ===================== */

  function setView(view) {
    state.view = view === 'table' ? 'table' : 'list';
    saveState();
    syncView();
    renderList();
    renderCard();
  }

  function syncView() {
    var isTable = state.view === 'table';
    document.body.classList.toggle('view-table', isTable);
    var panel = document.getElementById('tablePanel');
    var wrap = document.getElementById('tableWrap');
    var list = document.getElementById('list');
    var empty = document.getElementById('empty');
    if (panel) { panel.hidden = !isTable; }
    if (wrap) { wrap.hidden = !isTable; }
    if (list) { list.hidden = isTable; }
    if (empty && isTable) { empty.hidden = true; }
    document.querySelectorAll('[data-view]').forEach(function (btn) {
      var active = btn.getAttribute('data-view') === state.view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function spreadPercent(buy, sell) {
    return buy > 0 ? ((buy - sell) / buy) * 100 : 0;
  }

  function renderTable(list) {
    var body = document.getElementById('tableBody');
    if (!body) { return; }
    list = list || visibleItems();

    if (!list.length) {
      body.innerHTML = '<tr><td class="table-empty" colspan="7">Ничего не найдено. Попробуйте другой запрос.</td></tr>';
      return;
    }

    var html = '';
    list.forEach(function (item) {
      var fair = fairPrice(item.id);
      var buy = buyPrice(item.id);
      var sell = sellPrice(item.id);
      var spread = spreadPercent(buy, sell);
      var recycle = recycleValue(item);
      var ov = state.overrides[item.id] || {};
      var buyManual = ov.buy != null;
      var sellManual = ov.sell != null;
      var manual = buyManual || sellManual;
      var idAttr = escapeHtml(item.id);
      var nameAttr = escapeHtml(item.name);

      html += '<tr class="prow' + (manual ? ' is-manual' : '') + '" data-id="' + idAttr + '">' +
        '<th scope="row">' +
          '<button type="button" class="pname" data-open="' + idAttr + '">' +
            nameAttr + (item.verified === false ? ' <span class="tag">проверить</span>' : '') +
          '</button>' +
          '<span class="pshort">' + idAttr + '</span>' +
        '</th>' +
        '<td class="num">' +
          '<span class="pfair">' + fmtT(fair) + '</span>' +
          '<span class="prub">' + fmtAlt(fair) + '</span>' +
        '</td>' +
        '<td class="num">' +
          '<input class="pinput' + (buyManual ? ' is-manual' : '') + '" type="number" min="0" step="1" inputmode="decimal"' +
            ' data-id="' + idAttr + '" data-field="buy"' +
            ' value="' + (buyManual ? String(Math.round(ov.buy * 100) / 100) : '') + '"' +
            ' placeholder="' + num(buy) + '" aria-label="Продажа игроку, тугрики: ' + nameAttr + '">' +
          '<span class="palt">' + fmtAlt(buy) + '</span>' +
        '</td>' +
        '<td class="num">' +
          '<input class="pinput' + (sellManual ? ' is-manual' : '') + '" type="number" min="0" step="1" inputmode="decimal"' +
            ' data-id="' + idAttr + '" data-field="sell"' +
            ' value="' + (sellManual ? String(Math.round(ov.sell * 100) / 100) : '') + '"' +
            ' placeholder="' + num(sell) + '" aria-label="Выкуп у игрока, тугрики: ' + nameAttr + '">' +
          '<span class="palt">' + fmtAlt(sell) + '</span>' +
        '</td>' +
        '<td class="num ' + (spread <= 0 ? 'pspread--bad' : 'pspread--ok') + '">' + spread.toFixed(0) + '%</td>' +
        '<td class="num">' + (recycle > 0 ? num(recycle) + ' ₸' : '—') + '</td>' +
        '<td class="num">' +
          (manual ? '<button type="button" class="row-reset" data-reset="' + idAttr +
            '" title="Сбросить ручные цены" aria-label="Сбросить ручные цены: ' + nameAttr + '">↺</button>' : '') +
        '</td>' +
      '</tr>';
    });
    body.innerHTML = html;
  }

  function commitTablePrice(id, field, raw) {
    if (!byId[id] || (field !== 'buy' && field !== 'sell')) { return; }
    var entry = state.overrides[id] || {};
    var text = String(raw == null ? '' : raw).trim();
    if (text === '') {
      delete entry[field];
    } else {
      var value = Number(text.replace(',', '.'));
      if (!isFinite(value) || value < 0) {
        toast('Введите положительное число');
        renderList();
        return;
      }
      entry[field] = Math.round(value * 100) / 100;
    }
    if (entry.buy == null && entry.sell == null) {
      delete state.overrides[id];
    } else {
      state.overrides[id] = entry;
    }
    saveState();
    renderList();
    renderCard();
    toast('Цена сохранена');
  }

  // Покупка округляется вверх, продажа — вниз, с записью ручных цен.
  function roundVisiblePrices(step) {
    step = Number(step) || 0;
    if (!(step > 0)) { return; }
    var list = visibleItems();
    var changed = 0;
    list.forEach(function (item) {
      var buy = Math.ceil(buyPrice(item.id) / step) * step;
      var sell = Math.floor(sellPrice(item.id) / step) * step;
      if (sell < 0) { sell = 0; }
      var entry = state.overrides[item.id] || {};
      if (entry.buy === buy && entry.sell === sell) { return; }
      entry.buy = buy;
      entry.sell = sell;
      state.overrides[item.id] = entry;
      changed += 1;
    });
    saveState();
    renderList();
    renderCard();
    toast(changed ? 'Округлено позиций: ' + changed : 'Все цены уже округлены');
  }

  function resetVisiblePrices() {
    var list = visibleItems();
    var count = 0;
    list.forEach(function (item) {
      if (state.overrides[item.id]) {
        delete state.overrides[item.id];
        count += 1;
      }
    });
    saveState();
    renderList();
    renderCard();
    toast(count ? 'Сброшено ручных цен: ' + count : 'Ручных цен нет');
  }

  function exportCsv() {
    var list = visibleItems();
    var rows = [['shortname', 'Название', 'Категория',
      'Себестоимость, ₸', 'Себестоимость, ₽', 'Себестоимость, скрап',
      'Продажа игроку, ₸', 'Продажа игроку, ₽', 'Продажа игроку, скрап',
      'Выкуп у игрока, ₸', 'Выкуп у игрока, ₽', 'Выкуп у игрока, скрап',
      'Спред, %', 'Разборка, ₸', 'Ручная цена']];
    list.forEach(function (item) {
      var ov = state.overrides[item.id] || {};
      var fair = fairPrice(item.id);
      var buy = buyPrice(item.id);
      var sell = sellPrice(item.id);
      var recycle = recycleValue(item);
      rows.push([
        item.id,
        item.name,
        categoryName(item.category),
        Math.round(fair), Math.round(fair / rubRate()), Math.round(fair / scrapRate()),
        Math.round(buy), Math.round(buy / rubRate()), Math.round(buy / scrapRate()),
        Math.round(sell), Math.round(sell / rubRate()), Math.round(sell / scrapRate()),
        spreadPercent(buy, sell).toFixed(1),
        recycle > 0 ? Math.round(recycle) : '',
        ov.buy != null || ov.sell != null ? 'да' : ''
      ]);
    });
    var csv = rows.map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(';');
    }).join('\r\n');
    try {
      var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'rust-prices-' + state.category + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('CSV: ' + list.length + ' строк');
    } catch (e) {
      toast('Не удалось выгрузить CSV');
    }
  }

  function ingredientTree(item, depth, stack, out) {
    if (!item.craft || depth > 5) { return out; }
    item.craft.ingredients.forEach(function (ing) {
      var sub = byId[ing.id];
      if (!sub) { return; }
      var unit = fairPrice(sub.id);
      var amount = Number(ing.amount) || 0;
      out.push({
        depth: depth,
        id: sub.id,
        name: sub.name,
        amount: amount,
        unit: unit,
        total: unit * amount,
        verified: sub.verified
      });
      if (sub.craft && stack.indexOf(sub.id) === -1) {
        ingredientTree(sub, depth + 1, stack.concat([sub.id]), out);
      }
    });
    return out;
  }

  function priceCellHtml(label, value) {
    return '<div class="price-cell">' +
      '<span class="label">' + label + '</span>' +
      '<strong>' + fmtT(value) + '</strong>' +
      '<span class="alt">' + fmtR(value) + '</span>' +
      '<span class="alt">' + fmtS(value) + '</span>' +
    '</div>';
  }

  function renderCard() {
    var card = document.getElementById('card');
    var item = state.openedId ? byId[state.openedId] : null;

    if (!item) {
      card.innerHTML = '<div class="card-empty">' +
        '<p>Выберите предмет слева, чтобы увидеть рецепт, разборку и цены.</p>' +
        '</div>';
      card.classList.remove('card--open');
      return;
    }

    var fair = fairPrice(item.id);
    var buy = buyPrice(item.id);
    var sell = sellPrice(item.id);
    var spread = buy > 0 ? ((buy - sell) / buy) * 100 : 0;
    var recycleSum = recycleValue(item);
    var isCraftable = !!(item.craft && item.craft.ingredients.length);

    var html = '';
    html += '<div class="card-head">' +
      '<div class="card-title">' +
        '<h2>' + escapeHtml(item.name) + '</h2>' +
        '<div class="card-meta">' +
          '<span>' + escapeHtml(categoryName(item.category)) + '</span>' +
          '<button type="button" class="copy-link" data-copy="' + escapeHtml(item.id) + '">' +
            escapeHtml(item.id) +
          '</button>' +
          (item.verified === false ? '<span class="tag">проверить</span>' : '') +
        '</div>' +
      '</div>' +
      '<button type="button" class="icon-btn" id="cardClose" aria-label="Закрыть карточку">×</button>' +
    '</div>';

    html += '<div class="card-body">';

    if (isCraftable) {
      html += '<div class="warn warn--info">Стоимость крафта (' + num(fair) + ' ₸ за ' +
        (item.craft.output > 1 ? item.craft.output + ' шт.' : '1 шт.') + ')</div>';
    } else if (item.category === 'resources') {
      html += '<div class="warn warn--info">Сырьё: базовая цена при x1 — ' + num(item.basePrice) +
        ' ₸, при множителе ×' + state.settings.yieldMultiplier + ' — ' + num(fair) + ' ₸</div>';
    } else {
      html += '<div class="warn warn--info">Цена задана вручную в data.js (basePrice = ' +
        num(fair) + ' ₸)</div>';
    }

    // Арбитраж
    if (item.recycle && item.recycle.length && buy < recycleSum) {
      html += '<div class="warn warn--danger">Арбитраж: выгодно купить и разобрать — покупка ' +
        num(buy) + ' ₸, разборка оценивается в ' + num(recycleSum) + ' ₸.</div>';
    }
    if (isCraftable) {
      // Сколько игроку стоят материалы, если покупать их у администратора.
      var materialsAtBuy = 0;
      item.craft.ingredients.forEach(function (ing) {
        if (!byId[ing.id]) { return; }
        materialsAtBuy += buyPrice(ing.id) * (Number(ing.amount) || 0);
      });
      materialsAtBuy = materialsAtBuy / (Number(item.craft.output) || 1);
      if (sell > materialsAtBuy) {
        html += '<div class="warn warn--danger">Выкуп (' + fmtT(sell) +
          ') выше стоимости материалов по цене продажи (' + fmtT(materialsAtBuy) +
          ') — игрок заработает на крафте.</div>';
      }
    }
    if (item.verified === false) {
      html += '<div class="warn warn--warn">Рецепт или разборка не проверены — уточните данные в data.js.</div>';
    }

    html += '<div class="price-grid">' +
      priceCellHtml('Себестоимость', fair) +
      priceCellHtml('Продажа игроку', buy) +
      priceCellHtml('Выкуп у игрока', sell) +
    '</div>';

    html += '<p class="spread">Спред: <strong>' + spread.toFixed(0) + '%</strong>' +
      ' · наценка ' + (state.settings.markup * 100).toFixed(0) +
      '% · выкуп ' + (buybackRate(item.category) * 100).toFixed(0) + '% себестоимости</p>';

    if (isCraftable) {
      var rows = ingredientTree(item, 0, [item.id], []);
      html += '<h3>Дерево крафта</h3>';
      html += '<ul class="tree">';
      rows.forEach(function (row) {
        html += '<li class="tree-row" style="padding-left:' + (row.depth * 14) + 'px">' +
          '<button type="button" class="tree-link" data-open="' + escapeHtml(row.id) + '">' +
            escapeHtml(row.name) + (row.verified === false ? ' <span class="tag">проверить</span>' : '') +
          '</button>' +
          '<span class="tree-amount">×' + num(row.amount) + '</span>' +
          '<span class="tree-price">' + num(row.total) + ' ₸</span>' +
        '</li>';
      });
      html += '</ul>';
      html += '<p class="total-line">Итог крафта: <strong>' + num(fair) + ' ₸</strong> (' +
        num(fair / state.settings.rubRate) + ' ₽) за ' + (item.craft.output || 1) + ' шт.</p>';
    }

    if (item.recycle && item.recycle.length) {
      html += '<h3>Разборка</h3><ul class="tree">';
      item.recycle.forEach(function (out) {
        var sub = byId[out.id];
        if (!sub) { return; }
        var amount = Number(out.amount) || 0;
        html += '<li class="tree-row">' +
          '<button type="button" class="tree-link" data-open="' + escapeHtml(sub.id) + '">' +
            escapeHtml(sub.name) + '</button>' +
          '<span class="tree-amount">×' + num(amount) + '</span>' +
          '<span class="tree-price">' + num(fairPrice(sub.id) * amount) + ' ₸</span>' +
        '</li>';
      });
      html += '</ul>';
      html += '<p class="total-line">Оценка разборки: <strong>' + num(recycleSum) + ' ₸</strong> (' +
        num(recycleSum / state.settings.rubRate) + ' ₽)</p>';
    }

    // Ручные цены
    var ov = state.overrides[item.id] || {};
    html += '<h3>Ручные цены</h3>' +
      '<div class="override">' +
        '<label>Покупка, ₸' +
          '<input type="number" min="0" step="1" data-override="buy" value="' +
            (ov.buy != null ? String(ov.buy) : '') + '" placeholder="' + num(buy) + '">' +
        '</label>' +
        '<label>Продажа, ₸' +
          '<input type="number" min="0" step="1" data-override="sell" value="' +
            (ov.sell != null ? String(ov.sell) : '') + '" placeholder="' + num(sell) + '">' +
        '</label>' +
      '</div>' +
      '<button type="button" class="btn btn--ghost" id="resetOverride">Сбросить ручные цены</button>';

    html += '</div>';
    card.innerHTML = html;
    card.classList.add('card--open');
  }

  function renderAll() {
    renderCategories();
    renderList();
    renderCard();
  }

  /* =====================  Настройки  ===================== */

  function syncSettingsInputs() {
    var pairs = [
      ['setMult', state.settings.yieldMultiplier],
      ['multQuick', state.settings.yieldMultiplier],
      ['setK', state.settings.yieldK],
      ['setRate', state.settings.rubRate],
      ['setScrap', state.settings.scrapPrice],
      ['setMarkup', Math.round(state.settings.markup * 1000) / 10],
      ['setBuybackRes', Math.round(state.settings.buyback.resources * 1000) / 10],
      ['setBuybackComp', Math.round(state.settings.buyback.components * 1000) / 10],
      ['setBuybackGoods', Math.round(state.settings.buyback['default'] * 1000) / 10]
    ];
    pairs.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el && document.activeElement !== el) {
        el.value = String(pair[1]);
      }
    });
    document.querySelectorAll('[data-mult]').forEach(function (btn) {
      var value = Number(btn.getAttribute('data-mult'));
      btn.classList.toggle('is-active', Math.abs(value - state.settings.yieldMultiplier) < 0.0001);
    });
    var rateNote = document.getElementById('rateNote');
    if (rateNote) {
      rateNote.textContent = '1 ₽ = ' + num(state.settings.rubRate) + ' ₸ · 1 скрап = ' + num(state.settings.scrapPrice) + ' ₸';
    }
  }

  function applySettings(patch) {
    Object.keys(patch).forEach(function (key) {
      state.settings[key] = patch[key];
    });
    clearCache();
    syncSettingsInputs();
    renderList();
    renderCard();
    saveState();
  }

  function openSettings(open) {
    var drawer = document.getElementById('settings');
    var overlay = document.getElementById('settingsOverlay');
    drawer.hidden = !open;
    overlay.hidden = !open;
    var cardOpen = window.innerWidth <= 900 && !!state.openedId;
    document.body.classList.toggle('no-scroll', open || cardOpen);
    if (open) {
      syncSettingsInputs();
      var first = document.getElementById('setMult');
      if (first) { first.focus(); }
    }
  }

  /* =====================  Экспорт / импорт  ===================== */

  function exportJson() {
    try {
      var payload = {
        app: 'rust-economy',
        version: 3,
        exportedAt: new Date().toISOString(),
        comment: 'items — та же таблица, что в js/data.js. Импорт этого файла возвращает её на место.',
        settings: state.settings,
        items: items,
        overrides: state.overrides
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'rust-economy.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('Файл сохранён: ' + items.length + ' предметов');
    } catch (e) {
      toast('Не удалось экспортировать');
    }
  }

  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object') { throw new Error('bad json'); }
        var settings = sanitizeSettings(parsed.settings || parsed);
        Object.keys(settings).forEach(function (key) { state.settings[key] = settings[key]; });
        // Сначала таблица, потом ручные цены: они проверяются по новому списку id.
        if (Array.isArray(parsed.items)) { setItems(parsed.items); }
        else if (parsed.items === null) { setItems(null); }
        state.overrides = sanitizeOverrides(parsed.overrides);
        clearCache();
        syncSettingsInputs();
        renderCategories();
        renderAll();
        saveState();
        toast('Импорт выполнен: ' + items.length + ' предметов');
      } catch (e) {
        toast('Ошибка: файл не подходит');
      }
    };
    reader.onerror = function () { toast('Не удалось прочитать файл'); };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!window.confirm('Сбросить настройки и все ручные цены?')) { return; }
    state.settings = defaultSettings();
    setItems(null);
    state.overrides = {};
    clearCache();
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ничего */ }
    syncSettingsInputs();
    renderAll();
    toast('Сброшено');
  }

  /* =====================  Копирование  ===================== */

  function copyText(text) {
    function fallback() {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        toast(ok ? 'Скопировано' : 'Не удалось скопировать');
      } catch (e) {
        toast('Не удалось скопировать');
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Скопировано');
      }, fallback);
    } else {
      fallback();
    }
  }

  /* =====================  События  ===================== */

  function bindEvents() {
    document.getElementById('search').addEventListener('input', function (e) {
      state.search = e.target.value || '';
      renderList();
    });

    document.getElementById('craftOnly').addEventListener('change', function (e) {
      state.craftOnly = e.target.checked;
      renderList();
    });

    document.getElementById('sort').addEventListener('change', function (e) {
      state.sort = e.target.value;
      renderList();
    });

    document.getElementById('viewSwitch').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-view]');
      if (!btn) { return; }
      setView(btn.getAttribute('data-view'));
    });

    var tableWrap = document.getElementById('tableWrap');
    tableWrap.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-open]');
      if (openBtn) {
        openItem(openBtn.getAttribute('data-open'));
        return;
      }
      var resetBtn = e.target.closest('[data-reset]');
      if (resetBtn) {
        delete state.overrides[resetBtn.getAttribute('data-reset')];
        saveState();
        renderList();
        renderCard();
        toast('Ручные цены сброшены');
      }
    });
    tableWrap.addEventListener('change', function (e) {
      var input = e.target.closest('.pinput');
      if (!input) { return; }
      commitTablePrice(input.getAttribute('data-id'), input.getAttribute('data-field'), input.value);
    });
    tableWrap.addEventListener('keydown', function (e) {
      var input = e.target.closest('.pinput');
      if (!input) { return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        renderList();
        input.blur();
      }
    });

    document.getElementById('btnRound').addEventListener('click', function () {
      roundVisiblePrices(document.getElementById('roundStep').value);
    });
    document.getElementById('btnResetPrices').addEventListener('click', resetVisiblePrices);
    document.getElementById('btnCsv').addEventListener('click', exportCsv);

    document.getElementById('cats').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat]');
      if (!btn) { return; }
      state.category = btn.getAttribute('data-cat');
      state.openedId = null;
      renderCategories();
      renderList();
      renderCard();
      var list = document.getElementById('list');
      if (list) { list.scrollTop = 0; }
      if (window.innerWidth <= 900) {
        var content = document.getElementById('content');
        if (content) { content.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });

    document.getElementById('list').addEventListener('click', function (e) {
      var copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        copyText(copyBtn.getAttribute('data-copy'));
        return;
      }
      var openBtn = e.target.closest('[data-open]');
      if (openBtn) {
        openItem(openBtn.getAttribute('data-open'));
        return;
      }
      var row = e.target.closest('.item');
      if (row) { openItem(row.getAttribute('data-id')); }
    });

    document.getElementById('card').addEventListener('click', function (e) {
      if (e.target.closest('#cardClose')) {
        closeCard();
        return;
      }
      var copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        copyText(copyBtn.getAttribute('data-copy'));
        return;
      }
      var openBtn = e.target.closest('[data-open]');
      if (openBtn) {
        openItem(openBtn.getAttribute('data-open'));
        return;
      }
      if (e.target.closest('#resetOverride')) {
        delete state.overrides[state.openedId];
        saveState();
        renderCard();
        renderList();
        toast('Ручные цены сброшены');
      }
    });

    document.getElementById('card').addEventListener('change', function (e) {
      var input = e.target.closest('[data-override]');
      if (!input || !state.openedId) { return; }
      var id = state.openedId;
      var kind = input.getAttribute('data-override');
      var raw = input.value.trim();
      var entry = state.overrides[id] || {};
      if (raw === '') {
        delete entry[kind];
      } else {
        var value = Number(raw.replace(',', '.'));
        if (!isFinite(value) || value < 0) {
          toast('Введите положительное число');
          renderCard();
          return;
        }
        entry[kind] = value;
      }
      if (entry.buy == null && entry.sell == null) {
        delete state.overrides[id];
      } else {
        state.overrides[id] = entry;
      }
      saveState();
      renderCard();
      renderList();
      toast('Цена сохранена');
    });

    document.getElementById('multQuick').addEventListener('change', function (e) {
      var value = clampNumber(e.target.value, 0.1, 1000, state.settings.yieldMultiplier);
      applySettings({ yieldMultiplier: value });
    });

    document.querySelectorAll('[data-mult]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applySettings({ yieldMultiplier: Number(btn.getAttribute('data-mult')) });
      });
    });

    document.getElementById('btnSettings').addEventListener('click', function () { openSettings(true); });
    document.getElementById('btnCloseSettings').addEventListener('click', function () { openSettings(false); });
    document.getElementById('settingsOverlay').addEventListener('click', function () { openSettings(false); });

    document.getElementById('setMult').addEventListener('change', function (e) {
      applySettings({ yieldMultiplier: clampNumber(e.target.value, 0.1, 1000, state.settings.yieldMultiplier) });
    });
    document.getElementById('setK').addEventListener('change', function (e) {
      applySettings({ yieldK: clampNumber(e.target.value, 0, 3, state.settings.yieldK) });
    });
    document.getElementById('setRate').addEventListener('change', function (e) {
      applySettings({ rubRate: clampNumber(e.target.value, 0.01, 100000, state.settings.rubRate) });
    });
    document.getElementById('setMarkup').addEventListener('change', function (e) {
      var percent = clampNumber(e.target.value, -90, 1000, state.settings.markup * 100);
      applySettings({ markup: percent / 100 });
    });
    document.getElementById('setScrap').addEventListener('change', function (e) {
      applySettings({ scrapPrice: clampNumber(e.target.value, 0.01, 1000000, state.settings.scrapPrice) });
    });
    [['setBuybackRes', 'resources'], ['setBuybackComp', 'components'], ['setBuybackGoods', 'default']].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el) { return; }
      el.addEventListener('change', function (e) {
        var percent = clampNumber(e.target.value, 0, 95, state.settings.buyback[pair[1]] * 100);
        var next = {
          resources: state.settings.buyback.resources,
          components: state.settings.buyback.components,
          'default': state.settings.buyback['default']
        };
        next[pair[1]] = percent / 100;
        applySettings({ buyback: next });
      });
    });

    document.getElementById('btnExport').addEventListener('click', exportJson);
    document.getElementById('btnImport').addEventListener('click', function () {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) { importJson(file); }
      e.target.value = '';
    });
    document.getElementById('btnReset').addEventListener('click', resetAll);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!document.getElementById('settings').hidden) {
          openSettings(false);
        } else if (state.openedId) {
          closeCard();
        }
      }
    });

    // На телефоне карточка — на весь экран; при ресайзе возвращаем раскладку.
    window.addEventListener('resize', function () {
      document.body.classList.remove('no-scroll');
    });
  }

  function openItem(id) {
    if (!byId[id]) { return; }
    state.openedId = id;
    renderList();
    renderCard();
    if (window.innerWidth <= 900) {
      document.body.classList.add('no-scroll');
      var card = document.getElementById('card');
      card.scrollTop = 0;
    }
  }

  function closeCard() {
    state.openedId = null;
    document.body.classList.remove('no-scroll');
    renderCard();
    renderList();
  }

  /* =====================  Старт  ===================== */

  function init() {
    loadState();
    clearCache();
    renderCategories();
    syncView();
    renderList();
    renderCard();
    syncSettingsInputs();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
