/* Полный список ресурсов и компонентов Rust, которые игра использует в крафте как ингредиенты.
 * Источник: данные игры (data/items.json из bobosneefdev/rust-items-json) + русские названия из локализации.
 * Поле stack — размер стака по умолчанию в ванильной игре. */
var RUST_GAME_RESOURCES = [
  {
    "id": "vehicle.1mod.storage",
    "en": "Storage Vehicle Module",
    "name": "Багажный модуль",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.chassis.4mod",
    "en": "Large Chassis",
    "name": "Большое шасси",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "tarp",
    "en": "Tarp",
    "name": "Брезент",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "vehicle.1mod.cockpit.armored",
    "en": "Armored Cockpit Vehicle Module",
    "name": "Бронированный модуль",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.1mod.passengers.armored",
    "en": "Armored Passenger Vehicle Module",
    "name": "Бронированный пассажирский модуль",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "rope",
    "en": "Rope",
    "name": "Верёвка",
    "category": "Компоненты",
    "stack": 50,
    "rarity": "Необычный"
  },
  {
    "id": "roadsigns",
    "en": "Road Signs",
    "name": "Дорожные знаки",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "vehicle.1mod.cockpit.with.engine",
    "en": "Cockpit With Engine Vehicle Module",
    "name": "Кабина с двигателем",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "carburetor3",
    "en": "High Quality Carburetor",
    "name": "Карбюратор высокого качества",
    "category": "Компоненты",
    "stack": 5,
    "rarity": "Обычный"
  },
  {
    "id": "carburetor1",
    "en": "Low Quality Carburetor",
    "name": "Карбюратор низкого качества",
    "category": "Компоненты",
    "stack": 5,
    "rarity": "Обычный"
  },
  {
    "id": "carburetor2",
    "en": "Medium Quality Carburetor",
    "name": "Карбюратор среднего качества",
    "category": "Компоненты",
    "stack": 5,
    "rarity": "Обычный"
  },
  {
    "id": "valve3",
    "en": "High Quality Valves",
    "name": "Клапаны высокого качества",
    "category": "Компоненты",
    "stack": 15,
    "rarity": "Обычный"
  },
  {
    "id": "valve1",
    "en": "Low Quality Valves",
    "name": "Клапаны низкого качества",
    "category": "Компоненты",
    "stack": 15,
    "rarity": "Обычный"
  },
  {
    "id": "valve2",
    "en": "Medium Quality Valves",
    "name": "Клапаны среднего качества",
    "category": "Компоненты",
    "stack": 15,
    "rarity": "Обычный"
  },
  {
    "id": "glue",
    "en": "Glue",
    "name": "Клей",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Необычный"
  },
  {
    "id": "crankshaft3",
    "en": "High Quality Crankshaft",
    "name": "Коленчатый вал высокого качества",
    "category": "Компоненты",
    "stack": 5,
    "rarity": "Обычный"
  },
  {
    "id": "crankshaft1",
    "en": "Low Quality Crankshaft",
    "name": "Коленчатый вал низкого качества",
    "category": "Компоненты",
    "stack": 5,
    "rarity": "Обычный"
  },
  {
    "id": "crankshaft2",
    "en": "Medium Quality Crankshaft",
    "name": "Коленчатый вал среднего качества",
    "category": "Компоненты",
    "stack": 5,
    "rarity": "Обычный"
  },
  {
    "id": "riflebody",
    "en": "Rifle Body",
    "name": "Корпус винтовки",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Эпический"
  },
  {
    "id": "smgbody",
    "en": "SMG Body",
    "name": "Корпус пистолет-пулемёта",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Редкий"
  },
  {
    "id": "semibody",
    "en": "Semi Automatic Body",
    "name": "Корпус полуавтомата",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Редкий"
  },
  {
    "id": "sheetmetal",
    "en": "Sheet Metal",
    "name": "Листовой металл",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "vehicle.chassis.2mod",
    "en": "Small Chassis",
    "name": "Маленькое шасси",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "metalspring",
    "en": "Metal Spring",
    "name": "Металлическая пружина",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Редкий"
  },
  {
    "id": "metalpipe",
    "en": "Metal Pipe",
    "name": "Металлическая труба",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Редкий"
  },
  {
    "id": "metalblade",
    "en": "Metal Blade",
    "name": "Металлическое лезвие",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "vehicle.2mod.camper",
    "en": "Camper Vehicle Module",
    "name": "Модуль автофургона",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.1mod.engine",
    "en": "Engine Vehicle Module",
    "name": "Модуль двигателя транспорта",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.2mod.flatbed",
    "en": "Large Flatbed Vehicle Module",
    "name": "Модуль для Большого Грузовика",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.1mod.rear.seats",
    "en": "Rear Seats Vehicle Module",
    "name": "Модуль задних сидений",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.1mod.cockpit",
    "en": "Cockpit Vehicle Module",
    "name": "Модуль кабины транспорта",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "aiming.module.mlrs",
    "en": "Aiming Module",
    "name": "Модуль наведения РСЗО",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "weapon.mod.burstmodule",
    "en": "Burst Module",
    "name": "Модуль очерёдной стрельбы",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.1mod.flatbed",
    "en": "Flatbed Vehicle Module",
    "name": "Модуль платформа автомобиля",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "vehicle.1mod.taxi",
    "en": "Taxi Vehicle Module",
    "name": "Модуль такси",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "sewingkit",
    "en": "Sewing Kit",
    "name": "Набор для шитья",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "bleach",
    "en": "Bleach",
    "name": "Отбеливатель",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "sticks",
    "en": "Sticks",
    "name": "Палочки",
    "category": "Компоненты",
    "stack": 100,
    "rarity": "Необычный"
  },
  {
    "id": "vehicle.2mod.passengers",
    "en": "Passenger Vehicle Module",
    "name": "Пассажирский модуль",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "piston3",
    "en": "High Quality Pistons",
    "name": "Поршни высокого качества",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Обычный"
  },
  {
    "id": "piston1",
    "en": "Low Quality Pistons",
    "name": "Поршни низкого качества",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Обычный"
  },
  {
    "id": "piston2",
    "en": "Medium Quality Pistons",
    "name": "Поршни среднего качества",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Обычный"
  },
  {
    "id": "propanetank",
    "en": "Empty Propane Tank",
    "name": "Пропановый баллон",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "sparkplug3",
    "en": "High Quality Spark Plugs",
    "name": "Свеча зажигания высокого качества",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Обычный"
  },
  {
    "id": "sparkplug1",
    "en": "Low Quality Spark Plugs",
    "name": "Свеча зажигания низкого качества",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Обычный"
  },
  {
    "id": "sparkplug2",
    "en": "Medium Quality Spark Plugs",
    "name": "Свеча зажигания среднего качества",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Обычный"
  },
  {
    "id": "ducttape",
    "en": "Duct Tape",
    "name": "Скотч",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Необычный"
  },
  {
    "id": "vehicle.chassis.3mod",
    "en": "Medium Chassis",
    "name": "Среднее шасси",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "techparts",
    "en": "Tech Trash",
    "name": "Старые микросхемы",
    "category": "Компоненты",
    "stack": 50,
    "rarity": "Эпический"
  },
  {
    "id": "vehicle.2mod.fuel.tank",
    "en": "Fuel Tank Vehicle Module",
    "name": "Топливный бак",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.salvage",
    "en": "Salvage Workbench Upgrade",
    "name": "Улучшение верстака на выгоду",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.defensive",
    "en": "Defensive Workbench Upgrade",
    "name": "Улучшение верстака на защиту",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.surplus",
    "en": "Surplus Workbench Upgrade",
    "name": "Улучшение верстака на излишки",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.comfort",
    "en": "Comfort Workbench Upgrade",
    "name": "Улучшение верстака на комфорт",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.prototype",
    "en": "Prototype Workbench Upgrade",
    "name": "Улучшение верстака на прототип",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.range",
    "en": "Range Workbench Upgrade",
    "name": "Улучшение верстака на радиус",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.accelerated",
    "en": "Accelerated Workbench Upgrade",
    "name": "Улучшение верстака на скорость",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.reinforced",
    "en": "Reinforced Workbench Upgrade",
    "name": "Улучшение верстака на укрепление",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.recyclebin",
    "en": "Recycle Bin Workbench Upgrade",
    "name": "Улучшение верстака на утилизацию",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "workbench.upgrade.efficiency",
    "en": "Efficiency Workbench Upgrade",
    "name": "Улучшение верстака на эффективность",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "gears",
    "en": "Gears",
    "name": "Шестерни",
    "category": "Компоненты",
    "stack": 20,
    "rarity": "Редкий"
  },
  {
    "id": "fuse",
    "en": "Electric Fuse",
    "name": "Электрический предохранитель",
    "category": "Компоненты",
    "stack": 10,
    "rarity": "Редкий"
  },
  {
    "id": "advancedblueprintfragment",
    "en": "Advanced Blueprint Fragment",
    "name": "Advanced Blueprint Fragment",
    "category": "Компоненты",
    "stack": 100,
    "rarity": "Обычный"
  },
  {
    "id": "basicblueprintfragment",
    "en": "Basic Blueprint Fragment",
    "name": "Basic Blueprint Fragment",
    "category": "Компоненты",
    "stack": 100,
    "rarity": "Обычный"
  },
  {
    "id": "vehicle.chassis",
    "en": "Generic vehicle chassis",
    "name": "Generic vehicle chassis",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "vehicle.module",
    "en": "Generic vehicle module",
    "name": "Generic vehicle module",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "fuse.highgrade",
    "en": "Heavy Fuse",
    "name": "Heavy Fuse",
    "category": "Компоненты",
    "stack": 3,
    "rarity": "Эпический"
  },
  {
    "id": "thruster.module",
    "en": "Thruster Module",
    "name": "Thruster Module",
    "category": "Компоненты",
    "stack": 1,
    "rarity": "Редкий"
  },
  {
    "id": "battery.small",
    "en": "Battery - Small",
    "name": "Аккумулятор - маленький",
    "category": "Ресурсы",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "paper",
    "en": "Paper",
    "name": "Бумага",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "explosives",
    "en": "Explosives",
    "name": "Взрывчатое вещество",
    "category": "Ресурсы",
    "stack": 100,
    "rarity": "Эпический"
  },
  {
    "id": "water",
    "en": "Water",
    "name": "Вода",
    "category": "Ресурсы",
    "stack": 2147483647,
    "rarity": "Обычный"
  },
  {
    "id": "hq.metal.ore",
    "en": "High Quality Metal Ore",
    "name": "Высококачественная железная руда",
    "category": "Ресурсы",
    "stack": 100,
    "rarity": "Редкий"
  },
  {
    "id": "wood",
    "en": "Wood",
    "name": "Дерево",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "diesel_barrel",
    "en": "Diesel Fuel",
    "name": "Дизельное топливо",
    "category": "Ресурсы",
    "stack": 20,
    "rarity": "Обычный"
  },
  {
    "id": "metal.ore",
    "en": "Metal Ore",
    "name": "Железная руда",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Необычный"
  },
  {
    "id": "fat.animal",
    "en": "Animal Fat",
    "name": "Животный жир",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "coal",
    "en": "Coal :(",
    "name": "Каменный уголь",
    "category": "Ресурсы",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "cctv.camera",
    "en": "CCTV Camera",
    "name": "Камера видеонаблюдения",
    "category": "Ресурсы",
    "stack": 64,
    "rarity": "Эпический"
  },
  {
    "id": "stones",
    "en": "Stones",
    "name": "Камни",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "leather",
    "en": "Leather",
    "name": "Кожа",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Необычный"
  },
  {
    "id": "targeting.computer",
    "en": "Targeting Computer",
    "name": "Компьютер наведения",
    "category": "Ресурсы",
    "stack": 64,
    "rarity": "Эпический"
  },
  {
    "id": "horsedung",
    "en": "Dung",
    "name": "Конский навоз",
    "category": "Ресурсы",
    "stack": 100,
    "rarity": "Эпический"
  },
  {
    "id": "metal.refined",
    "en": "High Quality Metal",
    "name": "Металл высокого качества",
    "category": "Ресурсы",
    "stack": 100,
    "rarity": "Редкий"
  },
  {
    "id": "scrap",
    "en": "Scrap",
    "name": "Металлолом",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Необычный"
  },
  {
    "id": "bone.fragments",
    "en": "Bone Fragments",
    "name": "Обломки костей",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "gunpowder",
    "en": "Gun Powder",
    "name": "Порох",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Эпический"
  },
  {
    "id": "can.tuna.empty",
    "en": "Empty Tuna Can",
    "name": "Пустая банка из-под тунца",
    "category": "Ресурсы",
    "stack": 10,
    "rarity": "Обычный"
  },
  {
    "id": "can.beans.empty",
    "en": "Empty Can Of Beans",
    "name": "Пустая банка из-под фасоли",
    "category": "Ресурсы",
    "stack": 10,
    "rarity": "Обычный"
  },
  {
    "id": "water.radioactive",
    "en": "Radioactive Water",
    "name": "Радиоактивная вода",
    "category": "Ресурсы",
    "stack": 2147483647,
    "rarity": "Обычный"
  },
  {
    "id": "plantfiber",
    "en": "Plant Fiber",
    "name": "Растительные Волокна",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "kickgems",
    "en": "Gems",
    "name": "Самоцветы",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "sulfur",
    "en": "Sulfur",
    "name": "Сера",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Редкий"
  },
  {
    "id": "sulfur.ore",
    "en": "Sulfur Ore",
    "name": "Серная руда",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Редкий"
  },
  {
    "id": "dogtagneutral",
    "en": "Dog Tag",
    "name": "Солдатский жетон",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "water.salt",
    "en": "Salt Water",
    "name": "Солёная вода",
    "category": "Ресурсы",
    "stack": 2147483647,
    "rarity": "Обычный"
  },
  {
    "id": "crude.oil",
    "en": "Crude Oil",
    "name": "Сырая нефть",
    "category": "Ресурсы",
    "stack": 500,
    "rarity": "Обычный"
  },
  {
    "id": "cloth",
    "en": "Cloth",
    "name": "Ткань",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Необычный"
  },
  {
    "id": "lowgradefuel",
    "en": "Low Grade Fuel",
    "name": "Топливо низкого качества",
    "category": "Ресурсы",
    "stack": 500,
    "rarity": "Обычный"
  },
  {
    "id": "charcoal",
    "en": "Charcoal",
    "name": "Уголь",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "fertilizer",
    "en": "Fertilizer",
    "name": "Удобрение",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "metal.fragments",
    "en": "Metal Fragments",
    "name": "Фрагменты металла",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Необычный"
  },
  {
    "id": "skull.wolf",
    "en": "Wolf Skull",
    "name": "Череп волка",
    "category": "Ресурсы",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "skull.human",
    "en": "Human Skull",
    "name": "Череп человека",
    "category": "Ресурсы",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "nucleus",
    "en": "Beehive Nucleus",
    "name": "Ядро улья",
    "category": "Ресурсы",
    "stack": 1,
    "rarity": "Обычный"
  },
  {
    "id": "bluedogtags",
    "en": "Blue Dog Tags",
    "name": "Blue Dog Tags",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "blueidtag",
    "en": "Blue ID Tag",
    "name": "Blue ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "grayidtag",
    "en": "Gray ID Tag",
    "name": "Gray ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "greenidtag",
    "en": "Green ID Tag",
    "name": "Green ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "lavenderidtag",
    "en": "Lavender ID Tag",
    "name": "Lavender ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "mintidtag",
    "en": "Mint ID Tag",
    "name": "Mint ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "orangeidtag",
    "en": "Orange ID Tag",
    "name": "Orange ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "pinkidtag",
    "en": "Pink ID Tag",
    "name": "Pink ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "purpleidtag",
    "en": "Purple ID Tag",
    "name": "Purple ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "reddogtags",
    "en": "Red Dog Tags",
    "name": "Red Dog Tags",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "redidtag",
    "en": "Red ID Tag",
    "name": "Red ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "researchpaper",
    "en": "Research Paper",
    "name": "Research Paper",
    "category": "Ресурсы",
    "stack": 1000,
    "rarity": "Обычный"
  },
  {
    "id": "whiteidtag",
    "en": "White ID Tag",
    "name": "White ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  },
  {
    "id": "wool",
    "en": "Wool",
    "name": "Wool",
    "category": "Ресурсы",
    "stack": 100,
    "rarity": "Обычный"
  },
  {
    "id": "yellowidtag",
    "en": "Yellow ID Tag",
    "name": "Yellow ID Tag",
    "category": "Ресурсы",
    "stack": 5000,
    "rarity": "Обычный"
  }
];
