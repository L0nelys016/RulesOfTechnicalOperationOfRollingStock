export interface Mode {
  id: number;
  text: string;
  ledId?: number;
}

export interface Light {
  id: number;
  name: string;
  image: string;
  instructions: string[];
  notActiveLamps?: string[];
  activeLamps?: string[];
  modes?: Mode[];
}

export interface Stand {
  id: number;
  name: string;
  mainLights: Light[];
  previewLights: Light[];
}

const stands: Stand[] = [
  {
    id: 1,
    name: "Стенд 1",
    mainLights: [
      {
        id: 0,
        name: "П Н",
        image: "/assets/stand1/TrafficLight0.png",
        instructions: ["1. Повторительный светофор 3 выключен.", "2. Маневровый светофор открыт.", "3. Произвольное включение сигналов светофора."],
        notActiveLamps: ["Green NotActive.png"],
        activeLamps: ["Green Active.png"]
      },
      {
        id: 1,
        name: "П В",
        image: "/assets/stand1/TrafficLight1.png",
        instructions: ["1. Движение разрешено с ограничением.", "2. Готовьтесь к остановке."],
        notActiveLamps: ["Yelow NotActive.png"],
        activeLamps: ["Yelow Active.png"]
      },
      {
        id: 2,
        name: "П М",
        image: "/assets/stand1/TrafficLight2.png",
        instructions: ["1. Стой! Запрещено движение."],
        notActiveLamps: ["White NotActive.png"],
        activeLamps: ["White Active.png"]
      },
      {
        id: 3,
        name: "М 1",
        image: "/assets/stand1/TrafficLight3.png",
        instructions: ["1. Повторительный светофор включён.", "2. Маневры разрешены."],
        notActiveLamps: ["Yelow NotActive.png", "Green NotActive.png", "Yelow NotActive.png", "Red NotActive.png", "Yelow NotActive.png", "White NotActive.png"],
        activeLamps: ["Yelow Active.png", "Green Active.png", "Yelow Active.png", "Red Active.png", "Yelow Active.png", "White Active.png"]
      },
      {
        id: 4,
        name: "Светофор 4",
        image: "/assets/stand1/TrafficLight4.png",
        instructions: ["1. Движение по главному пути разрешено."],
        notActiveLamps: ["Yelow NotActive.png", "Green NotActive.png", "Red NotActive.png", "Yelow NotActive.png", "Green NotActive.png", "Green NotActive.png", "Green NotActive.png", "Green NotActive.png", "Green NotActive.png", "Green NotActive.png", "White NotActive.png"],
        activeLamps: ["Yelow Active.png", "Green Active.png", "Red Active.png", "Yelow Active.png", "Green Active.png", "Green Active.png", "Green Active.png", "Green Active.png", "Green Active.png", "Green Active.png", "White Active.png"]
      },
      {
        id: 5,
        name: "Светофор 5",
        image: "/assets/stand1/TrafficLight5.png",
        instructions: ["1. Ограничение скорости."],
        notActiveLamps: ["White NotActive.png", "Blue NotActive.png"],
        activeLamps: ["White Active.png", "Blue Active.png"]
      },
      {
        id: 6,
        name: "Светофор 6",
        image: "/assets/stand1/TrafficLight6.png",
        instructions: ["1. Будьте внимательны."],
        notActiveLamps: ["Green NotActive.png", "Red NotActive.png"],
        activeLamps: ["Green Active.png", "Red Active.png"]
      }
    ],
    previewLights: [
      {
        id: 7,
        name: "Светофор 7",
        image: "/assets/stand1/TrafficLight7.png",
        instructions: ["1. Дополнительный сигнал."],
        notActiveLamps: ["Sprite5 NotActive.png"],
        activeLamps: ["Sprite5 Active.png"]
      },
      {
        id: 8,
        name: "Светофор 8",
        image: "/assets/stand1/TrafficLight8.png",
        instructions: ["1. Манёвры разрешены."],
        notActiveLamps: ["Sprite4 NotActive.png"],
        activeLamps: ["Sprite8.png"]
      },
      {
        id: 9,
        name: "Светофор 9",
        image: "/assets/stand1/TrafficLight9.png",
        instructions: ["1. Стой."],
        notActiveLamps: [],
        activeLamps: []
      }
    ]
  },

  {
  id: 2,
  name: "Стенд 2",
  mainLights: [
    { 
      id: 0, name: "Светофор 0", image: "/assets/stand2/TrafficLight0.png", 
      instructions: ["1. Разрешено движение."],
      notActiveLamps: ["Yelow NotActive.png", "Green NotActive.png", "Red NotActive.png", "Yelow NotActive.png" ],
      activeLamps:   ["Yelow Active.png",   "Green Active.png",   "Red Active.png", "Yelow Active.png"]
    },
    { 
      id: 1, name: "Светофор 1", image: "/assets/stand2/TrafficLight1.png", 
      instructions: ["1. Остановка перед сигналом."],
      notActiveLamps: [
        "Yelow NotActive.png", "Green NotActive.png", "Red NotActive.png",
        "Yelow NotActive.png", "White NotActive.png",
        "Green NotActive.png", "Green NotActive.png", "Green NotActive.png",
        "Green NotActive.png", "Green NotActive.png", "Green NotActive.png"
      ],
      activeLamps: [
        "Yelow Active.png", "Green Active.png", "Red Active.png",
        "Yelow Active.png", "White Active.png",
        "Green Active.png", "Green Active.png", "Green Active.png",
        "Green Active.png", "Green Active.png", "Green Active.png"
      ]
    },
    { 
      id: 2, name: "Светофор 2", image: "/assets/stand2/TrafficLight2.png", 
      instructions: ["1. Въезд разрешён."],
      notActiveLamps: ["Yelow NotActive.png", "Green NotActive.png", "Red NotActive.png", "White NotActive.png"],
      activeLamps:   ["Yelow Active.png",   "Green Active.png",   "Red Active.png",   "White Active.png"]
    },
    { 
      id: 3, name: "Светофор 3", image: "/assets/stand2/TrafficLight3.png", 
      instructions: ["1. Снижение скорости."],
      notActiveLamps: ["Yelow NotActive.png", "Green NotActive.png", "Red NotActive.png", "Green NotActive.png"],
      activeLamps:   ["Yelow Active.png",   "Green Active.png",   "Red Active.png",   "Green Active.png"]
    },
    { 
      id: 4, name: "Светофор 4", image: "/assets/stand2/TrafficLight4.png", 
      instructions: ["1. Главный путь."],
      notActiveLamps: ["Green NotActive.png"],
      activeLamps:   ["Green Active.png"]
    },
    { 
      id: 5, name: "Светофор 5", image: "/assets/stand2/TrafficLight5.png", 
      instructions: ["1. Маневровый режим."],
      notActiveLamps: ["Yelow NotActive.png", "Green NotActive.png", "Red NotActive.png"],
      activeLamps:   ["Yelow Active.png",   "Green Active.png",   "Red Active.png"]
    },
    { 
      id: 6, name: "Светофор 6", image: "/assets/stand2/TrafficLight6.png", 
      instructions: ["1. Внимание."],
      notActiveLamps: ["Green NotActive.png", "Red NotActive.png"],
      activeLamps:   ["Green Active.png",   "Red Active.png"]
    },
  ],
  
   previewLights: [
  { 
    id: 7, 
    name: "Светофор 7", 
    image: "/assets/stand2/TrafficLight7.png", 
    instructions: ["1. Дополнительный манёвр."],
    notActiveLamps: Array(7).fill("White NotActive.png"),   // 7 белых неактивных
    activeLamps:   Array(7).fill("White Active.png")        // 7 белых активных
  },
  { 
    id: 8, 
    name: "Светофор 8", 
    image: "/assets/stand2/TrafficLight8.png", 
    instructions: ["1. Разрешено."],
    notActiveLamps: Array(16).fill("Green NotActive.png"),  // 18 зелёных неактивных
    activeLamps:   Array(16).fill("Green Active.png")       // 18 зелёных активных
  },
  { 
    id: 9, 
    name: "Светофор 9", 
    image: "/assets/stand2/TrafficLight9.png", 
    instructions: ["1. Запрещено."],
    notActiveLamps: ["Sprite3 NotActive.png"],   // одна неактивная лампочка
    activeLamps:   ["Sprite3 Active.png"]               // одна активная
  },
]
  },

 {
  id: 3,
  name: "Стенд 3",
  mainLights: [
    { 
      id: 0, 
      name: "Повторительный светофор 3", 
      image: "/assets/stand3/TrafficLight0.png", 
      instructions: ["1. Повторительный светофор 3 выключен.", "2. Маневровый светофор открыт.", "3. Произвольное включение сигналов."],
      notActiveLamps: ["Green NotActive.png", "Yelow NotActive.png"],
      activeLamps:   ["Green Active.png",   "Yelow Active.png"]
    },
    { 
      id: 1, 
      name: "Светофор 1", 
      image: "/assets/stand3/TrafficLight1.png", 
      instructions: ["1. Основной сигнал."],
      notActiveLamps: ["Yelow NotActive.png"],
      activeLamps:   ["Yelow Active.png"]
    },
    { 
      id: 2, 
      name: "Светофор 2", 
      image: "/assets/stand3/TrafficLight2.png", 
      instructions: ["1. Манёвр разрешён."],
      notActiveLamps: ["Red NotActive.png"],
      activeLamps:   ["Red Active.png"]
    },
    { 
      id: 3, 
      name: "Светофор 3", 
      image: "/assets/stand3/TrafficLight3.png", 
      instructions: ["1. Ограничение."],
      notActiveLamps: [
        "Green NotActive.png",               // 1 зелёный
        ...Array(9).fill("White NotActive.png") // 9 белых (3 ряда по 3)
      ],
      activeLamps: [
        "Green Active.png",
        ...Array(9).fill("White Active.png")
      ]
    },
    { 
      id: 4, 
      name: "Светофор 4", 
      image: "/assets/stand3/TrafficLight4.png", 
      instructions: ["1. Главный путь."],
      notActiveLamps: [
        "Yelow NotActive.png", "Green NotActive.png", "Red NotActive.png", // 3 цветных
        ...Array(5).fill("White NotActive.png"),                           // 5 белых
        "Arrow NotActive.png", "Arrow NotActive.png"                       // 2 стрелки
      ],
      activeLamps: [
        "Yelow Active.png", "Green Active.png", "Red Active.png",
        ...Array(5).fill("White Active.png"),
        "Arrow Active.png", "Arrow Active.png"
      ]
    },
    { 
      id: 5, 
      name: "Светофор 5", 
      image: "/assets/stand3/TrafficLight5.png", 
      instructions: ["1. Снижение скорости."],
      notActiveLamps: [
        "Yelow NotActive.png", "Red NotActive.png", "Green NotActive.png", // порядок: жёлтый, красный, зелёный
        ...Array(9).fill("White NotActive.png")                            // 9 белых (3x3)
      ],
      activeLamps: [
        "Yelow Active.png", "Red Active.png", "Green Active.png",
        ...Array(9).fill("White Active.png")
      ]
    },
    { 
      id: 6, 
      name: "Светофор 6", 
      image: "/assets/stand3/TrafficLight6.png", 
      instructions: ["1. Внимание."],
      notActiveLamps: ["Green NotActive.png", "Red NotActive.png"],
      activeLamps:   ["Green Active.png", "Red Active.png"]
    },
    { 
      id: 7, 
      name: "Маневровый", 
      image: "/assets/stand3/TrafficLight7.png", 
      instructions: ["1. Манёвры разрешены.", "2. Соблюдайте осторожность."],
      notActiveLamps: [
        "Yelow NotActive.png", "Red NotActive.png", "Green NotActive.png",
        ...Array(17).fill("White NotActive.png")
      ],
      activeLamps: [
        "Yelow Active.png", "Red Active.png", "Green Active.png",
        ...Array(17).fill("White Active.png")
      ]
    },
  ],
    previewLights:[
      { 
        id: 8, 
        name: "Светофор 8", 
        image: "/assets/stand3/TrafficLight8.png", 
        instructions: ["1. Дополнительный сигнал 8."],
        notActiveLamps: ["Sprite2 NotActive.png"],
        activeLamps:   ["Sprite2 Active.png"]
      },
      { 
        id: 9, 
        name: "Светофор 9", 
        image: "/assets/stand3/TrafficLight9.png", 
        instructions: ["1. Сигнал 9."],
        notActiveLamps: ["Sprite1 NotActive.png"],
        activeLamps:   ["Sprite1 Active.png"]
      },
      { 
        id: 10, 
        name: "Светофор 10", 
        image: "/assets/stand3/TrafficLight10.png", 
        instructions: ["1. Сигнал 10."],
        notActiveLamps: Array(4).fill("White NotActive.png"), // 2 ряда по 2 => 4 лампы
        activeLamps:   Array(4).fill("White Active.png")
      },
      { 
        id: 11, 
        name: "Светофор 11", 
        image: "/assets/stand3/TrafficLight11.png", 
        instructions: ["1. Сигнал 11."],
        notActiveLamps: Array(4).fill("White NotActive.png"), // 4 белых сверху вниз
        activeLamps:   Array(4).fill("White Active.png")
      },
      { 
        id: 12, 
        name: "Светофор 12", 
        image: "/assets/stand3/TrafficLight12.png", 
        instructions: ["1. Сигнал 12."],
        notActiveLamps: Array(4).fill("White NotActive.png"), // 2 ряда по 2
        activeLamps:   Array(4).fill("White Active.png")
      },
      { 
        id: 13, 
        name: "Светофор 13", 
        image: "/assets/stand3/TrafficLight13.png", 
        instructions: ["1. Сигнал 13."],
        notActiveLamps: Array(4).fill("White NotActive.png"), // 4 белых слева направо
        activeLamps:   Array(4).fill("White Active.png")
      },
      { 
        id: 14, 
        name: "Светофор 14", 
        image: "/assets/stand3/TrafficLight14.png", 
        instructions: ["1. Сигнал 14."],
        notActiveLamps: Array(4).fill("White NotActive.png"), // 4 белых сверху вниз
        activeLamps:   Array(4).fill("White Active.png")
      },
    ]
  }
];

export default stands;