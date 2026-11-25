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
 *   stack    — размер стака (из таблицы Amigos)
 *   craft    — { time: секунды на крафт, bench: верстак, output: сколько штук за крафт,
 *                ingredients: [{id, amount}] }
 *              bench: 0 — без верстака, 1..3 — верстак соответствующего уровня
 *   recycle  — [{id, amount}] что выпадает при разборке
 *   verified — false, если рецепт/разборка не подтверждены таблицей Amigos
 *
 * Рецепты, время крафта, выход за крафт и стаки перенесены из «Amigos экономика 1.xlsx».
 * Предметы, у которых в таблице нет рецепта (LR-300, M92, ручной гранатомёт,
 * отбойный молоток, C4, аптечка, печь/гриль), помечены verified: false или
 * комментарием — их рецепты остались прежними.
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
      id: 'rifle.ak', name: 'Автомат Калашникова', category: 'weapons', stack: 1, verified: true,
      craft: { time: 35, bench: 3, output: 1, ingredients: [
        { id: 'wood', amount: 200 },
        { id: 'metal.refined', amount: 50 },
        { id: 'metalspring', amount: 4 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 20 },
        { id: 'wood', amount: 80 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.bolt', name: 'Снайперская винтовка', category: 'weapons', stack: 1, verified: true,
      craft: { time: 35, bench: 3, output: 1, ingredients: [
        { id: 'metal.refined', amount: 20 },
        { id: 'metalpipe', amount: 3 },
        { id: 'metalspring', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 8 },
        { id: 'metalpipe', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.semiauto', name: 'Полуавтоматическая винтовка', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 450 },
        { id: 'metal.refined', amount: 4 },
        { id: 'metalspring', amount: 1 },
        { id: 'semibody', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 180 },
        { id: 'metal.refined', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.sks', name: 'Самозарядный карабин СКС', category: 'weapons', stack: 1, verified: true,
      craft: { time: 30, bench: 3, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 200 },
        { id: 'metal.refined', amount: 12 },
        { id: 'metalspring', amount: 2 },
        { id: 'semibody', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 100 },
        { id: 'metal.refined', amount: 6 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'rifle.lr300', name: 'Штурмовая винтовка LR-300', category: 'weapons', stack: 1, verified: false,
      // В таблице Amigos у LR-300 нет рецепта (0 сек / 0 шт) — рецепт ниже не из неё.
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
      id: 'smg.mp5', name: 'Пистолет-пулемёт MP5A4', category: 'weapons', stack: 1, verified: true,
      craft: { time: 30, bench: 3, output: 1, ingredients: [
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
      id: 'smg.2', name: 'Самодельный пистолет-пулемёт', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'metal.refined', amount: 8 },
        { id: 'metalspring', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 4 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'smg.thompson', name: 'Пистолет-пулемёт Томпсона', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'metal.refined', amount: 10 },
        { id: 'smgbody', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 4 },
        { id: 'wood', amount: 40 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'shotgun.pump', name: 'Помповое ружьё', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'metal.refined', amount: 15 },
        { id: 'metalspring', amount: 1 },
        { id: 'metalpipe', amount: 2 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 100 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'shotgun.double', name: 'Двуствольное ружьё', category: 'weapons', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 175 },
        { id: 'metalpipe', amount: 2 }
      ] },
      recycle: [
        { id: 'wood', amount: 40 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'pistol.python', name: 'Револьвер Python', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'metal.refined', amount: 10 },
        { id: 'metalpipe', amount: 3 },
        { id: 'metalspring', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 4 },
        { id: 'metalpipe', amount: 1 },
        { id: 'metalspring', amount: 1 }
      ]
    },
    {
      id: 'pistol.semiauto', name: 'Полуавтоматический пистолет', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'metal.refined', amount: 4 },
        { id: 'metalpipe', amount: 1 },
        { id: 'metalspring', amount: 1 },
        { id: 'semibody', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 2 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'pistol.revolver', name: 'Револьвер', category: 'weapons', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 125 },
        { id: 'cloth', amount: 25 },
        { id: 'metalpipe', amount: 1 }
      ] },
      recycle: [
        { id: 'metal.fragments', amount: 25 },
        { id: 'metalpipe', amount: 1 }
      ]
    },
    {
      id: 'pistol.m92', name: 'Пистолет M92', category: 'weapons', stack: 1, verified: false,
      // В таблице Amigos рецепта нет — рецепт ниже не из неё.
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
      id: 'rocket.launcher', name: 'Ручной гранатомёт', category: 'weapons', stack: 1, verified: false,
      // В таблице Amigos рецепта нет — рецепт ниже не из неё.
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
      id: 'flamethrower', name: 'Огнемёт', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 3, output: 1, ingredients: [
        { id: 'metal.refined', amount: 15 },
        { id: 'lowgradefuel', amount: 100 },
        { id: 'metalpipe', amount: 6 },
        { id: 'metalspring', amount: 2 }
      ] },
      recycle: [
        { id: 'metal.refined', amount: 7 },
        { id: 'metalpipe', amount: 3 }
      ]
    },
    {
      id: 'spear.wooden', name: 'Деревянное копьё', category: 'weapons', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'wood', amount: 300 }
      ] }
    },
    {
      id: 'knife.bone', name: 'Костяной нож', category: 'weapons', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'bone.fragments', amount: 30 }
      ] }
    },
    {
      id: 'machete', name: 'Мачете', category: 'weapons', stack: 1, verified: true,
      craft: { time: 12.5, bench: 1, output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'metal.fragments', amount: 40 }
      ] }
    },

    /* ---------------- БОЕПРИПАСЫ ---------------- */
    {
      id: 'ammo.rifle', name: 'Патрон 5.56', category: 'ammo', stack: 5000, verified: true,
      craft: { time: 0.8, bench: 1, output: 3, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 5 }
      ] }
    },
    {
      id: 'ammo.rifle.hv', name: 'Патрон 5.56 (высокоскоростной)', category: 'ammo', stack: 5000, verified: true,
      craft: { time: 0.8, bench: 2, output: 3, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 }
      ] }
    },
    {
      id: 'ammo.rifle.explosive', name: 'Патрон 5.56 (разрывной)', category: 'ammo', stack: 5000, verified: true,
      craft: { time: 0.8, bench: 3, output: 2, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 20 },
        { id: 'sulfur', amount: 10 }
      ] }
    },
    {
      id: 'ammo.rifle.incendiary', name: 'Патрон 5.56 (зажигательный)', category: 'ammo', stack: 5000, verified: true,
      craft: { time: 0.8, bench: 2, output: 2, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 },
        { id: 'sulfur', amount: 5 }
      ] }
    },
    {
      id: 'ammo.pistol', name: 'Пистолетный патрон', category: 'ammo', stack: 2000, verified: true,
      craft: { time: 0.8, bench: 1, output: 4, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 5 }
      ] }
    },
    {
      id: 'ammo.pistol.hv', name: 'Пистолетный патрон (высокоскоростной)', category: 'ammo', stack: 5000, verified: true,
      craft: { time: 0.8, bench: 2, output: 4, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 }
      ] }
    },
    {
      id: 'ammo.pistol.incendiary', name: 'Пистолетный патрон (зажигательный)', category: 'ammo', stack: 5000, verified: true,
      craft: { time: 0.8, bench: 2, output: 3, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'gunpowder', amount: 10 },
        { id: 'sulfur', amount: 5 }
      ] }
    },
    {
      id: 'ammo.handmade.shell', name: 'Самодельный патрон (дробь)', category: 'ammo', stack: 5000, verified: true,
      craft: { time: 0.8, bench: 1, output: 2, ingredients: [
        { id: 'wood', amount: 5 },
        { id: 'gunpowder', amount: 5 }
      ] }
    },
    {
      id: 'ammo.rocket.basic', name: 'Ракета', category: 'ammo', stack: 200, verified: true,
      craft: { time: 1.3, bench: 3, output: 1, ingredients: [
        { id: 'gunpowder', amount: 150 },
        { id: 'explosives', amount: 10 }
      ] }
    },
    {
      id: 'ammo.rocket.hv', name: 'Ракета (высокоскоростная)', category: 'ammo', stack: 200, verified: true,
      craft: { time: 1.3, bench: 3, output: 1, ingredients: [
        { id: 'gunpowder', amount: 100 },
        { id: 'metalpipe', amount: 1 }
      ] }
    },
    {
      id: 'ammo.rocket.fire', name: 'Ракета (зажигательная)', category: 'ammo', stack: 200, verified: true,
      craft: { time: 1.3, bench: 3, output: 1, ingredients: [
        { id: 'gunpowder', amount: 150 },
        { id: 'lowgradefuel', amount: 75 },
        { id: 'metalpipe', amount: 2 }
      ] }
    },

    /* ---------------- ОДЕЖДА ---------------- */
    {
      id: 'burlap.shirt', name: 'Рубаха из мешковины', category: 'clothing', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [ { id: 'cloth', amount: 20 } ] }
    },
    {
      id: 'burlap.trousers', name: 'Штаны из мешковины', category: 'clothing', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [ { id: 'cloth', amount: 20 } ] }
    },
    {
      id: 'hoodie', name: 'Худи', category: 'clothing', stack: 1, verified: true,
      craft: { time: 12.5, bench: 1, output: 1, ingredients: [
        { id: 'cloth', amount: 40 },
        { id: 'sewingkit', amount: 1 }
      ] }
    },
    {
      id: 'shoes.boots', name: 'Ботинки', category: 'clothing', stack: 1, verified: true,
      craft: { time: 6.3, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 15 },
        { id: 'sewingkit', amount: 1 }
      ] }
    },
    {
      id: 'roadsign.jacket', name: 'Куртка из дорожных знаков', category: 'clothing', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'roadsigns', amount: 10 },
        { id: 'cloth', amount: 20 },
        { id: 'sewingkit', amount: 2 }
      ] }
    },
    {
      id: 'roadsign.kilt', name: 'Юбка из дорожных знаков', category: 'clothing', stack: 1, verified: true,
      craft: { time: 12.5, bench: 2, output: 1, ingredients: [
        { id: 'roadsigns', amount: 8 },
        { id: 'cloth', amount: 10 },
        { id: 'sewingkit', amount: 2 }
      ] }
    },
    {
      id: 'metal.facemask', name: 'Металлическая маска', category: 'clothing', stack: 1, verified: true,
      craft: { time: 35, bench: 3, output: 1, ingredients: [
        { id: 'metal.refined', amount: 15 },
        { id: 'leather', amount: 50 },
        { id: 'sewingkit', amount: 6 }
      ] }
    },
    {
      id: 'metal.plate.torso', name: 'Металлический нагрудник', category: 'clothing', stack: 1, verified: true,
      craft: { time: 35, bench: 3, output: 1, ingredients: [
        { id: 'metal.refined', amount: 18 },
        { id: 'leather', amount: 50 },
        { id: 'sewingkit', amount: 8 }
      ] }
    },
    {
      id: 'coffeecan.helmet', name: 'Шлем из кофейной банки', category: 'clothing', stack: 1, verified: true,
      craft: { time: 12.5, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 60 },
        { id: 'cloth', amount: 15 },
        { id: 'sewingkit', amount: 1 }
      ] }
    },
    {
      id: 'riot.helmet', name: 'Шлем ОМОНа', category: 'clothing', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 50 },
        { id: 'cloth', amount: 10 }
      ] }
    },
    {
      id: 'hazmatsuit', name: 'Хазмат-костюм', category: 'clothing', stack: 10, verified: true,
      craft: { time: 10, bench: 2, output: 1, ingredients: [
        { id: 'metal.refined', amount: 8 },
        { id: 'tarp', amount: 5 },
        { id: 'sewingkit', amount: 2 }
      ] }
    },

    /* ---------------- ИНСТРУМЕНТЫ ---------------- */
    {
      id: 'rock', name: 'Камень', category: 'tools', stack: 1, verified: true,
      craft: { time: 1.3, bench: 0, output: 1, ingredients: [
        { id: 'stones', amount: 10 }
      ] }
    },
    {
      id: 'torch', name: 'Факел', category: 'tools', stack: 1, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [
        { id: 'wood', amount: 30 },
        { id: 'cloth', amount: 1 },
        { id: 'lowgradefuel', amount: 1 }
      ] }
    },
    {
      id: 'hammer', name: 'Молоток', category: 'tools', stack: 1, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [
        { id: 'wood', amount: 100 }
      ] }
    },
    {
      id: 'hatchet', name: 'Топор', category: 'tools', stack: 1, verified: true,
      craft: { time: 2.5, bench: 0, output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'metal.fragments', amount: 75 }
      ] }
    },
    {
      id: 'pickaxe', name: 'Кирка', category: 'tools', stack: 1, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'metal.fragments', amount: 125 }
      ] }
    },
    {
      id: 'axe.salvaged', name: 'Самодельный топор', category: 'tools', stack: 1, verified: true,
      craft: { time: 12.5, bench: 1, output: 1, ingredients: [
        { id: 'metalpipe', amount: 1 },
        { id: 'metalblade', amount: 5 }
      ] }
    },
    {
      id: 'pickaxe.salvaged', name: 'Самодельная кирка', category: 'tools', stack: 1, verified: true,
      craft: { time: 12.5, bench: 1, output: 1, ingredients: [
        { id: 'metalpipe', amount: 5 },
        { id: 'metalblade', amount: 1 }
      ] }
    },
    {
      id: 'icepick.salvaged', name: 'Самодельный ледоруб', category: 'tools', stack: 1, verified: true,
      craft: { time: 12.5, bench: 1, output: 1, ingredients: [
        { id: 'metalpipe', amount: 5 },
        { id: 'metalblade', amount: 1 }
      ] }
    },
    {
      id: 'jackhammer', name: 'Отбойный молоток', category: 'tools', stack: 1, verified: false,
      // В таблице Amigos рецепта нет — рецепт ниже не из неё.
      craft: { output: 1, ingredients: [
        { id: 'metal.refined', amount: 30 },
        { id: 'metalpipe', amount: 5 },
        { id: 'metalspring', amount: 2 }
      ] }
    },

    /* ---------------- СТРОИТЕЛЬСТВО ---------------- */
    {
      id: 'cupboard.tool', name: 'Шкаф с инструментами', category: 'construction', stack: 5, verified: true,
      craft: { time: 7.5, bench: 1, output: 1, ingredients: [ { id: 'wood', amount: 1000 } ] }
    },
    {
      id: 'door.hinged.wood', name: 'Деревянная дверь', category: 'construction', stack: 10, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'wood', amount: 300 }
      ] }
    },
    {
      id: 'door.hinged.metal', name: 'Металлическая дверь', category: 'construction', stack: 10, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 150 }
      ] }
    },
    {
      id: 'door.hinged.toptier', name: 'Бронированная дверь', category: 'construction', stack: 10, verified: true,
      craft: { time: 30, bench: 3, output: 1, ingredients: [
        { id: 'metal.refined', amount: 20 },
        { id: 'gears', amount: 5 }
      ] }
    },
    {
      id: 'lock.code', name: 'Кодовый замок', category: 'construction', stack: 50, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [ { id: 'metal.fragments', amount: 100 } ] }
    },
    {
      id: 'lock.key', name: 'Ключевой замок', category: 'construction', stack: 50, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [ { id: 'wood', amount: 75 } ] }
    },
    {
      id: 'furnace', name: 'Печь', category: 'construction', stack: 1, verified: false,
      // В таблице Amigos рецепта нет — рецепт оставлен прежним.
      craft: { output: 1, ingredients: [
        { id: 'stones', amount: 200 },
        { id: 'wood', amount: 50 },
        { id: 'lowgradefuel', amount: 25 }
      ] }
    },
    {
      id: 'furnace.large', name: 'Большая печь', category: 'construction', stack: 1, verified: false,
      craft: { output: 1, ingredients: [
        { id: 'stones', amount: 500 },
        { id: 'wood', amount: 100 },
        { id: 'lowgradefuel', amount: 50 }
      ] }
    },
    {
      id: 'bbq', name: 'Гриль', category: 'construction', stack: 1, verified: false,
      craft: { output: 1, ingredients: [
        { id: 'wood', amount: 100 },
        { id: 'stones', amount: 50 },
        { id: 'lowgradefuel', amount: 10 }
      ] }
    },
    {
      id: 'workbench1', name: 'Верстак 1 уровня', category: 'construction', stack: 1, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [
        { id: 'wood', amount: 500 },
        { id: 'metal.fragments', amount: 100 }
      ] }
    },
    {
      id: 'workbench2', name: 'Верстак 2 уровня', category: 'construction', stack: 1, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 500 },
        { id: 'metal.refined', amount: 20 },
        { id: 'gears', amount: 5 }
      ] }
    },
    {
      id: 'workbench3', name: 'Верстак 3 уровня', category: 'construction', stack: 1, verified: true,
      craft: { time: 3.8, bench: 2, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 1000 },
        { id: 'metal.refined', amount: 100 },
        { id: 'gears', amount: 5 }
      ] }
    },
    {
      id: 'box.wooden', name: 'Деревянный ящик', category: 'construction', stack: 10, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [ { id: 'wood', amount: 100 } ] }
    },
    {
      id: 'stash.small', name: 'Тайник', category: 'construction', stack: 5, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [ { id: 'cloth', amount: 10 } ] }
    },

    /* ---------------- РЕСУРСЫ (сырьё) ---------------- */
    { id: 'wood', name: 'Дерево', category: 'resources', stack: 500000, basePrice: 2, verified: true },
    { id: 'stones', name: 'Камень', category: 'resources', stack: 500000, basePrice: 2, verified: true },
    { id: 'metal.fragments', name: 'Металлические фрагменты', category: 'resources', stack: 500000, basePrice: 4, verified: true },
    { id: 'sulfur', name: 'Сера', category: 'resources', stack: 500000, basePrice: 6, verified: true },
    { id: 'charcoal', name: 'Уголь', category: 'resources', stack: 500000, basePrice: 2, verified: true },
    { id: 'metal.refined', name: 'Металл высокого качества (МВК)', category: 'resources', stack: 100000, basePrice: 60, verified: true },
    { id: 'cloth', name: 'Ткань', category: 'resources', stack: 100000, basePrice: 3, verified: true },
    { id: 'leather', name: 'Кожа', category: 'resources', stack: 100000, basePrice: 4, verified: true },
    { id: 'lowgradefuel', name: 'Низкосортное топливо', category: 'resources', stack: 100000, basePrice: 3, verified: true },
    { id: 'crude.oil', name: 'Сырая нефть', category: 'resources', stack: 100000, basePrice: 4, verified: true },
    { id: 'animal.fat', name: 'Животный жир', category: 'resources', stack: 100000, basePrice: 4, verified: true },
    { id: 'bone.fragments', name: 'Кости', category: 'resources', stack: 5000, basePrice: 2, verified: true },
    { id: 'scrap', name: 'Металлолом (scrap)', category: 'resources', stack: 100000, basePrice: 0.0001, verified: true },

    /* ---------------- КОМПОНЕНТЫ ---------------- */
    {
      id: 'gunpowder', name: 'Порох', category: 'components', stack: 100000, verified: true,
      craft: { time: 0.5, bench: 0, output: 10, ingredients: [
        { id: 'sulfur', amount: 20 },
        { id: 'charcoal', amount: 30 }
      ] }
    },
    {
      id: 'explosives', name: 'Взрывчатка', category: 'components', stack: 100000, verified: true,
      craft: { time: 5, bench: 0, output: 1, ingredients: [
        { id: 'gunpowder', amount: 50 },
        { id: 'lowgradefuel', amount: 3 },
        { id: 'sulfur', amount: 10 },
        { id: 'metal.fragments', amount: 10 }
      ] }
    },
    { id: 'metalpipe', name: 'Металлическая труба', category: 'components', stack: 50, basePrice: 5, verified: true },
    { id: 'gears', name: 'Шестерёнки', category: 'components', stack: 50, basePrice: 6, verified: true },
    { id: 'metalspring', name: 'Металлическая пружина', category: 'components', stack: 50, basePrice: 6, verified: true },
    { id: 'sheetmetal', name: 'Листовой металл', category: 'components', stack: 50, basePrice: 12, verified: true },
    { id: 'roadsigns', name: 'Дорожные знаки', category: 'components', stack: 50, basePrice: 4, verified: true },
    { id: 'tarp', name: 'Брезент', category: 'components', stack: 50, basePrice: 6, verified: true },
    { id: 'rope', name: 'Верёвка', category: 'components', stack: 50, basePrice: 4, verified: true },
    { id: 'sewingkit', name: 'Швейный набор', category: 'components', stack: 50, basePrice: 12, verified: true },
    { id: 'riflebody', name: 'Корпус винтовки', category: 'components', stack: 50, basePrice: 90, verified: true },
    { id: 'smgbody', name: 'Корпус пистолета-пулемёта', category: 'components', stack: 50, basePrice: 45, verified: true },
    { id: 'semibody', name: 'Корпус полуавтоматического оружия', category: 'components', stack: 50, basePrice: 30, verified: true },
    { id: 'techparts', name: 'Технические детали', category: 'components', stack: 50, basePrice: 120, verified: true },
    { id: 'metalblade', name: 'Металлическое лезвие', category: 'components', stack: 50, basePrice: 10, verified: true },
    { id: 'propane.1lb', name: 'Пропановый баллон', category: 'components', stack: 50, basePrice: 8, verified: false },
    { id: 'glue', name: 'Клей', category: 'components', stack: 5000, basePrice: 3, verified: true },
    { id: 'ducttape', name: 'Скотч', category: 'components', stack: 5000, basePrice: 4, verified: true },

    /* ---------------- ЕДА ---------------- */
    { id: 'corn', name: 'Кукуруза', category: 'food', stack: 2000, basePrice: 3, verified: true },
    { id: 'pumpkin', name: 'Тыква', category: 'food', stack: 2000, basePrice: 2, verified: true },
    { id: 'mushroom', name: 'Гриб', category: 'food', stack: 2000, basePrice: 4, verified: true },
    { id: 'apple', name: 'Яблоко', category: 'food', stack: 2000, basePrice: 2, verified: true },
    { id: 'black.raspberries', name: 'Чёрная малина', category: 'food', stack: 2000, basePrice: 3, verified: true },
    { id: 'can.beans', name: 'Банка фасоли', category: 'food', stack: 10, basePrice: 8, verified: true },
    { id: 'can.tuna', name: 'Банка тунца', category: 'food', stack: 10, basePrice: 10, verified: true },

    /* ---------------- МЕДИЦИНА ---------------- */
    {
      id: 'bandage', name: 'Бинт', category: 'medical', stack: 50, verified: true,
      craft: { time: 5, bench: 1, output: 1, ingredients: [ { id: 'cloth', amount: 10 } ] }
    },
    {
      id: 'medkit', name: 'Аптечка', category: 'medical', stack: 50, verified: false,
      // В таблице Amigos есть только большая аптечка — рецепт оставлен прежним.
      craft: { output: 1, ingredients: [
        { id: 'cloth', amount: 20 },
        { id: 'wood', amount: 5 }
      ] }
    },
    {
      id: 'largemedkit', name: 'Большая аптечка', category: 'medical', stack: 50, verified: true,
      craft: { time: 15, bench: 1, output: 1, ingredients: [
        { id: 'cloth', amount: 10 },
        { id: 'syringe.medical', amount: 2 }
      ] }
    },
    {
      id: 'syringe.medical', name: 'Медицинский шприц', category: 'medical', stack: 50, verified: true,
      craft: { time: 10, bench: 2, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 10 },
        { id: 'cloth', amount: 10 },
        { id: 'lowgradefuel', amount: 10 }
      ] }
    },

    /* ---------------- ЭЛЕКТРИЧЕСТВО ---------------- */
    { id: 'battery.small', name: 'Малая батарея', category: 'electrical', stack: 5000, basePrice: 20, verified: false },
    { id: 'solarpanel.large', name: 'Большая солнечная панель', category: 'electrical', stack: 50, basePrice: 150, verified: false },
    { id: 'generator.wind.scrap', name: 'Ветрогенератор', category: 'electrical', stack: 20, basePrice: 200, verified: false },

    /* ---------------- ВЗРЫВЧАТКА ---------------- */
    {
      id: 'explosive.timed', name: 'Взрывной заряд C4', category: 'explosives', stack: 10, verified: false,
      // В таблице Amigos рецепта C4 нет — рецепт ниже не из неё.
      craft: { output: 1, ingredients: [
        { id: 'explosives', amount: 20 },
        { id: 'cloth', amount: 5 },
        { id: 'techparts', amount: 2 },
        { id: 'metal.fragments', amount: 200 }
      ] }
    },
    {
      id: 'explosive.satchel', name: 'Рюкзак со взрывчаткой', category: 'explosives', stack: 100, verified: true,
      craft: { time: 1.3, bench: 1, output: 1, ingredients: [
        { id: 'grenade.beancan', amount: 4 },
        { id: 'stash.small', amount: 1 },
        { id: 'rope', amount: 1 }
      ] }
    },
    {
      id: 'grenade.beancan', name: 'Граната из консервной банки', category: 'explosives', stack: 100, verified: true,
      craft: { time: 2.5, bench: 1, output: 1, ingredients: [
        { id: 'gunpowder', amount: 60 },
        { id: 'metal.fragments', amount: 20 },
        { id: 'cloth', amount: 10 }
      ] }
    },
    {
      id: 'grenade.f1', name: 'Граната F1', category: 'explosives', stack: 100, verified: true,
      craft: { time: 5, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 25 },
        { id: 'gunpowder', amount: 30 }
      ] }
    },
    {
      id: 'grenade.flashbang', name: 'Светошумовая граната', category: 'explosives', stack: 100, verified: true,
      craft: { time: 5, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 50 },
        { id: 'gunpowder', amount: 25 }
      ] }
    },

    /* ---------------- ЛОВУШКИ ---------------- */
    {
      id: 'trap.bear', name: 'Медвежий капкан', category: 'traps', stack: 50, verified: true,
      craft: { time: 3.8, bench: 1, output: 1, ingredients: [
        { id: 'gears', amount: 1 }
      ] }
    },
    {
      id: 'trap.landmine', name: 'Мина', category: 'traps', stack: 100, verified: true,
      craft: { time: 10, bench: 1, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 50 },
        { id: 'gunpowder', amount: 30 }
      ] }
    },

    /* ---------------- РАЗНОЕ ---------------- */
    {
      id: 'research.table', name: 'Стол исследований', category: 'misc', stack: 1, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 200 },
        { id: 'scrap', amount: 20 }
      ] }
    },
    {
      id: 'repair.bench', name: 'Верстак для ремонта', category: 'misc', stack: 1, verified: true,
      craft: { time: 3.8, bench: 0, output: 1, ingredients: [
        { id: 'metal.fragments', amount: 125 }
      ] }
    }
  ]
};
