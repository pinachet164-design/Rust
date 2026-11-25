/*
 * Экономика Rust — данные.
 * Здесь только данные: категории, предметы, рецепты, разборка, базовые цены.
 * Правьте цены и рецепты здесь — код в js/app.js трогать не нужно.
 *
 * Поля предмета:
 *   id       — shortname (игровой идентификатор, он же используется в рецептах)
 *   name     — название по-русски
 *   category — id категории
 *   basePrice— базовая цена в тугриках при множителе добычи x1
 *              (для сырья цена делится на множитель, для остальных — как есть)
 *   craft    — { output: сколько штук за крафт, ingredients: [{id, amount}] }
 *   recycle  — [{id, amount}] что выпадает при разборке
 *   verified — false, если рецепт/разборка требуют проверки
 */
var RUST_DATA = {
  settings: {
    rubRate: 5,          // 1 рубль = 5 тугриков
    yieldMultiplier: 1,  // множитель добычи на сервере
    yieldK: 0.7,         // показатель степени K в формуле цены сырья
    scrapPrice: 0.0001,  // цена 1 скрапа в тугриках: 1 ₸ = 10 000 скрапа
    markup: 0.25,        // продажа игроку = себестоимость × (1 + наценка)
    buyback: {           // выкуп у игрока = себестоимость × доля
      resources: 0.45,   // сырьё
      components: 0.55,  // компоненты
      default: 0.67      // готовые предметы и всё остальное
    }
  },

  categories: [
    { id: 'weapons', name: 'Оружие' },
    { id: 'ammo', name: 'Боеприпасы' },
    { id: 'clothing', name: 'Одежда' },
    { id: 'tools', name: 'Инструменты' },
    { id: 'construction', name: 'Строительство' },
    { id: 'resources', name: 'Ресурсы' },
    { id: 'components', name: 'Компоненты' },
    { id: 'food', name: 'Еда' },
    { id: 'medical', name: 'Медицина' },
    { id: 'electrical', name: 'Электричество' },
    { id: 'explosives', name: 'Взрывчатка' },
    { id: 'traps', name: 'Ловушки' },
    { id: 'misc', name: 'Разное' },
    { id: 'goods', name: 'Ресурсы и валюта', virtual: true, sources: ['resources', 'components'] }
  ],

  items: [
    /* ---------------- ОРУЖИЕ ---------------- */
    {
      id: 'rifle.ak', name: 'Автомат Калашникова', category: 'weapons', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 50 },
        { id: 'wood', amount: 200 },
        { id: 'riflebody', amount: 1 },
        { id: 'metalspring', amount: 4 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 20 },
        { id: 'wood', amount: 80 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.bolt', name: 'Снайперская винтовка', category: 'weapons', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 20 },
        { id: 'metalpipe', amount: 3 },
        { id: 'riflebody', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 8 },
        { id: 'metalpipe', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.semiauto', name: 'Полуавтоматическая винтовка', category: 'weapons', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'semibody', amount: 1 },
        { id: 'metalspring', amount: 1 },
        { id: 'metal.fragments', amount: 450 },
        { id: 'metal.refined', amount: 4 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 180 },
        { id: 'metal.refined', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.sks', name: 'Самозарядный карабин СКС', category: 'weapons', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'semibody', amount: 1 },
        { id: 'metalspring', amount: 2 },
        { id: 'metal.fragments', amount: 200 },
        { id: 'metal.refined', amount: 12 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 100 },
        { id: 'metal.refined', amount: 6 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.lr300', name: 'Штурмовая винтовка LR-300', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 25 },
        { id: 'riflebody', amount: 1 },
        { id: 'metalspring', amount: 2 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 24 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'smg.mp5', name: 'Пистолет-пулемёт MP5A4', category: 'weapons', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 15 },
        { id: 'smgbody', amount: 1 },
        { id: 'metalspring', amount: 2 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 7 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'smg.2', name: 'Самодельный пистолет-пулемёт', category: 'weapons', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 8 },
        { id: 'smgbody', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 4 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'smg.thompson', name: 'Пистолет-пулемёт Томпсона', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 10 },
        { id: 'smgbody', amount: 1 },
        { id: 'metalspring', amount: 1 },
        { id: 'wood', amount: 100 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 4 },
        { id: 'wood', amount: 40 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'shotgun.pump', name: 'Помповое ружьё', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metalpipe', amount: 2 },
        { id: 'metalspring', amount: 1 },
        { id: 'metalblade', amount: 1 },
        { id: 'metal.fragments', amount: 200 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 100 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'shotgun.double', name: 'Двуствольное ружьё', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'metalpipe', amount: 2 },
        { id: 'metalblade', amount: 1 }
      ] },
      recycle: [
        { id: 'wood', amount: 40 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'pistol.python', name: 'Револьвер Python', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 8 },
        { id: 'metalpipe', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 4 },
        { id: 'metalpipe', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'pistol.semiauto', name: 'Полуавтоматический пистолет', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'semibody', amount: 1 },
        { id: 'metalpipe', amount: 1 },
        { id: 'metal.refined', amount: 2 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 2 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'pistol.revolver', name: 'Револьвер', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metalpipe', amount: 1 },
        { id: 'metal.fragments', amount: 50 },
        { id: 'wood', amount: 20 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 25 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'pistol.m92', name: 'Пистолет M92', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metalpipe', amount: 1 },
        { id: 'metal.fragments', amount: 30 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 15 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'rocket.launcher', name: 'Ручной гранатомёт', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 40 },
        { id: 'riflebody', amount: 1 },
        { id: 'metalpipe', amount: 6 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 20 },
        { id: 'metalpipe', amount: 3 }
      ]
    },
    {
      id: 'flamethrower', name: 'Огнемёт', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 15 },
        { id: 'metalpipe', amount: 6 },
        { id: 'metalspring', amount: 1 },
        { id: 'lowgradefuel', amount: 50 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 7 },
        { id: 'metalpipe', amount: 3 }
      ]
    },
    {
      id: 'spear.wooden', name: 'Деревянное копьё', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 300 },
        { id: 'metalblade', amount: 1 }
      ] }
    },
    {
      id: 'knife.bone', name: 'Костяной нож', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'bone.fragments', amount: 30 },
        { id: 'wood', amount: 10 }
      ] }
    },
    {
      id: 'machete', name: 'Мачете', category: 'weapons', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metalblade', amount: 1 },
        { id: 'wood', amount: 50 }
      ] }
    },

    /* ---------------- БОЕПРИПАСЫ ---------------- */
    {
      id: 'ammo.rifle', name: 'Патрон 5.56', category: 'ammo', verified: true,
      craft: { output: 3, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 5 }
      ] }
    },
    {
      id: 'ammo.rifle.hv', name: 'Патрон 5.56 (высокоскоростной)', category: 'ammo', verified: false,
      craft: { output: 2, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 }
      ] }
    },
    {
      id: 'ammo.rifle.explosive', name: 'Патрон 5.56 (разрывной)', category: 'ammo', verified: false,
      craft: { output: 2, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 20 },
        { id: 'sulfur', amount: 10 }
      ] }
    },
    {
      id: 'ammo.rifle.incendiary', name: 'Патрон 5.56 (зажигательный)', category: 'ammo', verified: false,
      craft: { output: 2, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 },
        { id: 'sulfur', amount: 5 }
      ] }
    },
    {
      id: 'ammo.pistol', name: 'Пистолетный патрон', category: 'ammo', verified: true,
      craft: { output: 4, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 5 }
      ] }
    },
    {
      id: 'ammo.pistol.hv', name: 'Пистолетный патрон (высокоскоростной)', category: 'ammo', verified: false,
      craft: { output: 4, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 }
      ] }
    },
    {
      id: 'ammo.pistol.incendiary', name: 'Пистолетный патрон (зажигательный)', category: 'ammo', verified: false,
      craft: { output: 4, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 },
        { id: 'sulfur', amount: 5 }
      ] }
    },
    {
      id: 'ammo.handmade.shell', name: 'Самодельный патрон (дробь)', category: 'ammo', verified: false,
      craft: { output: 2, ingredients: [
        { id: 'stones', amount: 5 },
        { id: 'gunpowder', amount: 5 }
      ] }
    },
    {
      id: 'ammo.rocket.basic', name: 'Ракета', category: 'ammo', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'metalpipe', amount: 2 },
        { id: 'gunpowder', amount: 150 },
        { id: 'explosives', amount: 10 }
      ] }
    },
    {
      id: 'ammo.rocket.hv', name: 'Ракета (высокоскоростная)', category: 'ammo', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metalpipe', amount: 1 },
        { id: 'gunpowder', amount: 100 },
        { id: 'explosives', amount: 5 }
      ] }
    },
    {
      id: 'ammo.rocket.fire', name: 'Ракета (зажигательная)', category: 'ammo', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metalpipe', amount: 2 },
        { id: 'gunpowder', amount: 75 },
        { id: 'lowgradefuel', amount: 10 }
      ] }
    },

    /* ---------------- ОДЕЖДА ---------------- */
    {
      id: 'burlap.shirt', name: 'Рубаха из мешковины', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [ { id: 'cloth', amount: 30 } ] }
    },
    {
      id: 'burlap.trousers', name: 'Штаны из мешковины', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [ { id: 'cloth', amount: 30 } ] }
    },
    {
      id: 'hoodie', name: 'Худи', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'cloth', amount: 80 },
        { id: 'sewingkit', amount: 1 }
      ] }
    },
    {
      id: 'shoes.boots', name: 'Ботинки', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [ { id: 'leather', amount: 40 } ] }
    },
    {
      id: 'roadsign.jacket', name: 'Куртка из дорожных знаков', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'roadsigns', amount: 10 },
        { id: 'cloth', amount: 20 }
      ] }
    },
    {
      id: 'roadsign.kilt', name: 'Юбка из дорожных знаков', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'roadsigns', amount: 8 },
        { id: 'cloth', amount: 10 }
      ] }
    },
    {
      id: 'metal.facemask', name: 'Металлическая маска', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 100 },
        { id: 'sheetmetal', amount: 1 }
      ] }
    },
    {
      id: 'metal.plate.torso', name: 'Металлический нагрудник', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 200 },
        { id: 'sheetmetal', amount: 2 }
      ] }
    },
    {
      id: 'coffeecan.helmet', name: 'Шлем из кофейной банки', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [ { id: 'metal.fragments', amount: 75 } ] }
    },
    {
      id: 'riot.helmet', name: 'Шлем ОМОНа', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'sheetmetal', amount: 3 },
        { id: 'metal.fragments', amount: 30 }
      ] }
    },
    {
      id: 'hazmatsuit', name: 'Хазмат-костюм', category: 'clothing', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'tarp', amount: 8 },
        { id: 'sewingkit', amount: 2 }
      ] }
    },

    /* ---------------- ИНСТРУМЕНТЫ ---------------- */
    {
      id: 'rock', name: 'Камень', category: 'tools', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'stones', amount: 50 }
      ] }
    },
    {
      id: 'torch', name: 'Факел', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 50 },
        { id: 'cloth', amount: 10 },
        { id: 'lowgradefuel', amount: 5 }
      ] }
    },
    {
      id: 'hammer', name: 'Молоток', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 50 },
        { id: 'metal.fragments', amount: 25 }
      ] }
    },
    {
      id: 'hatchet', name: 'Топор', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 75 },
        { id: 'wood', amount: 30 }
      ] }
    },
    {
      id: 'pickaxe', name: 'Кирка', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 125 },
        { id: 'wood', amount: 30 }
      ] }
    },
    {
      id: 'axe.salvaged', name: 'Самодельный топор', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 20 },
        { id: 'metalblade', amount: 1 },
        { id: 'metalpipe', amount: 1 }
      ] }
    },
    {
      id: 'pickaxe.salvaged', name: 'Самодельная кирка', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 20 },
        { id: 'metalblade', amount: 1 },
        { id: 'metalpipe', amount: 1 }
      ] }
    },
    {
      id: 'icepick.salvaged', name: 'Самодельный ледоруб', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 20 },
        { id: 'metalblade', amount: 1 }
      ] }
    },
    {
      id: 'jackhammer', name: 'Отбойный молоток', category: 'tools', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 30 },
        { id: 'metalpipe', amount: 5 },
        { id: 'metalspring', amount: 2 }
      ] }
    },

    /* ---------------- СТРОИТЕЛЬСТВО ---------------- */
    {
      id: 'cupboard.tool', name: 'Шкаф с инструментами', category: 'construction', verified: true,
      craft: { output: 1, ingredients: [ { id: 'wood', amount: 1000 } ] }
    },
    {
      id: 'door.hinged.wood', name: 'Деревянная дверь', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 300 },
        { id: 'metal.fragments', amount: 6 }
      ] }
    },
    {
      id: 'door.hinged.metal', name: 'Металлическая дверь', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 300 },
        { id: 'gears', amount: 2 }
      ] }
    },
    {
      id: 'door.hinged.toptier', name: 'Бронированная дверь', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 20 },
        { id: 'gears', amount: 5 }
      ] }
    },
    {
      id: 'lock.code', name: 'Кодовый замок', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [ { id: 'metal.fragments', amount: 100 } ] }
    },
    {
      id: 'lock.key', name: 'Ключевой замок', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [ { id: 'metal.fragments', amount: 50 } ] }
    },
    {
      id: 'furnace', name: 'Печь', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'stones', amount: 200 },
        { id: 'wood', amount: 50 },
        { id: 'lowgradefuel', amount: 25 }
      ] }
    },
    {
      id: 'furnace.large', name: 'Большая печь', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'stones', amount: 500 },
        { id: 'wood', amount: 100 },
        { id: 'lowgradefuel', amount: 50 }
      ] }
    },
    {
      id: 'bbq', name: 'Гриль', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'stones', amount: 50 },
        { id: 'lowgradefuel', amount: 10 }
      ] }
    },
    {
      id: 'workbench1', name: 'Верстак 1 уровня', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 500 },
        { id: 'metal.fragments', amount: 100 }
      ] }
    },
    {
      id: 'workbench2', name: 'Верстак 2 уровня', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 500 },
        { id: 'metal.refined', amount: 20 },
        { id: 'gears', amount: 1 }
      ] }
    },
    {
      id: 'workbench3', name: 'Верстак 3 уровня', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 1000 },
        { id: 'metal.refined', amount: 100 },
        { id: 'techparts', amount: 1 }
      ] }
    },
    {
      id: 'box.wooden', name: 'Деревянный ящик', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [ { id: 'wood', amount: 100 } ] }
    },
    {
      id: 'stash.small', name: 'Тайник', category: 'construction', verified: false,
      craft: { output: 1, ingredients: [ { id: 'cloth', amount: 10 } ] }
    },

    /* ---------------- РЕСУРСЫ (сырьё) ---------------- */
    { id: 'wood', name: 'Дерево', category: 'resources', basePrice: 2, verified: true },
    { id: 'stones', name: 'Камень', category: 'resources', basePrice: 2, verified: true },
    { id: 'metal.fragments', name: 'Металлические фрагменты', category: 'resources', basePrice: 4, verified: true },
    { id: 'sulfur', name: 'Сера', category: 'resources', basePrice: 6, verified: true },
    { id: 'charcoal', name: 'Уголь', category: 'resources', basePrice: 2, verified: true },
    { id: 'metal.refined', name: 'Металл высокого качества (МВК)', category: 'resources', basePrice: 60, verified: true },
    { id: 'cloth', name: 'Ткань', category: 'resources', basePrice: 3, verified: true },
    { id: 'leather', name: 'Кожа', category: 'resources', basePrice: 4, verified: true },
    { id: 'lowgradefuel', name: 'Низкосортное топливо', category: 'resources', basePrice: 3, verified: true },
    { id: 'crude.oil', name: 'Сырая нефть', category: 'resources', basePrice: 4, verified: true },
    { id: 'animal.fat', name: 'Животный жир', category: 'resources', basePrice: 4, verified: true },
    { id: 'bone.fragments', name: 'Кости', category: 'resources', basePrice: 2, verified: true },
    { id: 'scrap', name: 'Металлолом (scrap)', category: 'resources', basePrice: 0.0001, verified: true },

    /* ---------------- КОМПОНЕНТЫ ---------------- */
    {
      id: 'gunpowder', name: 'Порох', category: 'components', verified: true,
      craft: { output: 10, ingredients: [
        { id: 'sulfur', amount: 20 },
        { id: 'charcoal', amount: 30 }
      ] }
    },
    {
      id: 'explosives', name: 'Взрывчатка', category: 'components', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'gunpowder', amount: 50 },
        { id: 'lowgradefuel', amount: 3 },
        { id: 'sulfur', amount: 10 },
        { id: 'metal.fragments', amount: 10 }
      ] }
    },
    { id: 'metalpipe', name: 'Металлическая труба', category: 'components', basePrice: 5, verified: true },
    { id: 'gears', name: 'Шестерёнки', category: 'components', basePrice: 6, verified: true },
    { id: 'metalspring', name: 'Металлическая пружина', category: 'components', basePrice: 6, verified: true },
    { id: 'sheetmetal', name: 'Листовой металл', category: 'components', basePrice: 12, verified: true },
    { id: 'roadsigns', name: 'Дорожные знаки', category: 'components', basePrice: 4, verified: true },
    { id: 'tarp', name: 'Брезент', category: 'components', basePrice: 6, verified: true },
    { id: 'rope', name: 'Верёвка', category: 'components', basePrice: 4, verified: true },
    { id: 'sewingkit', name: 'Швейный набор', category: 'components', basePrice: 12, verified: true },
    { id: 'riflebody', name: 'Корпус винтовки', category: 'components', basePrice: 90, verified: true },
    { id: 'smgbody', name: 'Корпус пистолета-пулемёта', category: 'components', basePrice: 45, verified: true },
    { id: 'semibody', name: 'Корпус полуавтоматического оружия', category: 'components', basePrice: 30, verified: true },
    { id: 'techparts', name: 'Технические детали', category: 'components', basePrice: 120, verified: true },
    { id: 'metalblade', name: 'Металлическое лезвие', category: 'components', basePrice: 10, verified: true },
    { id: 'propane.1lb', name: 'Пропановый баллон', category: 'components', basePrice: 8, verified: false },
    { id: 'glue', name: 'Клей', category: 'components', basePrice: 3, verified: true },
    { id: 'ducttape', name: 'Скотч', category: 'components', basePrice: 4, verified: true },

    /* ---------------- ЕДА ---------------- */
    { id: 'corn', name: 'Кукуруза', category: 'food', basePrice: 3, verified: true },
    { id: 'pumpkin', name: 'Тыква', category: 'food', basePrice: 2, verified: true },
    { id: 'mushroom', name: 'Гриб', category: 'food', basePrice: 4, verified: true },
    { id: 'apple', name: 'Яблоко', category: 'food', basePrice: 2, verified: true },
    { id: 'black.raspberries', name: 'Чёрная малина', category: 'food', basePrice: 3, verified: true },
    { id: 'can.beans', name: 'Банка фасоли', category: 'food', basePrice: 8, verified: true },
    { id: 'can.tuna', name: 'Банка тунца', category: 'food', basePrice: 10, verified: true },

    /* ---------------- МЕДИЦИНА ---------------- */
    {
      id: 'bandage', name: 'Бинт', category: 'medical', verified: false,
      craft: { output: 1, ingredients: [ { id: 'cloth', amount: 10 } ] }
    },
    {
      id: 'medkit', name: 'Аптечка', category: 'medical', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'cloth', amount: 20 },
        { id: 'wood', amount: 5 }
      ] }
    },
    {
      id: 'largemedkit', name: 'Большая аптечка', category: 'medical', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'cloth', amount: 20 },
        { id: 'metal.fragments', amount: 10 },
        { id: 'lowgradefuel', amount: 2 }
      ] }
    },
    {
      id: 'syringe.medical', name: 'Медицинский шприц', category: 'medical', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'cloth', amount: 5 }
      ] }
    },

    /* ---------------- ЭЛЕКТРИЧЕСТВО ---------------- */
    { id: 'battery.small', name: 'Малая батарея', category: 'electrical', basePrice: 20, verified: false },
    { id: 'solarpanel.large', name: 'Большая солнечная панель', category: 'electrical', basePrice: 150, verified: false },
    { id: 'generator.wind.scrap', name: 'Ветрогенератор', category: 'electrical', basePrice: 200, verified: false },

    /* ---------------- ВЗРЫВЧАТКА ---------------- */
    {
      id: 'explosive.timed', name: 'Взрывной заряд C4', category: 'explosives', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'explosives', amount: 20 },
        { id: 'cloth', amount: 5 },
        { id: 'techparts', amount: 2 },
        { id: 'metal.fragments', amount: 200 }
      ] }
    },
    {
      id: 'explosive.satchel', name: 'Рюкзак со взрывчаткой', category: 'explosives', verified: true,
      craft: { output: 1, ingredients: [
        { id: 'grenade.beancan', amount: 4 },
        { id: 'rope', amount: 1 }
      ] }
    },
    {
      id: 'grenade.beancan', name: 'Граната из консервной банки', category: 'explosives', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'gunpowder', amount: 60 },
        { id: 'metal.fragments', amount: 20 },
        { id: 'cloth', amount: 10 }
      ] }
    },
    {
      id: 'grenade.f1', name: 'Граната F1', category: 'explosives', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'gunpowder', amount: 30 },
        { id: 'metal.fragments', amount: 20 },
        { id: 'metalpipe', amount: 1 }
      ] }
    },
    {
      id: 'grenade.flashbang', name: 'Светошумовая граната', category: 'explosives', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'gunpowder', amount: 25 },
        { id: 'metal.fragments', amount: 50 }
      ] }
    },

    /* ---------------- ЛОВУШКИ ---------------- */
    {
      id: 'trap.bear', name: 'Медвежий капкан', category: 'traps', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 50 },
        { id: 'metalspring', amount: 1 }
      ] }
    },
    {
      id: 'trap.landmine', name: 'Мина', category: 'traps', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'metal.fragments', amount: 50 },
        { id: 'gunpowder', amount: 10 },
        { id: 'metalpipe', amount: 1 }
      ] }
    },

    /* ---------------- РАЗНОЕ ---------------- */
    {
      id: 'research.table', name: 'Стол исследований', category: 'misc', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 200 },
        { id: 'metal.fragments', amount: 20 },
        { id: 'metalspring', amount: 1 }
      ] }
    },
    {
      id: 'repair.bench', name: 'Верстак для ремонта', category: 'misc', verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 200 },
        { id: 'metal.fragments', amount: 50 },
        { id: 'metalpipe', amount: 1 }
      ] }
    }
  ]
};
