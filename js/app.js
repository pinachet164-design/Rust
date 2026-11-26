/* Экономика Rust — логика сайта. */
(function () {
  'use strict';

  var DATA = window.RUST_DATA;
  var STORAGE_KEY = 'rust-economy-v4';

  var settings = clone(DATA.settings);
  var resources = DATA.resources.slice();
  var items = DATA.items.slice();
  var resourceById = {};
  var itemById = {};
  var sourceNote = 'демо-данные';

  var state = {
    category: 'all',
    search: '',
    sort: 'name',
    craftOnly: false,
    view: 'list',
    opened: null
  };

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

    document.getElementById('sourceNote').textContent = 'Данные: ' + sourceNote;
  }

  function renderTable() {
    var list = visibleEntries();
    var body = document.getElementById('tableBody');
    var html = '';
    list.forEach(function (entry) {
      var item = entry.data;
      var cost = entry.kind === 'resource' ? Number(item.price) || 0 : costOf(item);
      html += '<tr>' +
        '<td>' + escapeHtml(item.name) + '<span class="cell-sub">' + escapeHtml(item.id || '—') + '</span></td>' +
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
    document.getElementById('sourceNote').textContent = 'Данные: ' + sourceNote;
  }

  function renderCard() {
    var card = document.getElementById('card');
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
      (item.craft ? '<span class="tag tag--soft">крафт</span>' : '<span class="tag tag--soft">' + (kind === 'resource' ? 'ресурс' : 'некрафт') + '</span>') +
      '</div>' +
      '<p class="shortname">' + escapeHtml(item.id || 'без shortname') + '</p>' +
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

    if (kind === 'resource') {
      html += '<p class="card-note">Цена ресурса задаётся в таблице и участвует в себестоимости всех рецептов.</p>';
    } else if (item.craft) {
      html += '<h3 class="card-sub">Рецепт</h3>';
      if (item.ingredients && item.ingredients.length) {
        html += '<table class="recipe"><thead><tr><th>Ингредиент</th><th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th></tr></thead><tbody>';
        var sum = 0;
        item.ingredients.forEach(function (ing) {
          var resource = resourceById[ing.id];
          var price = unitPrice(ing.id);
          var total = price == null ? null : price * ing.amount;
          if (total != null) { sum += total; }
          html += '<tr><td>' + escapeHtml(resource ? resource.name : (ing.name || ing.id || '?')) + '</td>' +
            '<td class="num">' + num(ing.amount, 0) + '</td>' +
            '<td class="num">' + (price == null ? '—' : fmtT(price)) + '</td>' +
            '<td class="num">' + (total == null ? '—' : fmtT(total)) + '</td></tr>';
        });
        html += '</tbody><tfoot><tr><td colspan="3">Итого за крафт</td><td class="num">' + fmtT(sum) + '</td></tr></tfoot></table>';
        if (costOf(item) == null) {
          html += '<p class="card-note card-note--warn">Часть ингредиентов не найдена в списке ресурсов — себестоимость взята из таблицы.</p>';
        }
      } else {
        html += '<p class="card-note">Рецепт в таблице не указан.</p>';
      }
    } else {
      html += '<p class="card-note">Некрафтовый предмет. Цены покупки и продажи взяты из таблицы.</p>';
      if (item.source) {
        html += '<p class="card-note">Где найти: ' + escapeHtml(item.source) + '</p>';
      }
    }

    html += '<div class="card-actions"><button type="button" class="btn btn--ghost" id="btnCloseCard">Закрыть</button></div>';
    card.innerHTML = html;

    var close = document.getElementById('btnCloseCard');
    if (close) {
      close.addEventListener('click', function () { state.opened = null; renderAll(); });
    }
  }

  function renderAll() {
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
        if (key === 'buy shop mult' || key === 'sell to shop mult' || key === 'dlc mult' || key === 'wb2 mult' || key === 'wb3 mult') {
          var number = parseNum(row[index + 1]);
          if (number > 0) {
            var field = { 'buy shop mult': 'buyMult', 'sell to shop mult': 'sellMult', 'dlc mult': 'dlcMult', 'wb2 mult': 'wb2Mult', 'wb3 mult': 'wb3Mult' }[key];
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
        syncSettingsInputs();
        renderAll();
        saveState();

        var report = document.getElementById('importReport');
        if (report) {
          report.hidden = false;
          var unresolved = craft.filter(function (item) { return item.unresolved > 0; }).length;
          report.innerHTML = '<strong>Импорт таблицы:</strong> ресурсов ' + resources.length +
            ', крафтовых ' + craft.length + ', некрафтовых ' + loot.length + '.' +
            (unresolved ? '<br>Рецептов с неизвестными ингредиентами: ' + unresolved +
              ' — у них себестоимость взята из таблицы.' : '');
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

    document.getElementById('btnSettings').addEventListener('click', function () { openSettings(true); });
    document.getElementById('btnCloseSettings').addEventListener('click', function () { openSettings(false); });
    document.getElementById('overlay').addEventListener('click', function () { openSettings(false); });

    bindSetting('setBuy', 'buyMult');
    bindSetting('setSell', 'sellMult');
    bindSetting('setDlc', 'dlcMult');
    bindSetting('setRate', 'rubRate');
    bindSetting('setScrap', 'scrapPrice');

    document.getElementById('btnCsv').addEventListener('click', exportCsv);
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
      resources = DATA.resources.slice();
      items = DATA.items.slice();
      sourceNote = 'демо-данные';
      state.opened = null;
      rebuildIndexes();
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ничего */ }
      syncSettingsInputs();
      renderAll();
      toast('Сброшено');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') { return; }
      if (!document.getElementById('settings').hidden) { openSettings(false); }
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
    loadState();
    rebuildIndexes();
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
