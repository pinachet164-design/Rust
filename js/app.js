/* Экономика Rust — логика сайта. */
(function () {
  'use strict';

  var DATA = window.RUST_DATA;
  var STORAGE_KEY = 'rust-economy-v4';

  var settings = clone(DATA.settings);
  var resources = clone(DATA.resources);
  var items = clone(DATA.items);
  var resourceById = {};
  var itemById = {};
  var sourceNote = 'демо-данные';

  var state = {
    category: 'all',
    search: '',
    sort: 'name',
    craftOnly: false,
    onlyReal: true,
    view: 'list',
    opened: null,
    newItem: null
  };

  /* Справочник предметов игры: shortname -> [EN, RU]. */
  var GAME_ITEMS = window.RUST_GAME_ITEMS || {};
  var gameByShort = {};
  var gameByName = {};
  var gameKeys = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function num(value, digits) {
    var n = Number(value);
    if (!isFinite(n)) { return '—'; }
    var options = { maximumFractionDigits: digits == null ? 2 : digits };
    return n.toLocaleString('ru-RU', options);
  }

  function rubRate() {
    var rate = Number(settings.rubRate);
    return rate > 0 ? rate : 1;
  }

  function scrapRate() {
    var price = Number(settings.scrapPrice);
    return price > 0 ? price : 1;
  }

  function fmtT(value) { return num(value) + ' ₮'; }
  function fmtAlt(value) {
    return num(value / rubRate()) + ' ₽ · ' + num(value / scrapRate(), 0) + ' скрап';
  }

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* =====================  Индексы и цены  ===================== */

  function rebuildIndexes() {
    resourceById = {};
    itemById = {};
    resources.forEach(function (resource) { resourceById[resource.id] = resource; });
    items.forEach(function (item) { itemById[item.id] = item; });
  }

  function rarityCoef(rarity) {
    var value = Number(settings.rarity && settings.rarity[rarity]);
    return isFinite(value) && value > 0 ? value : 1;
  }

  function dlcFactor(item) {
    var mult = Number(settings.dlcMult);
    if (!isFinite(mult) || mult <= 0) { mult = 1; }
    return item && item.dlc ? mult : 1;
  }

  // Себестоимость крафтового предмета по рецепту; null — если рецепт неполный.
  function costOf(item, guard) {
    if (!item || !item.craft) { return null; }
    if (!item.ingredients || !item.ingredients.length) { return null; }
    guard = guard || {};
    if (guard[item.id]) { return null; }
    guard[item.id] = true;
    var sum = 0;
    for (var i = 0; i < item.ingredients.length; i++) {
      var ing = item.ingredients[i];
      var price = unitPrice(ing.id, guard);
      if (price == null) { delete guard[item.id]; return null; }
      sum += price * ing.amount;
    }
    delete guard[item.id];
    return sum;
  }

  function unitPrice(id, guard) {
    var resource = resourceById[id];
    if (resource) { return Number(resource.price) || 0; }
    var item = itemById[id];
    if (item) { return costOf(item, guard); }
    return null;
  }

  function entryCost(entry) {
    if (entry.kind === 'resource') { return Number(entry.data.price) || 0; }
    var itemData = entry.data;
    if (itemData && itemData.craft && (!itemData.ingredients || !itemData.ingredients.length)) { return 0; }
    var cost = costOf(entry.data);
    if (cost == null) { return Number(entry.data.sheetCost) || 0; }
    return cost;
  }

  function entryBuy(entry) {
    var item = entry.data;
    if (entry.kind === 'item' && !item.craft) { return Number(item.buy) || 0; }
    var cost = entryCost(entry);
    return cost * rarityCoef(item.rarity) * Number(settings.buyMult) * dlcFactor(item);
  }

  function entrySell(entry) {
    var item = entry.data;
    if (entry.kind === 'item' && !item.craft) { return Number(item.sell) || 0; }
    return entryCost(entry) * Number(settings.sellMult) * dlcFactor(item);
  }

  function entries() {
    var list = [];
    resources.forEach(function (resource) {
      list.push({ kind: 'resource', id: resource.id, data: resource });
    });
    items.forEach(function (item) {
      list.push({ kind: 'item', id: item.id, data: item });
    });
    return list;
  }

  function entryKey(entry) { return entry.kind + ':' + entry.id; }

  /* =====================  Проверка по предметам Rust  ===================== */

  function nameKey(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/g, ' ')
      .trim();
  }

  // Варианты перевода, которые встречаются в таблицах, → слова из локализации игры.
  var NAME_SYNONYMS = {
    'сальвированный': 'самодельный', 'сальвированная': 'самодельная', 'сальвированное': 'самодельное',
    'индустриальный': 'промышленный', 'индустриальная': 'промышленная', 'индустриальное': 'промышленное',
    'индустриальные': 'промышленные', 'индустриальный': 'промышленный',
    'хв': 'hv', 'нv': 'hv'
  };

  function stemOf(word) {
    var mapped = NAME_SYNONYMS[word] || word;
    return mapped.length > 5 ? mapped.slice(0, 5) : mapped;
  }

  function tokensOf(key) {
    var stop = { 'из': 1, 'для': 1, 'на': 1, 'с': 1, 'и': 1, 'the': 1, 'of': 1, 'a': 1 };
    var out = [];
    key.split(' ').forEach(function (word) {
      if (!word || stop[word]) { return; }
      var stem = stemOf(word);
      if (out.indexOf(stem) === -1) { out.push(stem); }
    });
    return out;
  }

  function buildGameIndex() {
    gameByShort = {};
    gameByName = {};
    gameKeys = [];
    Object.keys(GAME_ITEMS).forEach(function (short) {
      var pair = GAME_ITEMS[short] || [];
      gameByShort[short.toLowerCase()] = short;
      [pair[0], pair[1]].forEach(function (name) {
        var key = nameKey(name);
        if (key && !gameByName[key]) { gameByName[key] = short; }
      });
      gameKeys.push({
        short: short,
        tokens: tokensOf(nameKey(pair[0])).concat(tokensOf(nameKey(pair[1])))
      });
    });
  }

  // Возвращает настоящий shortname (или null, если предмета нет в игре).
  function matchGameItem(item) {
    var short = String(item.id || '').trim().toLowerCase();
    if (short && gameByShort[short]) { return gameByShort[short]; }
    var key = nameKey(item.name);
    if (key && gameByName[key]) { return gameByName[key]; }
    var tokens = tokensOf(key);
    if (!tokens.length) { return null; }

    var best = null;
    var bestScore = 0;
    var second = 0;
    gameKeys.forEach(function (entry) {
      var hit = 0;
      tokens.forEach(function (token) {
        if (entry.tokens.indexOf(token) !== -1) { hit++; }
      });
      var union = tokens.length + entry.tokens.length - hit;
      var score = union ? hit / union : 0;
      // «барабанная установка» ⊂ «барабанная установка из хлама»
      if (hit === tokens.length && entry.tokens.length > tokens.length) {
        score = Math.max(score, 0.7);
      }
      if (score > bestScore) { second = bestScore; bestScore = score; best = entry; }
      else if (score > second) { second = score; }
    });

    if (best && bestScore >= 0.5 && bestScore - second >= 0.12) { return best.short; }
    return null;
  }

  // Состояния: ok — shortname есть в игре; name — совпало по названию;
  // missing — shortname указан, но такого предмета в игре нет; unknown — проверить нечем.
  function annotateCatalog() {
    items.forEach(function (item) {
      if (item.custom) {
        item.gameShort = '';
        item.gameState = 'custom';
        return;
      }
      var short = String(item.id || '').trim().toLowerCase();
      var real = matchGameItem(item);
      item.gameShort = real || '';
      if (short && gameByShort[short]) { item.gameState = 'ok'; }
      else if (real) { item.gameState = 'name'; }
      else if (short) { item.gameState = 'missing'; }
      else { item.gameState = 'unknown'; }
    });
  }

  function itemsWithState(stateName) {
    return items.filter(function (item) { return item.gameState === stateName; });
  }

  /* =====================  Ресурсы из игры  ===================== */

  function gameResourceList() {
    return Array.isArray(window.RUST_GAME_RESOURCES) ? window.RUST_GAME_RESOURCES : [];
  }

  function missingGameResources() {
    return gameResourceList().filter(function (meta) {
      return meta && meta.id && !resourceById[meta.id];
    });
  }

  function unpricedResources() {
    return resources.filter(function (resource) { return !(Number(resource.price) > 0); });
  }

  function syncGameResources() {
    var info = document.getElementById('gameResInfo');
    var button = document.getElementById('btnAddGameRes');
    if (!info || !button) { return; }
    var book = gameResourceList();
    var missing = missingGameResources();
    var unpriced = unpricedResources();
    info.textContent = 'В игре в крафте участвует ' + book.length + ' ресурсов и компонентов. ' +
      'В каталоге — ' + resources.length + ', не хватает ' + missing.length + '.' +
      (unpriced.length ? ' Без цены: ' + unpriced.length + '.' : '');
    button.textContent = missing.length ? 'Добавить недостающие (' + missing.length + ')' : 'Все ресурсы уже есть';
    button.disabled = !missing.length;
  }

  function addGameResources() {
    var missing = missingGameResources();
    if (!missing.length) { toast('Все ресурсы из игры уже в каталоге'); return; }
    missing.forEach(function (meta) {
      resources.push({
        id: meta.id,
        name: meta.name,
        category: meta.category || 'Ресурсы',
        rarity: meta.rarity || 'Обычный',
        price: 0,
        stack: Number(meta.stack) || 0,
        maxPerDay: 0,
        gameOnly: true
      });
    });
    rebuildIndexes();
    saveState();
    renderAll();
    toast('Добавлено из Rust: ' + missing.length + ' — задайте им цену в карточке');
  }

  /* =====================  Фильтр и сортировка  ===================== */

  function categories() {
    var seen = {};
    var order = [];
    items.forEach(function (item) {
      var name = item.category || 'Прочее';
      if (!seen[name]) { seen[name] = 0; order.push(name); }
      seen[name]++;
    });
    var list = [{ id: 'all', name: 'Все предметы', count: resources.length + items.length }];
    list.push({ id: 'resources', name: 'Ресурсы', count: resources.length });
    order.forEach(function (name) {
      list.push({ id: name, name: name, count: seen[name] });
    });
    return list;
  }

  function visibleEntries() {
    var search = state.search.trim().toLowerCase();
    var list = entries().filter(function (entry) {
      var item = entry.data;
      if (state.category === 'resources' && entry.kind !== 'resource') { return false; }
      if (state.category !== 'all' && state.category !== 'resources') {
        if (entry.kind !== 'item' || item.category !== state.category) { return false; }
      }
      if (state.onlyReal && entry.kind === 'item' && item.gameState === 'missing') { return false; }
      if (state.craftOnly && !item.craft) { return false; }
      if (!search) { return true; }
      var haystack = (item.name + ' ' + (item.id || '') + ' ' + (item.rarity || '')).toLowerCase();
      return haystack.indexOf(search) !== -1;
    });

    list.sort(function (a, b) {
      if (state.sort === 'buy-asc') { return entryBuy(a) - entryBuy(b); }
      if (state.sort === 'buy-desc') { return entryBuy(b) - entryBuy(a); }
      if (state.sort === 'sell-desc') { return entrySell(b) - entrySell(a); }
      return String(a.data.name).localeCompare(String(b.data.name), 'ru');
    });
    return list;
  }

  /* =====================  Отрисовка  ===================== */

  function rarityClass(rarity) {
    return 'tag tag--' + String(rarity || '').toLowerCase();
  }

  function renderCategories() {
    var nav = document.getElementById('cats');
    var html = '';
    categories().forEach(function (category) {
      var active = state.category === category.id ? ' is-active' : '';
      html += '<button type="button" class="cat' + active + '" data-cat="' + escapeHtml(category.id) + '">' +
        '<span>' + escapeHtml(category.name) + '</span>' +
        '<span class="cat-count">' + category.count + '</span>' +
        '</button>';
    });
    nav.innerHTML = html;
  }

  function renderList() {
    var list = visibleEntries();
    var listEl = document.getElementById('list');
    var emptyEl = document.getElementById('empty');
    var countEl = document.getElementById('count');

    countEl.textContent = list.length + ' поз.';
    emptyEl.hidden = list.length > 0;

    var html = '';
    list.forEach(function (entry) {
      var item = entry.data;
      var active = state.opened === entryKey(entry) ? ' is-open' : '';
      var tags = '<span class="' + rarityClass(item.rarity) + '">' + escapeHtml(item.rarity || '—') + '</span>';
      if (item.dlc) { tags += '<span class="tag tag--dlc">DLC</span>'; }
      if (entry.kind === 'resource') { tags += '<span class="tag tag--soft">ресурс</span>'; }
      if (entry.kind === 'resource' && !(Number(item.price) > 0)) { tags += '<span class="tag tag--missing">нет цены</span>'; }
      if (entry.kind === 'item' && item.custom) { tags += '<span class="tag tag--custom">кастомный</span>'; }
      if (entry.kind === 'item' && recipeChanged(item)) { tags += '<span class="tag tag--changed">рецепт изменён</span>'; }
      html += '<li class="item' + active + '">' +
        '<button type="button" class="item-btn" data-key="' + escapeHtml(entryKey(entry)) + '">' +
          '<span class="item-main">' +
            '<span class="item-name">' + escapeHtml(item.name) + '</span>' +
            '<span class="item-sub">' + escapeHtml(item.id || '—') + ' · стак ' + num(item.stack, 0) + '</span>' +
          '</span>' +
          '<span class="item-tags">' + tags + '</span>' +
          '<span class="item-prices">' +
            '<span class="price"><span class="price-label">покупка</span><b>' + fmtT(entryBuy(entry)) + '</b></span>' +
            '<span class="price price--sell"><span class="price-label">продажа</span><b>' + fmtT(entrySell(entry)) + '</b></span>' +
          '</span>' +
        '</button>' +
      '</li>';
    });
    listEl.innerHTML = html;

    var title = document.getElementById('catTitle');
    if (state.category === 'all') { title.textContent = 'Все предметы'; }
    else if (state.category === 'resources') { title.textContent = 'Ресурсы'; }
    else { title.textContent = state.category; }

    document.getElementById('sourceNote').textContent = sourceSummary();
  }

  function sourceSummary() {
    var text = 'Данные: ' + sourceNote;
    var hidden = itemsWithState('missing').length;
    var unknown = itemsWithState('unknown').length;
    if (hidden) {
      text += ' · нет в Rust: ' + hidden + (state.onlyReal ? ' (скрыты)' : ' (показаны)');
    }
    if (unknown) {
      text += ' · без shortname: ' + unknown;
    }
    var unpriced = unpricedResources().length;
    if (unpriced) {
      text += ' · без цены: ' + unpriced;
    }
    var custom = items.filter(function (item) { return item.custom; }).length;
    if (custom) {
      text += ' · кастомных: ' + custom;
    }
    return text;
  }

  function renderTable() {
    var list = visibleEntries();
    var body = document.getElementById('tableBody');
    var html = '';
    list.forEach(function (entry) {
      var item = entry.data;
      var cost = entry.kind === 'resource' ? Number(item.price) || 0 : costOf(item);
      html += '<tr>' +
        '<td>' + escapeHtml(item.name) +
          (item.custom ? ' <span class="tag tag--custom">кастомный</span>' : '') +
          (recipeChanged(item) ? ' <span class="tag tag--changed">рецепт изменён</span>' : '') +
          '<span class="cell-sub">' + escapeHtml(item.id || '—') + '</span></td>' +
        '<td><span class="' + rarityClass(item.rarity) + '">' + escapeHtml(item.rarity || '—') + '</span>' +
          (item.dlc ? ' <span class="tag tag--dlc">DLC</span>' : '') + '</td>' +
        '<td class="num">' + (cost == null ? 'по таблице' : fmtT(cost)) + '</td>' +
        '<td class="num">' + fmtT(entryBuy(entry)) + '</td>' +
        '<td class="num">' + fmtT(entrySell(entry)) + '</td>' +
        '<td class="num">' + num(item.stack, 0) + '</td>' +
        '<td class="num">' + (item.maxPerDay ? num(item.maxPerDay, 0) : '—') + '</td>' +
      '</tr>';
    });
    body.innerHTML = html;
    document.getElementById('sourceNote').textContent = sourceSummary();
  }

  function renderCard() {
    var card = document.getElementById('card');
    if (state.newItem) {
      renderNewItem(card);
      return;
    }
    if (!state.opened) {
      card.innerHTML = '<div class="card-empty"><p>Выберите предмет, чтобы увидеть рецепт, цены и стак.</p></div>';
      return;
    }
    var parts = state.opened.split(':');
    var kind = parts[0];
    var id = parts.slice(1).join(':');
    var item = kind === 'resource' ? resourceById[id] : itemById[id];
    if (!item) {
      card.innerHTML = '<div class="card-empty"><p>Предмет не найден.</p></div>';
      return;
    }
    var entry = { kind: kind, id: id, data: item };
    var cost = entryCost(entry);

    var html = '<div class="card-head">' +
      '<h2>' + escapeHtml(item.name) + '</h2>' +
      '<div class="card-tags"><span class="' + rarityClass(item.rarity) + '">' + escapeHtml(item.rarity || '—') + '</span>' +
      (item.dlc ? '<span class="tag tag--dlc">DLC</span>' : '') +
      (entry.kind === 'item' && item.custom ? '<span class="tag tag--custom">кастомный</span>' : '') +
      (entry.kind === 'item' && recipeChanged(item) ? '<span class="tag tag--changed">рецепт изменён</span>' : '') +
      (entry.kind === 'item' && item.gameState === 'missing' ? '<span class="tag tag--missing">нет в Rust</span>' : '') +
      (entry.kind === 'item' && item.gameState === 'unknown' ? '<span class="tag tag--missing">без shortname</span>' : '') +
      (item.craft ? '<span class="tag tag--soft">крафт</span>' : '<span class="tag tag--soft">' + (kind === 'resource' ? 'ресурс' : 'некрафт') + '</span>') +
      '</div>' +
      '<p class="shortname">' + escapeHtml(item.id || 'без shortname') + '</p>' +
      '<div class="rarity-edit" role="group" aria-label="Редкость предмета">' +
        '<span class="rarity-edit-label">Редкость</span>' +
        RARITY_NAMES.map(function (name) {
          var on = String(item.rarity || '') === name;
          return '<button type="button" class="rarity-chip tag--' + name.toLowerCase() + (on ? ' is-active' : '') + '"' +
            ' data-set-rarity="' + escapeHtml(name) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
            escapeHtml(name) + '</button>';
        }).join('') +
      '</div>' +
    '</div>';

    html += '<div class="price-grid">' +
      '<div class="price-box"><span>Себестоимость</span><b>' + fmtT(cost) + '</b><small>' + fmtAlt(cost) + '</small></div>' +
      '<div class="price-box"><span>Покупка у магазина</span><b>' + fmtT(entryBuy(entry)) + '</b><small>' + fmtAlt(entryBuy(entry)) + '</small></div>' +
      '<div class="price-box price-box--sell"><span>Продажа магазину</span><b>' + fmtT(entrySell(entry)) + '</b><small>' + fmtAlt(entrySell(entry)) + '</small></div>' +
    '</div>';

    html += '<dl class="facts">' +
      '<div><dt>Стак</dt><dd>' + num(item.stack, 0) + ' шт.</dd></div>' +
      '<div><dt>Макс. продаж/день</dt><dd>' + (item.maxPerDay ? num(item.maxPerDay, 0) : '—') + '</dd></div>' +
      '<div><dt>Категория</dt><dd>' + escapeHtml(item.category || '—') + '</dd></div>' +
      '<div><dt>Множитель редкости</dt><dd>×' + num(rarityCoef(item.rarity), 2) + '</dd></div>' +
    '</dl>';

    if (kind === 'item' && item.gameState === 'missing') {
      html += '<p class="card-note card-note--warn">Этого shortname нет в списке предметов Rust — сайт скрывает позицию из каталога (галочка «только из Rust»).</p>';
    } else if (kind === 'item' && item.gameState === 'unknown') {
      html += '<p class="card-note card-note--warn">В таблице у предмета нет shortname, поэтому проверить его по игре нельзя.</p>';
    }

    if (kind === 'resource') {
      html += '<h3 class="card-sub">Базовая цена</h3>' +
        '<div class="price-edit">' +
          '<input id="resPrice" type="number" min="0" step="0.01" inputmode="decimal" value="' + (Number(item.price) || 0) + '" aria-label="Базовая цена ресурса в тугриках">' +
          '<span class="price-edit-unit">₮ за штуку</span>' +
          '<button type="button" class="btn" id="btnResPrice">Сохранить</button>' +
          (item.originPrice != null ? '<button type="button" class="btn btn--ghost" id="btnResPriceReset">Вернуть ' + fmtT(Number(item.originPrice) || 0) + '</button>' : '') +
        '</div>' +
        (!(Number(item.price) > 0) ? '<p class="card-note card-note--warn">Цена не задана: рецепты с этим ресурсом считаются неполными, а предметы берут себестоимость из таблицы.</p>' : '') +
        '<p class="card-note">Цена участвует в себестоимости всех рецептов, где указан этот ресурс, — правка сразу меняет цены предметов.</p>';
    } else if (item.craft) {
      html += recipeEditorHtml(item);
    } else {
      html += '<p class="card-note">Некрафтовый предмет. Цены покупки и продажи взяты из таблицы.</p>';
      if (item.source) {
        html += '<p class="card-note">Где найти: ' + escapeHtml(item.source) + '</p>';
      }
    }

    if (kind === 'item' && item.custom) {
      html += customItemEditorHtml(item);
    }

    html += '<div class="card-actions"><button type="button" class="btn btn--ghost" id="btnCloseCard">Закрыть</button></div>';
    card.innerHTML = html;

    bindRecipeEditor(item);
    if (kind === 'item' && item.custom) { bindCustomItemEditor(item); }

    var close = document.getElementById('btnCloseCard');
    if (close) {
      close.addEventListener('click', function () { state.opened = null; renderAll(); });
    }

    var priceInput = document.getElementById('resPrice');
    if (priceInput) {
      var savePrice = function () {
        var value = Math.max(0, parseFloat(String(priceInput.value).replace(',', '.')) || 0);
        if (item.originPrice == null) { item.originPrice = Number(item.price) || 0; }
        item.price = value;
        delete item.gameOnly;
        saveState();
        renderAll();
        toast(item.name + ': цена ' + fmtT(value) + ' — цены предметов пересчитаны');
      };
      document.getElementById('btnResPrice').addEventListener('click', savePrice);
      priceInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') { event.preventDefault(); savePrice(); }
      });
      var resetPrice = document.getElementById('btnResPriceReset');
      if (resetPrice) {
        resetPrice.addEventListener('click', function () {
          item.price = Number(item.originPrice) || 0;
          delete item.originPrice;
          saveState();
          renderAll();
          toast(item.name + ': цена возвращена');
        });
      }
    }

    card.querySelectorAll('[data-set-rarity]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var name = chip.getAttribute('data-set-rarity');
        if (!name || String(item.rarity || '') === name) { return; }
        item.rarity = name;
        saveState();
        renderAll();
        toast(item.name + ': редкость «' + name + '» — цены пересчитаны');
      });
    });
  }

  /* =====================  Редактор рецепта  ===================== */

  // Снимок исходного рецепта: из демо или из импортированной таблицы.
  function ensureOrigins() {
    items.forEach(function (item) {
      if (item.originIngredients === undefined) {
        item.originIngredients = item.ingredients ? clone(item.ingredients) : null;
      }
    });
  }

  function resetOrigins() {
    items.forEach(function (item) {
      item.originIngredients = item.ingredients ? clone(item.ingredients) : null;
    });
  }

  function recipeSignature(list) {
    return (list || []).map(function (ing) {
      var id = String(ing && (ing.id || ing.name) || '').trim().toLowerCase();
      var amount = Math.round(Number(ing && ing.amount) || 0);
      return id + '×' + amount;
    }).sort().join('|');
  }

  function recipeChanged(item) {
    if (!item || !item.craft) { return false; }
    return recipeSignature(item.ingredients) !== recipeSignature(item.originIngredients);
  }

  function resourceSelectHtml(selectedId, attrs, fallbackName) {
    var groups = {};
    var order = [];
    resources.forEach(function (resource) {
      var category = resource.category || 'Прочее';
      if (!groups[category]) { groups[category] = []; order.push(category); }
      groups[category].push(resource);
    });
    var html = '<select class="ing-pick" ' + (attrs || '') + ' aria-label="Ингредиент">' +
      '<option value="">— выберите ресурс —</option>';
    order.forEach(function (category) {
      html += '<optgroup label="' + escapeHtml(category) + '">';
      groups[category]
        .slice()
        .sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ru'); })
        .forEach(function (resource) {
          html += '<option value="' + escapeHtml(resource.id) + '"' +
            (resource.id === selectedId ? ' selected' : '') + '>' +
            escapeHtml(resource.name) + ' · ' + fmtT(resource.price) + '</option>';
        });
      html += '</optgroup>';
    });
    if (!selectedId && fallbackName) {
      html += '<option value="" selected>не найден: ' + escapeHtml(fallbackName) + '</option>';
    }
    return html + '</select>';
  }

  function recipeEditorHtml(item) {
    var changed = recipeChanged(item);
    var html = '<h3 class="card-sub">Рецепт' +
      (changed ? ' <span class="tag tag--changed">изменён</span>' : '') + '</h3>';

    if (item.ingredients && item.ingredients.length) {
      var sum = 0;
      html += '<div class="recipe-scroll"><table class="recipe recipe-edit"><thead><tr>' +
        '<th>Ингредиент</th><th class="num">Кол-во</th><th class="num">Сумма</th><th></th>' +
        '</tr></thead><tbody>';
      item.ingredients.forEach(function (ing, index) {
        var price = unitPrice(ing.id);
        var total = price == null ? null : price * (Number(ing.amount) || 0);
        if (total != null) { sum += total; }
        html += '<tr>' +
          '<td>' + resourceSelectHtml(ing.id, 'data-ing-pick="' + index + '"', ing.name) + '</td>' +
          '<td class="num"><input class="ing-qty" type="number" min="1" max="999999" step="1" inputmode="numeric" data-ing-qty="' + index + '" value="' + Math.max(1, Math.round(Number(ing.amount) || 1)) + '" aria-label="Количество"></td>' +
          '<td class="num">' + (total == null ? '—' : fmtT(total)) + '</td>' +
          '<td class="num"><button type="button" class="icon-btn" data-ing-del="' + index + '" title="Удалить ингредиент" aria-label="Удалить ингредиент">×</button></td>' +
          '</tr>';
      });
      html += '</tbody><tfoot><tr><td colspan="2">Итого за крафт</td><td class="num">' + fmtT(sum) + '</td><td></td></tr></tfoot></table></div>';
      if (costOf(item) == null) {
        html += '<p class="card-note card-note--warn">Часть ингредиентов не найдена в списке ресурсов — себестоимость взята из таблицы.</p>';
      }
    } else {
      html += '<p class="card-note card-note--warn">Рецепт пуст: себестоимость и обе цены — 0 ₮.</p>';
    }

    html += '<div class="recipe-add">' +
      resourceSelectHtml('', 'id="ingPick"', '') +
      '<input id="ingQty" type="number" min="1" max="999999" step="1" inputmode="numeric" value="1" aria-label="Количество нового ингредиента">' +
      '<button type="button" class="btn btn--ghost" id="btnIngAdd">+ Добавить</button>' +
      '</div>';

    if (changed) {
      html += '<div class="recipe-actions"><button type="button" class="btn btn--ghost" id="btnRecipeReset">Вернуть исходный рецепт</button></div>';
    }
    return html;
  }

  function bindRecipeEditor(item) {
    var card = document.getElementById('card');
    if (!card || !item || !item.craft) { return; }

    var reset = document.getElementById('btnRecipeReset');
    if (reset) {
      reset.addEventListener('click', function () {
        item.ingredients = clone(item.originIngredients || []);
        saveState();
        refreshCard();
        toast(item.name + ': рецепт возвращён к исходному');
      });
    }

    var addButton = document.getElementById('btnIngAdd');
    if (addButton) {
      addButton.addEventListener('click', function () {
        var pick = document.getElementById('ingPick');
        var qty = document.getElementById('ingQty');
        var id = pick ? pick.value : '';
        if (!id) { toast('Выберите ресурс для нового ингредиента'); return; }
        var amount = Math.max(1, Math.min(999999, Math.round(Number(qty && qty.value) || 1)));
        item.ingredients = item.ingredients || [];
        var existing = null;
        item.ingredients.forEach(function (ing) { if (ing.id === id) { existing = ing; } });
        if (existing) {
          existing.amount = Math.round(Number(existing.amount) || 0) + amount;
        } else {
          item.ingredients.push({ id: id, amount: amount });
        }
        saveState();
        refreshCard();
        var resource = resourceById[id];
        toast('В рецепт добавлено: ' + (resource ? resource.name : id) + ' ×' + amount);
      });
    }

    card.querySelectorAll('[data-ing-pick]').forEach(function (select) {
      select.addEventListener('change', function () {
        var index = Number(select.getAttribute('data-ing-pick'));
        var ing = item.ingredients[index];
        if (!ing) { return; }
        var id = select.value;
        if (!id || id === ing.id) { return; }
        var duplicate = -1;
        item.ingredients.forEach(function (other, otherIndex) {
          if (otherIndex !== index && other.id === id) { duplicate = otherIndex; }
        });
        if (duplicate >= 0) {
          item.ingredients[duplicate].amount = Math.round(Number(item.ingredients[duplicate].amount) || 0) +
            Math.round(Number(ing.amount) || 0);
          item.ingredients.splice(index, 1);
        } else {
          ing.id = id;
          delete ing.name;
        }
        saveState();
        refreshCard();
      });
    });

    card.querySelectorAll('[data-ing-qty]').forEach(function (input) {
      input.addEventListener('change', function () {
        var index = Number(input.getAttribute('data-ing-qty'));
        var ing = item.ingredients[index];
        if (!ing) { return; }
        var amount = Math.round(Number(String(input.value).replace(',', '.')) || 0);
        if (!isFinite(amount) || amount < 1) { amount = 1; }
        if (amount > 999999) { amount = 999999; }
        ing.amount = amount;
        saveState();
        refreshCard();
      });
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') { event.preventDefault(); input.blur(); }
      });
    });

    card.querySelectorAll('[data-ing-del]').forEach(function (button) {
      button.addEventListener('click', function () {
        var index = Number(button.getAttribute('data-ing-del'));
        var removed = item.ingredients.splice(index, 1)[0];
        saveState();
        refreshCard();
        if (removed) {
          var resource = resourceById[removed.id];
          toast('Из рецепта убрано: ' + (resource ? resource.name : (removed.name || removed.id)));
        }
      });
    });
  }

  /* =====================  Кастомные предметы  ===================== */

  function raritySelectHtml(selected) {
    return RARITY_NAMES.map(function (name) {
      return '<option value="' + escapeHtml(name) + '"' + (name === selected ? ' selected' : '') + '>' +
        escapeHtml(name) + '</option>';
    }).join('');
  }

  function uniqueShortname(base) {
    var id = base;
    var index = 2;
    while (itemById[id] || resourceById[id]) { id = base + '.' + index; index++; }
    return id;
  }

  function syncCategoryOptions() {
    var list = document.getElementById('catOptions');
    if (!list) { return; }
    var seen = {};
    var html = '';
    items.forEach(function (item) {
      var category = item.category || 'Прочее';
      if (seen[category]) { return; }
      seen[category] = 1;
      html += '<option value="' + escapeHtml(category) + '"></option>';
    });
    list.innerHTML = html;
  }

  function openNewItem() {
    var category = state.category === 'all' || state.category === 'resources' ? '' : state.category;
    state.newItem = { category: category };
    state.opened = null;
    renderAll();
    var name = document.getElementById('newName');
    if (name) { name.focus(); }
  }

  function renderNewItem(card) {
    var preset = state.newItem && state.newItem.category ? state.newItem.category : '';
    card.innerHTML = '<div class="card-head"><h2>Новый предмет</h2>' +
        '<div class="card-tags"><span class="tag tag--custom">кастомный</span></div></div>' +
      '<div class="custom-form">' +
        '<label class="form-row"><span>Название</span><input id="newName" autocomplete="off" placeholder="Например, Самодельный дробовик"></label>' +
        '<label class="form-row"><span>Shortname</span><input id="newShort" autocomplete="off" placeholder="custom.название"></label>' +
        '<label class="form-row"><span>Категория</span><input id="newCategory" list="catOptions" value="' + escapeHtml(preset) + '" placeholder="Кастомные"></label>' +
        '<label class="form-row"><span>Редкость</span><select id="newRarity">' + raritySelectHtml('Обычный') + '</select></label>' +
        '<label class="form-row"><span>Стак</span><input id="newStack" type="number" min="1" step="1" value="1"></label>' +
        '<label class="form-row"><span>Макс. продаж/день</span><input id="newMax" type="number" min="0" step="1" value="0"></label>' +
        '<label class="form-row form-row--check"><input type="checkbox" id="newDlc"><span>DLC-предмет</span></label>' +
      '</div>' +
      '<p class="card-note">После создания откроется карточка предмета — добавьте в неё ингредиенты рецепта.</p>' +
      '<div class="recipe-actions">' +
        '<button type="button" class="btn" id="btnCreateItem">Создать</button>' +
        '<button type="button" class="btn btn--ghost" id="btnCancelNew">Отмена</button>' +
      '</div>';

    document.getElementById('btnCancelNew').addEventListener('click', function () {
      state.newItem = null;
      renderAll();
    });
    document.getElementById('btnCreateItem').addEventListener('click', createCustomItem);
    document.getElementById('newName').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); createCustomItem(); }
    });
  }

  function createCustomItem() {
    var name = String(document.getElementById('newName').value || '').trim();
    if (!name) { toast('Введите название предмета'); return; }
    var short = String(document.getElementById('newShort').value || '').trim();
    if (!short) { short = 'custom.' + slug(name); }
    short = uniqueShortname(short);
    var category = String(document.getElementById('newCategory').value || '').trim() || 'Кастомные';
    var item = {
      id: short,
      name: name,
      category: category,
      rarity: document.getElementById('newRarity').value,
      dlc: document.getElementById('newDlc').checked,
      stack: Math.max(1, Math.round(Number(document.getElementById('newStack').value) || 1)),
      maxPerDay: Math.max(0, Math.round(Number(document.getElementById('newMax').value) || 0)),
      craft: true,
      custom: true,
      ingredients: [],
      originIngredients: []
    };
    items.push(item);
    rebuildIndexes();
    annotateCatalog();
    saveState();
    state.newItem = null;
    state.opened = 'item:' + item.id;
    renderAll();
    toast('Создан предмет «' + name + '» — добавьте ингредиенты');
  }

  function customItemEditorHtml(item) {
    return '<h3 class="card-sub">Параметры предмета</h3>' +
      '<div class="custom-form">' +
        '<label class="form-row"><span>Название</span><input id="editName" value="' + escapeHtml(item.name) + '"></label>' +
        '<label class="form-row"><span>Shortname</span><input id="editShort" value="' + escapeHtml(item.id) + '"></label>' +
        '<label class="form-row"><span>Категория</span><input id="editCategory" list="catOptions" value="' + escapeHtml(item.category || '') + '"></label>' +
        '<label class="form-row"><span>Редкость</span><select id="editRarity">' + raritySelectHtml(item.rarity) + '</select></label>' +
        '<label class="form-row"><span>Стак</span><input id="editStack" type="number" min="1" step="1" value="' + (Number(item.stack) || 1) + '"></label>' +
        '<label class="form-row"><span>Макс. продаж/день</span><input id="editMax" type="number" min="0" step="1" value="' + (Number(item.maxPerDay) || 0) + '"></label>' +
        '<label class="form-row form-row--check"><input type="checkbox" id="editDlc"' + (item.dlc ? ' checked' : '') + '><span>DLC-предмет</span></label>' +
      '</div>' +
      '<div class="recipe-actions">' +
        '<button type="button" class="btn" id="btnSaveItem">Сохранить</button>' +
        '<button type="button" class="btn btn--danger" id="btnDeleteItem">Удалить предмет</button>' +
      '</div>';
  }

  function bindCustomItemEditor(item) {
    var save = document.getElementById('btnSaveItem');
    if (save) {
      save.addEventListener('click', function () {
        var name = String(document.getElementById('editName').value || '').trim();
        if (!name) { toast('Название не может быть пустым'); return; }
        var short = String(document.getElementById('editShort').value || '').trim();
        if (!short) { short = 'custom.' + slug(name); }
        if (short !== item.id && itemById[short] && itemById[short] !== item) {
          short = uniqueShortname(short);
          toast('Shortname занят — взят ' + short);
        }
        item.id = short;
        item.name = name;
        item.category = String(document.getElementById('editCategory').value || '').trim() || 'Кастомные';
        item.rarity = document.getElementById('editRarity').value;
        item.stack = Math.max(1, Math.round(Number(document.getElementById('editStack').value) || 1));
        item.maxPerDay = Math.max(0, Math.round(Number(document.getElementById('editMax').value) || 0));
        item.dlc = document.getElementById('editDlc').checked;
        rebuildIndexes();
        annotateCatalog();
        saveState();
        state.opened = 'item:' + item.id;
        renderAll();
        toast('Сохранено: ' + item.name);
      });
    }

    var remove = document.getElementById('btnDeleteItem');
    if (remove) {
      remove.addEventListener('click', function () {
        if (!window.confirm('Удалить предмет «' + item.name + '»? Рецепт тоже будет удалён.')) { return; }
        items = items.filter(function (candidate) { return candidate !== item; });
        rebuildIndexes();
        annotateCatalog();
        state.opened = null;
        saveState();
        renderAll();
        toast('Предмет удалён');
      });
    }
  }

  function refreshCard() {
    var card = document.getElementById('card');
    var top = card ? card.scrollTop : 0;
    renderAll();
    if (card) { card.scrollTop = top; }
  }

  function renderAll() {
    syncCategoryOptions();
    renderCategories();
    if (state.view === 'table') {
      document.getElementById('list').hidden = true;
      document.getElementById('empty').hidden = true;
      document.getElementById('tableWrap').hidden = false;
      renderTable();
    } else {
      document.getElementById('list').hidden = false;
      document.getElementById('tableWrap').hidden = true;
      renderList();
    }
    renderCard();
    syncGameResources();
  }

  /* =====================  Настройки  ===================== */

  function syncSettingsInputs() {
    setValue('setBuy', settings.buyMult);
    setValue('setSell', settings.sellMult);
    setValue('setDlc', settings.dlcMult);
    setValue('setRate', settings.rubRate);
    setValue('setScrap', settings.scrapPrice);

    var grid = document.getElementById('rarityGrid');
    if (grid) {
      var html = '';
      RARITY_NAMES.forEach(function (name) {
        html += '<label class="rarity-row"><span>' + name + '</span>' +
          '<input type="number" data-rarity="' + name + '" min="0.1" step="0.1" inputmode="decimal" value="' +
          String(Number(rarityCoef(name))) + '"></label>';
      });
      grid.innerHTML = html;
      grid.querySelectorAll('[data-rarity]').forEach(function (input) {
        input.addEventListener('change', function () {
          var name = input.getAttribute('data-rarity');
          settings.rarity[name] = Math.max(0.1, Number(input.value) || 1);
          saveState();
          renderAll();
        });
      });
    }
  }

  var RARITY_NAMES = ['Обычный', 'Необычный', 'Редкий', 'Эпический', 'Легендарный'];

  function setValue(id, value) {
    var el = document.getElementById(id);
    if (el) { el.value = value; }
  }

  function openSettings(open) {
    document.getElementById('settings').hidden = !open;
    document.getElementById('overlay').hidden = !open;
    document.body.classList.toggle('no-scroll', open);
    if (open) { syncSettingsInputs(); }
  }

  /* =====================  Хранилище  ===================== */

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        settings: settings,
        resources: resources,
        items: items,
        sourceNote: sourceNote
      }));
    } catch (e) { /* переполнение — не критично */ }
  }

  function loadState() {
    var raw;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    if (!raw) { rebuildIndexes(); return; }
    try {
      var data = JSON.parse(raw);
      if (data && Array.isArray(data.resources) && Array.isArray(data.items)) {
        settings = mergeSettings(data.settings);
        resources = data.resources;
        items = data.items;
        sourceNote = data.sourceNote || 'сохранённые данные';
      }
    } catch (e) { /* битые данные — остаёмся на демо */ }
    rebuildIndexes();
  }

  function mergeSettings(input) {
    var base = clone(DATA.settings);
    if (!input || typeof input !== 'object') { return base; }
    Object.keys(base).forEach(function (key) {
      if (key === 'rarity') {
        if (input.rarity && typeof input.rarity === 'object') {
          RARITY_NAMES.forEach(function (name) {
            var value = Number(input.rarity[name]);
            if (isFinite(value) && value > 0) { base.rarity[name] = value; }
          });
        }
      } else if (isFinite(Number(input[key])) && Number(input[key]) > 0) {
        base[key] = Number(input[key]);
      }
    });
    return base;
  }

  /* =====================  Экспорт  ===================== */

  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportJson() {
    download('rust-economy.json', JSON.stringify({
      app: 'rust-economy',
      version: 4,
      exportedAt: new Date().toISOString(),
      settings: settings,
      resources: resources,
      items: items
    }, null, 2), 'application/json');
    toast('Сохранено: ' + resources.length + ' ресурсов, ' + items.length + ' предметов');
  }

  function exportCsv() {
    var lines = ['Shortname;Название;Категория;Редкость;DLC;Стак;Себестоимость;Покупка;Продажа;Макс/день'];
    visibleEntries().forEach(function (entry) {
      var item = entry.data;
      var cost = entryCost(entry);
      lines.push([
        item.id || '',
        item.name,
        item.category || '',
        item.rarity || '',
        item.dlc ? 'Да' : 'Нет',
        item.stack || '',
        Math.round(cost * 100) / 100,
        Math.round(entryBuy(entry) * 100) / 100,
        Math.round(entrySell(entry) * 100) / 100,
        item.maxPerDay || ''
      ].map(function (cell) { return String(cell).replace(/;/g, ','); }).join(';'));
    });
    download('rust-economy.csv', '\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8');
    toast('CSV готов');
  }

  /* =====================  Экспорт в .xlsx  ===================== */

  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // Простейший zip без сжатия (method 0): Excel открывает такой файл нормально.
  function zipStore(files) {
    var encoder = new TextEncoder();
    var chunks = [];
    var central = [];
    var offset = 0;

    files.forEach(function (file) {
      var nameBytes = encoder.encode(file.name);
      var data = file.data;
      var crc = crc32(data);

      var local = new Uint8Array(30 + nameBytes.length);
      var lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x21, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      local.set(nameBytes, 30);

      var cen = new Uint8Array(46 + nameBytes.length);
      var cv = new DataView(cen.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x21, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint32(42, offset, true);
      cen.set(nameBytes, 46);

      chunks.push(local, data);
      central.push(cen);
      offset += local.length + data.length;
    });

    var centralSize = central.reduce(function (sum, part) { return sum + part.length; }, 0);
    var end = new Uint8Array(22);
    var ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    return new Blob(chunks.concat(central, [end]), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  function xmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }

  function columnName(index) {
    var name = '';
    index += 1;
    while (index > 0) {
      var rest = (index - 1) % 26;
      name = String.fromCharCode(65 + rest) + name;
      index = Math.floor((index - 1) / 26);
    }
    return name;
  }

  function sheetXml(rows) {
    var out = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
    rows.forEach(function (row, r) {
      out += '<row r="' + (r + 1) + '">';
      row.forEach(function (value, c) {
        if (value === '' || value == null) { return; }
        var ref = columnName(c) + (r + 1);
        if (typeof value === 'number' && isFinite(value)) {
          out += '<c r="' + ref + '"><v>' + value + '</v></c>';
        } else {
          out += '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(value) + '</t></is></c>';
        }
      });
      out += '</row>';
    });
    return out + '</sheetData></worksheet>';
  }

  function round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function buildWorkbookRows() {
    var settingsRows = [['⚙️ НАСТРОЙКИ ЭКОНОМИКИ — RUST ECONOMY PLUGIN'], ['КОЭФФИЦИЕНТЫ РЕДКОСТИ (влияют на итоговую цену)']];
    RARITY_NAMES.forEach(function (name) {
      settingsRows.push([name, 'Коэф. редкости ' + name, Number(settings.rarity[name]) || 1]);
    });
    settingsRows.push(['ОБЩИЕ МНОЖИТЕЛИ ЭКОНОМИКИ']);
    settingsRows.push(['Цена покупки у магазина', 'buy_shop_mult', Number(settings.buyMult) || 1]);
    settingsRows.push(['Цена продажи магазину', 'sell_to_shop_mult', Number(settings.sellMult) || 1]);
    settingsRows.push(['Профит верстак Т2', 'wb2_mult', Number(settings.wb2Mult) || 1]);
    settingsRows.push(['Профит верстак Т3', 'wb3_mult', Number(settings.wb3Mult) || 1]);
    settingsRows.push(['Множитель DLC предметов', 'dlc_mult', Number(settings.dlcMult) || 1]);
    settingsRows.push(['Курс: тугриков за 1 ₽', 'rub_rate', Number(settings.rubRate) || 1]);
    settingsRows.push(['Цена 1 скрапа в тугриках', 'scrap_price', Number(settings.scrapPrice) || 1]);

    var resourceRows = [['#', 'Ресурс', 'Категория', 'Редкость', 'Базовая цена (₮)', '📦 Стак', 'Цвет редкости', 'Примечание', '📊 Макс. продаж/день', '🔑 Shortname']];
    resources.forEach(function (resource, index) {
      resourceRows.push([
        index + 1,
        resource.name,
        resource.category || '',
        resource.rarity || '',
        Number(resource.price) || 0,
        Number(resource.stack) || 0,
        resource.rarity || '',
        '',
        Number(resource.maxPerDay) || 0,
        resource.id || ''
      ]);
    });

    var ingredientColumns = 5;
    items.forEach(function (item) {
      var count = item.craft && item.ingredients ? item.ingredients.length : 0;
      if (count > ingredientColumns) { ingredientColumns = count; }
    });
    var craftHeader = ['#', 'Категория', 'Название предмета', 'Редкость', 'DLC'];
    for (var column = 1; column <= ingredientColumns; column++) {
      craftHeader.push('Ингредиент ' + column, 'Кол-во ' + column);
    }
    craftHeader.push('📦 Стак', '💲 Себестоимость (₮)', '🛒 Цена покупки у магазина (₮)',
      '💰 Цена продажи магазину (₮)', '📊 Макс. продаж/день', '🔑 Shortname', 'Кастомный');
    var craftRows = [craftHeader];
    var lootHeader = ['#', 'Категория', 'Название предмета', 'Редкость', 'DLC', '📦 Стак', 'Цвет редкости',
      'Где найти', '🛒 Цена покупки у магазина (₮)', '💰 Цена продажи магазину (₮)', '🔑 Shortname'];
    var lootRows = [lootHeader];

    items.forEach(function (item) {
      var entry = { kind: 'item', id: item.id, data: item };
      var cost = entryCost(entry);
      if (item.craft) {
        var row = [craftRows.length, item.category || '', item.name, item.rarity || '', item.dlc ? 'Да' : 'Нет'];
        var ingredients = item.ingredients || [];
        for (var i = 0; i < ingredientColumns; i++) {
          var ing = ingredients[i];
          var resource = ing && ing.id ? resourceById[ing.id] : null;
          row.push(ing ? (resource ? resource.name : (ing.name || '')) : '');
          row.push(ing ? Number(ing.amount) || 0 : '');
        }
        row.push(Number(item.stack) || 0);
        row.push(round2(cost));
        row.push(round2(entryBuy(entry)));
        row.push(round2(entrySell(entry)));
        row.push(Number(item.maxPerDay) || 0);
        row.push(item.id || '');
        row.push(item.custom ? 'Да' : 'Нет');
        craftRows.push(row);
      } else {
        lootRows.push([
          lootRows.length,
          item.category || '',
          item.name,
          item.rarity || '',
          item.dlc ? 'Да' : 'Нет',
          Number(item.stack) || 0,
          item.rarity || '',
          item.source || '',
          round2(entryBuy(entry)),
          round2(entrySell(entry)),
          item.id || ''
        ]);
      }
    });

    return [
      { name: '⚙️ Настройки', rows: settingsRows },
      { name: '📦 Ресурсы', rows: resourceRows },
      { name: '🔨 Крафтовые предметы', rows: craftRows },
      { name: '🎁 Некрафтовые предметы', rows: lootRows }
    ];
  }

  function buildXlsxBlob() {
    var sheets = buildWorkbookRows();
    var encoder = new TextEncoder();
    var files = [];

    var overrides = '';
    var sheetTags = '';
    var sheetRels = '';
    sheets.forEach(function (sheet, index) {
      overrides += '<Override PartName="/xl/worksheets/sheet' + (index + 1) + '.xml" ' +
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      sheetTags += '<sheet name="' + xmlEscape(sheet.name) + '" sheetId="' + (index + 1) + '" r:id="rId' + (index + 1) + '"/>';
      sheetRels += '<Relationship Id="rId' + (index + 1) + '" ' +
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
        'Target="worksheets/sheet' + (index + 1) + '.xml"/>';
      files.push({
        name: 'xl/worksheets/sheet' + (index + 1) + '.xml',
        data: encoder.encode(sheetXml(sheet.rows))
      });
    });

    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      overrides + '</Types>';

    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';

    var workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheetTags + '</sheets></workbook>';

    var workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheetRels + '</Relationships>';

    files.unshift({ name: '[Content_Types].xml', data: encoder.encode(contentTypes) });
    files.unshift({ name: '_rels/.rels', data: encoder.encode(rootRels) });
    files.splice(2, 0, { name: 'xl/workbook.xml', data: encoder.encode(workbook) });
    files.splice(3, 0, { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRels) });

    return zipStore(files);
  }

  function exportXlsx() {
    var blob = buildXlsxBlob();
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'rust-economy.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast('Таблица .xlsx сохранена: ' + resources.length + ' ресурсов, ' + items.length + ' предметов');
  }

  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        if (!data || !Array.isArray(data.resources) || !Array.isArray(data.items)) {
          throw new Error('bad');
        }
        settings = mergeSettings(data.settings);
        resources = data.resources;
        items = data.items;
        sourceNote = 'JSON';
        rebuildIndexes();
        syncSettingsInputs();
        renderAll();
        saveState();
        toast('Импорт JSON: ' + items.length + ' предметов');
      } catch (e) {
        toast('Не удалось прочитать JSON');
      }
    };
    reader.readAsText(file);
  }

  /* =====================  XLSX: разбор zip и XML  ===================== */

  function colIndexFromRef(ref) {
    var letters = String(ref || '').replace(/[^A-Za-z]/g, '').toUpperCase();
    var n = 0;
    for (var i = 0; i < letters.length; i++) { n = n * 26 + (letters.charCodeAt(i) - 64); }
    return n - 1;
  }

  function unzipBuffer(buffer) {
    var dv = new DataView(buffer);
    var eocd = -1;
    var limit = Math.max(0, dv.byteLength - 22 - 65535);
    for (var i = dv.byteLength - 22; i >= limit; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) { return Promise.reject(new Error('Это не .xlsx')); }
    var count = dv.getUint16(eocd + 10, true);
    var p = dv.getUint32(eocd + 16, true);
    var decoder = new TextDecoder('utf-8');
    var entries = [];
    for (var n = 0; n < count; n++) {
      if (p + 46 > dv.byteLength || dv.getUint32(p, true) !== 0x02014b50) { break; }
      var nameLen = dv.getUint16(p + 28, true);
      var extraLen = dv.getUint16(p + 30, true);
      var commentLen = dv.getUint16(p + 32, true);
      entries.push({
        name: decoder.decode(new Uint8Array(buffer, p + 46, nameLen)),
        method: dv.getUint16(p + 10, true),
        compSize: dv.getUint32(p + 20, true),
        localOff: dv.getUint32(p + 42, true)
      });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return Promise.all(entries.map(function (entry) {
      return readZipEntry(buffer, entry, decoder).then(function (text) {
        return { name: entry.name, text: text };
      });
    }));
  }

  function readZipEntry(buffer, entry, decoder) {
    if (!entry.compSize) { return Promise.resolve(''); }
    var dv = new DataView(buffer);
    var start = entry.localOff + 30 + dv.getUint16(entry.localOff + 26, true) + dv.getUint16(entry.localOff + 28, true);
    var bytes = new Uint8Array(buffer, start, entry.compSize);
    if (entry.method === 0) { return Promise.resolve(decoder.decode(bytes)); }
    if (entry.method !== 8) { return Promise.reject(new Error('неизвестное сжатие')); }
    if (typeof DecompressionStream === 'undefined') {
      return Promise.reject(new Error('браузер не умеет распаковывать xlsx'));
    }
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).text();
  }

  function parseXml(text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (!doc || doc.getElementsByTagName('parsererror').length) { throw new Error('битый XML в файле'); }
    return doc;
  }

  function parseSharedStrings(text) {
    var out = [];
    var nodes = parseXml(text).getElementsByTagNameNS('*', 'si');
    for (var i = 0; i < nodes.length; i++) {
      var parts = nodes[i].getElementsByTagNameNS('*', 't');
      var value = '';
      for (var j = 0; j < parts.length; j++) { value += parts[j].textContent || ''; }
      out.push(value);
    }
    return out;
  }

  function parseSheetRows(text, shared) {
    var rows = [];
    var rowNodes = parseXml(text).getElementsByTagNameNS('*', 'row');
    for (var i = 0; i < rowNodes.length; i++) {
      var cells = rowNodes[i].getElementsByTagNameNS('*', 'c');
      var row = [];
      for (var j = 0; j < cells.length; j++) {
        var cell = cells[j];
        var col = cell.getAttribute('r') ? colIndexFromRef(cell.getAttribute('r')) : row.length;
        if (col < 0) { col = row.length; }
        var value = '';
        var type = cell.getAttribute('t');
        if (type === 'inlineStr') {
          var inline = cell.getElementsByTagNameNS('*', 't');
          for (var k = 0; k < inline.length; k++) { value += inline[k].textContent || ''; }
        } else {
          var v = cell.getElementsByTagNameNS('*', 'v')[0];
          var raw = v ? (v.textContent || '') : '';
          value = type === 's' ? (shared[Number(raw)] || '') : raw;
        }
        row[col] = value;
      }
      rows.push(row);
    }
    return rows;
  }

  /* =====================  XLSX: таблица → данные  ===================== */

  function norm(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9.\/ ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseNum(value) {
    if (typeof value === 'number') { return value; }
    var text = String(value == null ? '' : value).replace(/\s/g, '').replace(',', '.');
    var n = parseFloat(text);
    return isFinite(n) ? n : 0;
  }

  function slug(text) {
    var map = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
    var result = String(text || '').toLowerCase().split('').map(function (ch) {
      return map[ch] != null ? map[ch] : ch;
    }).join('');
    result = result.replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
    return result || 'item';
  }

  function headerColumns(row) {
    var map = {};
    for (var i = 0; i < row.length; i++) {
      var key = norm(row[i]);
      if (key && map[key] == null) { map[key] = i; }
    }
    return map;
  }

  function findCol(map, test) {
    var keys = Object.keys(map);
    for (var i = 0; i < keys.length; i++) {
      if (test(keys[i])) { return map[keys[i]]; }
    }
    return -1;
  }

  function readSheetSettings(rows) {
    var patch = {};
    rows.forEach(function (row) {
      row.forEach(function (cell, index) {
        var key = norm(cell);
        if (key.indexOf('коэф редкости') === 0) {
          var name = key.replace('коэф редкости', '').trim();
          RARITY_NAMES.forEach(function (rarity) {
            if (norm(rarity) === name) {
              var value = parseNum(row[index + 1]);
              if (value > 0) { patch.rarity = patch.rarity || {}; patch.rarity[rarity] = value; }
            }
          });
        }
        if (key === 'buy shop mult' || key === 'sell to shop mult' || key === 'dlc mult' || key === 'wb2 mult' || key === 'wb3 mult' || key === 'rub rate' || key === 'scrap price') {
          var number = parseNum(row[index + 1]);
          if (number > 0) {
            var field = {
              'buy shop mult': 'buyMult',
              'sell to shop mult': 'sellMult',
              'dlc mult': 'dlcMult',
              'wb2 mult': 'wb2Mult',
              'wb3 mult': 'wb3Mult',
              'rub rate': 'rubRate',
              'scrap price': 'scrapPrice'
            }[key];
            patch[field] = number;
          }
        }
      });
    });
    return patch;
  }

  function readResourcesSheet(rows, start) {
    var map = headerColumns(rows[start]);
    var col = {
      name: findCol(map, function (k) { return k === 'ресурс'; }),
      category: findCol(map, function (k) { return k === 'категория'; }),
      rarity: findCol(map, function (k) { return k === 'редкость'; }),
      price: findCol(map, function (k) { return k.indexOf('базовая цена') !== -1; }),
      stack: findCol(map, function (k) { return k.indexOf('стак') !== -1; }),
      maxPerDay: findCol(map, function (k) { return k.indexOf('макс') !== -1; }),
      id: findCol(map, function (k) { return k.indexOf('shortname') !== -1; })
    };
    if (col.name < 0 || col.price < 0) { return []; }
    var list = [];
    for (var i = start + 1; i < rows.length; i++) {
      var row = rows[i];
      var name = String(row[col.name] == null ? '' : row[col.name]).trim();
      if (!name) { continue; }
      var rawId = col.id >= 0 ? String(row[col.id] || '').trim() : '';
      list.push({
        id: rawId || slug(name),
        name: name,
        category: col.category >= 0 ? String(row[col.category] || '').trim() : '',
        rarity: col.rarity >= 0 ? String(row[col.rarity] || '').trim() : '',
        price: parseNum(row[col.price]),
        stack: col.stack >= 0 ? parseNum(row[col.stack]) : 0,
        maxPerDay: col.maxPerDay >= 0 ? parseNum(row[col.maxPerDay]) : 0
      });
    }
    return list;
  }

  function readCraftSheet(rows, start, resourceByName) {
    var map = headerColumns(rows[start]);
    var col = {
      category: findCol(map, function (k) { return k === 'категория'; }),
      name: findCol(map, function (k) { return k.indexOf('название предмета') !== -1; }),
      rarity: findCol(map, function (k) { return k === 'редкость'; }),
      dlc: findCol(map, function (k) { return k === 'dlc'; }),
      stack: findCol(map, function (k) { return k.indexOf('стак') !== -1; }),
      cost: findCol(map, function (k) { return k.indexOf('себестоимость') !== -1; }),
      maxPerDay: findCol(map, function (k) { return k.indexOf('макс') !== -1; }),
      id: findCol(map, function (k) { return k.indexOf('shortname') !== -1; }),
      custom: findCol(map, function (k) { return k.indexOf('кастомн') !== -1; }),
      ingredient: {},
      amount: {}
    };
    Object.keys(map).forEach(function (key) {
      var ing = /^ингредиент (\d+)$/.exec(key);
      if (ing) { col.ingredient[Number(ing[1])] = map[key]; }
      var amount = /^кол во (\d+)$/.exec(key);
      if (amount) { col.amount[Number(amount[1])] = map[key]; }
    });
    if (col.name < 0) { return []; }

    var list = [];
    for (var i = start + 1; i < rows.length; i++) {
      var row = rows[i];
      var name = String(row[col.name] == null ? '' : row[col.name]).trim();
      if (!name) { continue; }
      var ingredients = [];
      var unresolved = 0;
      Object.keys(col.ingredient).forEach(function (index) {
        var ingName = String(row[col.ingredient[index]] == null ? '' : row[col.ingredient[index]]).trim();
        var amount = parseNum(row[col.amount[index]]);
        if (!ingName || amount <= 0) { return; }
        var resource = resourceByName[norm(ingName)];
        if (resource) { ingredients.push({ id: resource.id, amount: amount }); }
        else { ingredients.push({ id: null, name: ingName, amount: amount }); unresolved++; }
      });
      var rawId = col.id >= 0 ? String(row[col.id] || '').trim() : '';
      list.push({
        id: rawId || slug(name),
        name: name,
        category: col.category >= 0 ? String(row[col.category] || '').trim() : '',
        rarity: col.rarity >= 0 ? String(row[col.rarity] || '').trim() : '',
        dlc: col.dlc >= 0 ? /да|yes|true/i.test(String(row[col.dlc] || '')) : false,
        stack: col.stack >= 0 ? parseNum(row[col.stack]) : 0,
        maxPerDay: col.maxPerDay >= 0 ? parseNum(row[col.maxPerDay]) : 0,
        craft: true,
        custom: col.custom >= 0 ? /да|yes|true/i.test(String(row[col.custom] || '')) : false,
        ingredients: ingredients,
        sheetCost: col.cost >= 0 ? parseNum(row[col.cost]) : 0,
        unresolved: unresolved
      });
    }
    return list;
  }

  function readLootSheet(rows, start) {
    var map = headerColumns(rows[start]);
    var col = {
      category: findCol(map, function (k) { return k === 'категория'; }),
      name: findCol(map, function (k) { return k.indexOf('название') !== -1; }),
      rarity: findCol(map, function (k) { return k === 'редкость'; }),
      dlc: findCol(map, function (k) { return k === 'dlc'; }),
      stack: findCol(map, function (k) { return k.indexOf('стак') !== -1; }),
      buy: findCol(map, function (k) { return k.indexOf('цена покупки') !== -1; }),
      sell: findCol(map, function (k) { return k.indexOf('цена продажи') !== -1; }),
      source: findCol(map, function (k) { return k.indexOf('где найти') !== -1; }),
      id: findCol(map, function (k) { return k.indexOf('shortname') !== -1; })
    };
    if (col.name < 0) { return []; }
    var list = [];
    for (var i = start + 1; i < rows.length; i++) {
      var row = rows[i];
      var name = String(row[col.name] == null ? '' : row[col.name]).trim();
      if (!name) { continue; }
      var rawId = col.id >= 0 ? String(row[col.id] || '').trim() : '';
      list.push({
        id: rawId || slug(name),
        name: name,
        category: col.category >= 0 ? String(row[col.category] || '').trim() : '',
        rarity: col.rarity >= 0 ? String(row[col.rarity] || '').trim() : '',
        dlc: col.dlc >= 0 ? /да|yes|true/i.test(String(row[col.dlc] || '')) : false,
        stack: col.stack >= 0 ? parseNum(row[col.stack]) : 0,
        maxPerDay: 0,
        craft: false,
        buy: col.buy >= 0 ? parseNum(row[col.buy]) : 0,
        sell: col.sell >= 0 ? parseNum(row[col.sell]) : 0,
        source: col.source >= 0 ? String(row[col.source] || '').trim() : ''
      });
    }
    return list;
  }

  function uniqueIds(list) {
    var used = {};
    list.forEach(function (entry) {
      var base = entry.id;
      var id = base;
      var index = 2;
      while (used[id] && used[id] !== entry) { id = base + '.' + index; index++; }
      used[id] = entry;
      entry.id = id;
    });
    return list;
  }

  function importXlsx(file) {
    var reader = new FileReader();
    reader.onload = function () {
      unzipBuffer(reader.result).then(function (files) {
        var byName = {};
        files.forEach(function (entry) { byName[entry.name] = entry.text; });
        var shared = byName['xl/sharedStrings.xml'] ? parseSharedStrings(byName['xl/sharedStrings.xml']) : [];
        var sheets = Object.keys(byName).filter(function (name) {
          return /^xl\/worksheets\/sheet\d+\.xml$/.test(name);
        }).sort();
        if (!sheets.length) { throw new Error('в файле нет листов'); }

        var found = { resources: [], craft: [], loot: [] };
        var patch = {};
        sheets.forEach(function (name) {
          var rows = parseSheetRows(byName[name], shared);
          var headerIndex = -1;
          for (var i = 0; i < rows.length; i++) {
            if (headerColumns(rows[i])['shortname'] != null) { headerIndex = i; break; }
          }
          if (headerIndex < 0) {
            var localPatch = readSheetSettings(rows);
            if (localPatch.rarity || Object.keys(localPatch).length) {
              Object.keys(localPatch).forEach(function (key) {
                if (key === 'rarity') {
                  patch.rarity = patch.rarity || {};
                  Object.keys(localPatch.rarity).forEach(function (r) { patch.rarity[r] = localPatch.rarity[r]; });
                } else {
                  patch[key] = localPatch[key];
                }
              });
            }
            return;
          }
          var map = headerColumns(rows[headerIndex]);
          if (map['базовая цена'] != null || findCol(map, function (k) { return k.indexOf('базовая цена') !== -1; }) >= 0) {
            found.resources = found.resources.concat(readResourcesSheet(rows, headerIndex));
          } else if (findCol(map, function (k) { return k.indexOf('себестоимость') !== -1; }) >= 0) {
            found.craftHeaders = found.craftHeaders || [];
            found.craftHeaders.push({ rows: rows, index: headerIndex });
          } else if (findCol(map, function (k) { return k.indexOf('цена покупки') !== -1; }) >= 0) {
            found.loot = found.loot.concat(readLootSheet(rows, headerIndex));
          }
        });

        if (!found.resources.length && !(found.craftHeaders || []).length) {
          throw new Error('не нашёл листы «Ресурсы» и «Крафтовые предметы»');
        }

        // Уникальные id ресурсов и поиск по названию для ингредиентов.
        uniqueIds(found.resources);
        var resourceByName = {};
        found.resources.forEach(function (resource) { resourceByName[norm(resource.name)] = resource; });

        var craft = [];
        (found.craftHeaders || []).forEach(function (block) {
          craft = craft.concat(readCraftSheet(block.rows, block.index, resourceByName));
        });
        uniqueIds(craft);
        var loot = found.loot.length ? uniqueIds(found.loot) : [];

        settings = mergeSettings(Object.assign({}, settings, patch));

        if (found.resources.length) { resources = found.resources; }
        items = craft.concat(loot);
        sourceNote = 'файл ' + (file.name || 'Excel');
        rebuildIndexes();
        resetOrigins();
        annotateCatalog();
        syncSettingsInputs();
        renderAll();
        saveState();

        var report = document.getElementById('importReport');
        if (report) {
          report.hidden = false;
          var unresolved = craft.filter(function (item) { return item.unresolved > 0; }).length;
          var missing = itemsWithState('missing');
          var unknown = itemsWithState('unknown');
          var names = missing.slice(0, 12).map(function (item) { return escapeHtml(item.name); }).join(', ');
          report.innerHTML = '<strong>Импорт таблицы:</strong> ресурсов ' + resources.length +
            ', крафтовых ' + craft.length + ', некрафтовых ' + loot.length + '.' +
            (unresolved ? '<br>Рецептов с неизвестными ингредиентами: ' + unresolved +
              ' — у них себестоимость взята из таблицы.' : '') +
            (missing.length
              ? '<br>Убрано как несуществующие (shortname нет в Rust): ' + missing.length + ' — ' + names +
                (missing.length > 12 ? ' и ещё ' + (missing.length - 12) : '') + '.'
              : '<br>Все shortname найдены в списке предметов Rust.') +
            (unknown.length
              ? '<br>Без shortname — проверить нельзя: ' + unknown.length + ' (помечены в карточке).'
              : '');
        }
        toast('Загружено: ' + resources.length + ' ресурсов, ' + items.length + ' предметов');
      }).catch(function (error) {
        toast('Не удалось прочитать файл: ' + (error && error.message ? error.message : 'ошибка'));
      });
    };
    reader.onerror = function () { toast('Не удалось прочитать файл'); };
    reader.readAsArrayBuffer(file);
  }

  /* =====================  Прочее  ===================== */

  var toastTimer = null;
  function toast(text) {
    var el = document.getElementById('toast');
    if (!el) { return; }
    el.textContent = text;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 3200);
  }

  function bindEvents() {
    document.getElementById('search').addEventListener('input', function (e) {
      state.search = e.target.value;
      renderAll();
    });

    document.getElementById('sort').addEventListener('change', function (e) {
      state.sort = e.target.value;
      renderAll();
    });

    document.getElementById('craftOnly').addEventListener('change', function (e) {
      state.craftOnly = e.target.checked;
      renderAll();
    });

    document.getElementById('onlyReal').addEventListener('change', function (e) {
      state.onlyReal = e.target.checked;
      renderAll();
    });

    document.getElementById('cats').addEventListener('click', function (e) {
      var button = e.target.closest('[data-cat]');
      if (!button) { return; }
      state.category = button.getAttribute('data-cat');
      renderAll();
    });

    document.getElementById('list').addEventListener('click', function (e) {
      var button = e.target.closest('[data-key]');
      if (!button) { return; }
      state.opened = button.getAttribute('data-key');
      state.newItem = null;
      renderAll();
      if (window.innerWidth <= 900) {
        document.body.classList.add('no-scroll');
        document.getElementById('card').scrollTop = 0;
      }
    });

    document.getElementById('viewSwitch').addEventListener('click', function (e) {
      var button = e.target.closest('[data-view]');
      if (!button) { return; }
      state.view = button.getAttribute('data-view');
      Array.prototype.forEach.call(this.querySelectorAll('[data-view]'), function (btn) {
        var active = btn === button;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      renderAll();
    });

    document.getElementById('btnAddGameRes').addEventListener('click', addGameResources);
    document.getElementById('btnNewItem').addEventListener('click', openNewItem);

    document.getElementById('btnSettings').addEventListener('click', function () { openSettings(true); });
    document.getElementById('btnCloseSettings').addEventListener('click', function () { openSettings(false); });
    document.getElementById('overlay').addEventListener('click', function () { openSettings(false); });

    bindSetting('setBuy', 'buyMult');
    bindSetting('setSell', 'sellMult');
    bindSetting('setDlc', 'dlcMult');
    bindSetting('setRate', 'rubRate');
    bindSetting('setScrap', 'scrapPrice');

    document.getElementById('btnCsv').addEventListener('click', exportCsv);
    document.getElementById('btnXlsx').addEventListener('click', exportXlsx);
    document.getElementById('btnExportXlsx').addEventListener('click', exportXlsx);
    document.getElementById('btnExport').addEventListener('click', exportJson);
    document.getElementById('btnImport').addEventListener('click', pickFile);
    document.getElementById('btnLoadTop').addEventListener('click', pickFile);
    document.getElementById('importFile').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) {
        if (/\.json$/i.test(file.name || '')) { importJson(file); }
        else { importXlsx(file); }
      }
      e.target.value = '';
    });

    document.getElementById('btnReset').addEventListener('click', function () {
      if (!window.confirm('Вернуть демо-данные и настройки из таблицы?')) { return; }
      settings = clone(DATA.settings);
      resources = clone(DATA.resources);
      items = clone(DATA.items);
      sourceNote = 'демо-данные';
      state.opened = null;
      state.newItem = null;
      rebuildIndexes();
      ensureOrigins();
      annotateCatalog();
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ничего */ }
      syncSettingsInputs();
      renderAll();
      toast('Сброшено');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') { return; }
      if (!document.getElementById('settings').hidden) { openSettings(false); }
      else if (state.newItem) { state.newItem = null; renderAll(); }
      else if (state.opened) { state.opened = null; renderAll(); }
    });
  }

  function pickFile() {
    document.getElementById('importFile').click();
  }

  function bindSetting(id, key) {
    var el = document.getElementById(id);
    if (!el) { return; }
    el.addEventListener('change', function () {
      var value = Number(el.value);
      if (!isFinite(value) || value <= 0) {
        syncSettingsInputs();
        return;
      }
      settings[key] = value;
      saveState();
      renderAll();
    });
  }

  function init() {
    buildGameIndex();
    loadState();
    rebuildIndexes();
    ensureOrigins();
    annotateCatalog();
    bindEvents();
    syncSettingsInputs();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
