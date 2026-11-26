/*
 * Экономика Rust — данные.
 * Демо-набор повторяет структуру таблицы rust_economy.xlsx.
 * Полный каталог подставляется кнопкой «Загрузить таблицу» (.xlsx).
 *
 * Поля:
 *   settings  — коэффициенты редкости и множители магазина
 *   resources — ресурсы: цена за штуку, стак, макс. продаж/день, редкость
 *   items     — предметы: рецепт (до 5 ингредиентов), стак, редкость, DLC
 *               craft: true — крафтовый (цена считается по рецепту)
 *               craft: false — некрафтовый: цены берутся из таблицы как есть
 *
 * Цена покупки у магазина = себестоимость × коэффициент редкости × buyMult × (DLC ? dlcMult : 1)
 * Цена продажи магазину  = себестоимость × sellMult × (DLC ? dlcMult : 1)
 */
var RUST_DATA = {
  settings: {
    rubRate: 5,          // 1 ₽ = 5 ₮
    scrapPrice: 0.0001,  // цена 1 скрапа в тугриках: 1 ₮ = 10 000 скрапа
    rarity: {
      'Обычный': 1,
      'Необычный': 1.5,
      'Редкий': 2.5,
      'Эпический': 4,
      'Легендарный': 8
    },
    buyMult: 2.5,        // player pays shop
    sellMult: 0.4,       // shop pays player
    dlcMult: 1.3,        // DLC дороже на 30%
    wb2Mult: 1.5,
    wb3Mult: 2
  },

  resources: [
    { id: 'wood', name: 'Дерево', category: 'Базовые', rarity: 'Обычный', price: 1, stack: 500000, maxPerDay: 500 },
    { id: 'stones', name: 'Камень', category: 'Базовые', rarity: 'Обычный', price: 1, stack: 1000, maxPerDay: 500 },
    { id: 'metal.fragments', name: 'Металлические фрагменты', category: 'Базовые', rarity: 'Обычный', price: 2, stack: 500000, maxPerDay: 300 },
    { id: 'sulfur', name: 'Сера', category: 'Базовые', rarity: 'Обычный', price: 3, stack: 500000, maxPerDay: 200 },
    { id: 'charcoal', name: 'Уголь', category: 'Базовые', rarity: 'Обычный', price: 1, stack: 500000, maxPerDay: 500 },
    { id: 'bone.fragments', name: 'Кость', category: 'Базовые', rarity: 'Обычный', price: 1, stack: 5000, maxPerDay: 300 },
    { id: 'leather', name: 'Кожа', category: 'Базовые', rarity: 'Обычный', price: 2, stack: 100000, maxPerDay: 300 },
    { id: 'cloth', name: 'Ткань', category: 'Базовые', rarity: 'Обычный', price: 2, stack: 100000, maxPerDay: 300 },
    { id: 'fat.animal', name: 'Животный жир', category: 'Базовые', rarity: 'Обычный', price: 2, stack: 100000, maxPerDay: 300 },
    { id: 'rope', name: 'Верёвка', category: 'Базовые', rarity: 'Необычный', price: 5, stack: 50, maxPerDay: 50 },
    { id: 'metal.refined', name: 'Металл высокого качества', category: 'Продвинутые', rarity: 'Редкий', price: 15, stack: 100000, maxPerDay: 50 },
    { id: 'tarp', name: 'Пластик', category: 'Продвинутые', rarity: 'Необычный', price: 4, stack: 50, maxPerDay: 100 },
    { id: 'techparts', name: 'Технический мусор', category: 'Продвинутые', rarity: 'Редкий', price: 10, stack: 50, maxPerDay: 30 },
    { id: 'gears', name: 'Шестерёнки', category: 'Компоненты', rarity: 'Необычный', price: 8, stack: 50, maxPerDay: 20 },
    { id: 'metalspring', name: 'Пружина', category: 'Компоненты', rarity: 'Необычный', price: 8, stack: 20, maxPerDay: 20 },
    { id: 'metalpipe', name: 'Металлическая труба', category: 'Компоненты', rarity: 'Необычный', price: 10, stack: 50, maxPerDay: 20 },
    { id: 'scrap', name: 'Металлический лом', category: 'Компоненты', rarity: 'Обычный', price: 3, stack: 500000, maxPerDay: 200 },
    { id: 'propanetank', name: 'Пропан-бак', category: 'Компоненты', rarity: 'Необычный', price: 12, stack: 50, maxPerDay: 10 },
    { id: 'electric.battery.rechargable.small', name: 'Электрические детали', category: 'Компоненты', rarity: 'Необычный', price: 10, stack: 10, maxPerDay: 20 },
    { id: 'semibody', name: 'Полубоченок', category: 'Компоненты', rarity: 'Необычный', price: 15, stack: 50, maxPerDay: 10 },
    { id: 'sheetmetal', name: 'Листовой металл', category: 'Компоненты', rarity: 'Необычный', price: 12, stack: 50, maxPerDay: 15 },
    { id: 'roadsigns', name: 'Дорожный знак', category: 'Компоненты', rarity: 'Необычный', price: 20, stack: 50, maxPerDay: 10 },
    { id: 'rf.detonator', name: 'RF-передатчик', category: 'Компоненты', rarity: 'Редкий', price: 25, stack: 10, maxPerDay: 5 },
    { id: 'cctv.camera', name: 'Камера', category: 'Компоненты', rarity: 'Редкий', price: 30, stack: 50, maxPerDay: 5 },
    { id: 'explosives', name: 'Взрывчатка', category: 'Взрывчатка', rarity: 'Эпический', price: 200, stack: 100000, maxPerDay: 10 },
    { id: 'corn', name: 'Кукуруза', category: 'Природные', rarity: 'Обычный', price: 1, stack: 1000, maxPerDay: 200 },
    { id: 'pumpkin', name: 'Тыква', category: 'Природные', rarity: 'Обычный', price: 1, stack: 1000, maxPerDay: 200 },
    { id: 'potato', name: 'Картофель', category: 'Природные', rarity: 'Обычный', price: 1, stack: 1000, maxPerDay: 200 },
    { id: 'seed.hemp', name: 'Конопля', category: 'Природные', rarity: 'Обычный', price: 2, stack: 1000, maxPerDay: 200 },
    { id: 'mushroom', name: 'Грибы', category: 'Природные', rarity: 'Обычный', price: 1, stack: 1000, maxPerDay: 200 },
    { id: 'black.raspberries', name: 'Волчьи ягоды', category: 'Природные', rarity: 'Необычный', price: 3, stack: 1000, maxPerDay: 200 },
    { id: 'blueberries', name: 'Черника', category: 'Природные', rarity: 'Необычный', price: 3, stack: 1000, maxPerDay: 200 },
    { id: 'blood', name: 'Кровь', category: 'Медицина', rarity: 'Редкий', price: 20, stack: 1000, maxPerDay: 200 },
    { id: 'riflebody', name: 'Тело винтовки', category: 'Тела оружия', rarity: 'Обычный', price: 120, stack: 20, maxPerDay: 10 },
    { id: 'smgbody', name: 'Тело SMG', category: 'Тела оружия', rarity: 'Обычный', price: 80, stack: 20, maxPerDay: 10 },
    { id: 'sewingkit', name: 'Швейный набор', category: 'Строй. компоненты', rarity: 'Обычный', price: 25, stack: 50, maxPerDay: 10 },
    { id: 'ducttape', name: 'Изолента', category: 'Строй. компоненты', rarity: 'Обычный', price: 15, stack: 50, maxPerDay: 10 },
    { id: 'bleach', name: 'Отбеливатель', category: 'Строй. компоненты', rarity: 'Обычный', price: 10, stack: 50, maxPerDay: 10 },
    { id: 'fuse', name: 'Электрический предохранитель', category: 'Строй. компоненты', rarity: 'Обычный', price: 45, stack: 10, maxPerDay: 10 },
    { id: 'sticks', name: 'Палочки', category: 'Строй. компоненты', rarity: 'Обычный', price: 1, stack: 500, maxPerDay: 10 },
    { id: 'grenade.beancan', name: 'Мешок с бомбой', category: 'Взрывные компоненты', rarity: 'Обычный', price: 80, stack: 10, maxPerDay: 10 }
  ],

  items: [
    { id: 'rifle.ak', name: 'AK-47 (Автомат Калашникова)', category: 'Оружие', rarity: 'Эпический', dlc: false, stack: 1, maxPerDay: 3, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 50 }, { id: 'metal.fragments', amount: 200 }, { id: 'metalspring', amount: 1 }, { id: 'metalpipe', amount: 1 }, { id: 'rf.detonator', amount: 1 }] },
    { id: 'rifle.lr300', name: 'LR-300 (Штурмовая винтовка)', category: 'Оружие', rarity: 'Эпический', dlc: false, stack: 1, maxPerDay: 3, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 40 }, { id: 'metalspring', amount: 4 }, { id: 'metalpipe', amount: 1 }] },
    { id: 'lmg.m249', name: 'M249 (Пулемёт)', category: 'Оружие', rarity: 'Легендарный', dlc: false, stack: 1, maxPerDay: 1, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 50 }, { id: 'metalspring', amount: 4 }, { id: 'metalpipe', amount: 1 }] },
    { id: 'rifle.bolt', name: 'Болтовая винтовка', category: 'Оружие', rarity: 'Эпический', dlc: false, stack: 1, maxPerDay: 3, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 20 }, { id: 'metalspring', amount: 1 }, { id: 'metalpipe', amount: 1 }] },
    { id: 'rifle.semiauto', name: 'Полуавтоматическая винтовка', category: 'Оружие', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 3, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 450 }] },
    { id: 'smg.mp5', name: 'MP5 (Пистолет-пулемёт)', category: 'Оружие', rarity: 'Эпический', dlc: false, stack: 1, maxPerDay: 3, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 50 }, { id: 'metalspring', amount: 10 }, { id: 'metalpipe', amount: 1 }] },
    { id: 'smg.thompson', name: 'Томпсон', category: 'Оружие', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 20 }, { id: 'metalspring', amount: 5 }, { id: 'metalpipe', amount: 1 }] },
    { id: 'smg.2', name: 'Пользовательский SMG', category: 'Оружие', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 15 }, { id: 'metalspring', amount: 3 }, { id: 'metalpipe', amount: 1 }] },
    { id: 'pistol.python', name: 'Пистолет Python', category: 'Оружие', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 10 }, { id: 'metalspring', amount: 1 }, { id: 'metal.fragments', amount: 15 }] },
    { id: 'pistol.semiauto', name: 'Полуавтоматический пистолет', category: 'Оружие', rarity: 'Необычный', dlc: false, stack: 1, maxPerDay: 10, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 8 }, { id: 'metalspring', amount: 1 }, { id: 'metal.fragments', amount: 10 }] },
    { id: 'pistol.eoka', name: 'Пистолет Eoka', category: 'Оружие', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 20, craft: true,
      ingredients: [{ id: 'wood', amount: 50 }, { id: 'metal.fragments', amount: 30 }] },
    { id: 'shotgun.waterpipe', name: 'Ружьё Waterpipe', category: 'Оружие', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 20, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 50 }, { id: 'metalpipe', amount: 1 }] },
    { id: 'shotgun.double', name: 'Двустволка', category: 'Оружие', rarity: 'Необычный', dlc: false, stack: 1, maxPerDay: 10, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 100 }, { id: 'wood', amount: 75 }, { id: 'metalspring', amount: 2 }] },
    { id: 'shotgun.pump', name: 'Помповый дробовик', category: 'Оружие', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'metal.refined', amount: 10 }, { id: 'metal.fragments', amount: 100 }, { id: 'metalspring', amount: 2 }] },
    { id: 'bow.hunting', name: 'Охотничий лук', category: 'Оружие', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 30, craft: true,
      ingredients: [{ id: 'wood', amount: 200 }, { id: 'rope', amount: 1 }] },
    { id: 'crossbow', name: 'Арбалет', category: 'Оружие', rarity: 'Необычный', dlc: false, stack: 1, maxPerDay: 10, craft: true,
      ingredients: [{ id: 'wood', amount: 200 }, { id: 'metal.fragments', amount: 50 }, { id: 'metalspring', amount: 2 }] },
    { id: 'bow.compound', name: 'Составной лук', category: 'Оружие', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 10, craft: true,
      ingredients: [{ id: 'wood', amount: 100 }, { id: 'rope', amount: 1 }, { id: 'metal.fragments', amount: 25 }] },
    { id: 'spear.wooden', name: 'Копьё (деревянное)', category: 'Оружие', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 30, craft: true,
      ingredients: [{ id: 'wood', amount: 300 }] },
    { id: 'stonehatchet', name: 'Каменный топор', category: 'Оружие', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 30, craft: true,
      ingredients: [{ id: 'wood', amount: 200 }, { id: 'stones', amount: 100 }] },
    { id: 'machete', name: 'Мачете', category: 'Оружие', rarity: 'Необычный', dlc: false, stack: 1, maxPerDay: 10, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 75 }, { id: 'wood', amount: 50 }] },

    { id: 'wood.armor.jacket', name: 'Деревянная броня (нагрудник)', category: 'Броня', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 15, craft: true,
      ingredients: [{ id: 'wood', amount: 400 }, { id: 'rope', amount: 2 }] },
    { id: 'bone.armor.suit', name: 'Костяная броня (нагрудник)', category: 'Броня', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 15, craft: true,
      ingredients: [{ id: 'bone.fragments', amount: 80 }, { id: 'rope', amount: 2 }] },
    { id: 'metal.plate.torso', name: 'Металлическая кираса', category: 'Броня', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 50 }] },
    { id: 'roadsign.jacket', name: 'Куртка с дорожным знаком', category: 'Броня', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'roadsigns', amount: 3 }, { id: 'cloth', amount: 20 }] },
    { id: 'metal.facemask', name: 'Металлическая маска', category: 'Броня', rarity: 'Редкий', dlc: false, stack: 1, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 50 }] },
    { id: 'coffeecan.helmet', name: 'Шлем Coffee Can', category: 'Броня', rarity: 'Необычный', dlc: false, stack: 1, maxPerDay: 10, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 60 }] },
    { id: 'wood.armor.helmet', name: 'Деревянный шлем', category: 'Броня', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 20, craft: true,
      ingredients: [{ id: 'wood', amount: 200 }, { id: 'rope', amount: 1 }] },
    { id: 'hazmatsuit', name: 'Снаряжение хазмат', category: 'Броня', rarity: 'Эпический', dlc: true, stack: 10, maxPerDay: 3, craft: true,
      ingredients: [{ id: 'cloth', amount: 50 }, { id: 'tarp', amount: 10 }, { id: 'rope', amount: 2 }] },

    { id: 'explosive.timed', name: 'C4 (Зарядное устройство)', category: 'Взрывчатка', rarity: 'Легендарный', dlc: false, stack: 100, maxPerDay: 1, craft: true,
      ingredients: [{ id: 'explosives', amount: 20 }, { id: 'cloth', amount: 5 }, { id: 'techparts', amount: 2 }] },
    { id: 'ammo.rocket.basic', name: 'Ракета', category: 'Взрывчатка', rarity: 'Легендарный', dlc: false, stack: 200, maxPerDay: 2, craft: true,
      ingredients: [{ id: 'explosives', amount: 10 }, { id: 'metal.fragments', amount: 100 }] },
    { id: 'ammo.rocket.fire', name: 'Зажигательная ракета', category: 'Взрывчатка', rarity: 'Эпический', dlc: false, stack: 200, maxPerDay: 3, craft: true,
      ingredients: [{ id: 'fat.animal', amount: 250 }, { id: 'metal.fragments', amount: 100 }] },
    { id: 'grenade.f1', name: 'Ручная граната', category: 'Взрывчатка', rarity: 'Редкий', dlc: false, stack: 100, maxPerDay: 5, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 30 }, { id: 'explosives', amount: 5 }, { id: 'rope', amount: 1 }] },
    { id: 'explosive.satchel', name: 'Сэтчел-заряд', category: 'Взрывчатка', rarity: 'Редкий', dlc: false, stack: 100, maxPerDay: 2, craft: true,
      ingredients: [{ id: 'grenade.beancan', amount: 4 }, { id: 'rope', amount: 1 }] },

    { id: 'ammo.rifle.explosive', name: 'Взрывчатый патрон', category: 'Боеприпасы', rarity: 'Редкий', dlc: false, stack: 5000, maxPerDay: 20, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 10 }, { id: 'sulfur', amount: 20 }, { id: 'charcoal', amount: 3 }] },
    { id: 'ammo.pistol', name: 'Пистолетный патрон', category: 'Боеприпасы', rarity: 'Обычный', dlc: false, stack: 2000, maxPerDay: 200, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 10 }, { id: 'sulfur', amount: 5 }, { id: 'charcoal', amount: 3 }] },
    { id: 'ammo.rifle', name: '5.56 патрон', category: 'Боеприпасы', rarity: 'Необычный', dlc: false, stack: 5000, maxPerDay: 100, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 10 }, { id: 'sulfur', amount: 10 }, { id: 'charcoal', amount: 3 }] },
    { id: 'ammo.handmade.shell', name: 'Дробь', category: 'Боеприпасы', rarity: 'Обычный', dlc: false, stack: 5000, maxPerDay: 100, craft: true,
      ingredients: [{ id: 'metal.fragments', amount: 10 }, { id: 'sulfur', amount: 5 }, { id: 'charcoal', amount: 3 }] },
    { id: 'arrow.wooden', name: 'Стрела (деревянная)', category: 'Боеприпасы', rarity: 'Обычный', dlc: false, stack: 500, maxPerDay: 100, craft: true,
      ingredients: [{ id: 'wood', amount: 25 }, { id: 'stones', amount: 10 }] },
    { id: 'arrow.bone', name: 'Стрела костяная', category: 'Боеприпасы', rarity: 'Обычный', dlc: false, stack: 500, maxPerDay: 100, craft: true,
      ingredients: [{ id: 'wood', amount: 25 }, { id: 'bone.fragments', amount: 5 }] },

    { id: 'gunrack.horizontal', name: 'Стойка с оружием', category: 'Строительство', rarity: 'Обычный', dlc: false, stack: 1, maxPerDay: 10, craft: true,
      ingredients: [{ id: 'wood', amount: 300 }, { id: 'metal.fragments', amount: 75 }] },

    { id: 'shotgun.spas12', name: 'SPAS-12', category: 'Оружие', rarity: 'Легендарный', dlc: false, stack: 1, maxPerDay: 0, craft: false,
      buy: 1000, sell: 20, source: 'Военный ящик, Элитный ящик' },
    { id: 'rifle.m39', name: 'M39 (Ружьё рейнджера)', category: 'Оружие', rarity: 'Легендарный', dlc: false, stack: 1, maxPerDay: 0, craft: false,
      buy: 900, sell: 18, source: 'Военный ящик' }
  ]
};
