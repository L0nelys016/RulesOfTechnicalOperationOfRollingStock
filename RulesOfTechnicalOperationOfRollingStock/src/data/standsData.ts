export interface Light {
  id: number;
  name: string;
  image: string;
  instructions: string[];
}

export interface Stand {
  id: number;
  name: string;
  mainLights: Light[];      // светофоры в главном окне
  previewLights: Light[];   // светофоры в маленьком нижнем окне
}

const stands: Stand[] = [
  {
    id: 1,
    name: "Стенд 1",
    mainLights: [
      { id: 0, name: "П Н", image: "/assets/stand1/TrafficLight0.png", instructions: ["1. Повторительный светофор 3 выключен.", "2. Маневровый светофор открыт.", "3. Произвольное включение сигналов светофора."] },
      { id: 1, name: "П В", image: "/assets/stand1/TrafficLight1.png", instructions: ["1. Движение разрешено с ограничением.", "2. Готовьтесь к остановке."] },
      { id: 2, name: "П М", image: "/assets/stand1/TrafficLight2.png", instructions: ["1. Стой! Запрещено движение."] },
      { id: 3, name: "М 1", image: "/assets/stand1/TrafficLight3.png", instructions: ["1. Повторительный светофор включён.", "2. Маневры разрешены."] },
      { id: 4, name: "Светофор 4", image: "/assets/stand1/TrafficLight4.png", instructions: ["1. Движение по главному пути разрешено."] },
      { id: 5, name: "Светофор 5", image: "/assets/stand1/TrafficLight5.png", instructions: ["1. Ограничение скорости."] },
      { id: 6, name: "Светофор 6", image: "/assets/stand1/TrafficLight6.png", instructions: ["1. Будьте внимательны."] },
    ],
    previewLights: [
      { id: 7, name: "Светофор 7", image: "/assets/stand1/TrafficLight7.png", instructions: ["1. Дополнительный сигнал."] },
      { id: 8, name: "Светофор 8", image: "/assets/stand1/TrafficLight8.png", instructions: ["1. Манёвры разрешены."] },
      { id: 9, name: "Светофор 9", image: "/assets/stand1/TrafficLight9.png", instructions: ["1. Стой."] },
    ]
  },
  {
    id: 2,
    name: "Стенд 2",
    mainLights: [
      { id: 0, name: "Светофор 0", image: "/assets/stand2/TrafficLight0.png", instructions: ["1. Разрешено движение."] },
      { id: 1, name: "Светофор 1", image: "/assets/stand2/TrafficLight1.png", instructions: ["1. Остановка перед сигналом."] },
      { id: 2, name: "Светофор 2", image: "/assets/stand2/TrafficLight2.png", instructions: ["1. Въезд разрешён."] },
      { id: 3, name: "Светофор 3", image: "/assets/stand2/TrafficLight3.png", instructions: ["1. Снижение скорости."] },
      { id: 4, name: "Светофор 4", image: "/assets/stand2/TrafficLight4.png", instructions: ["1. Главный путь."] },
      { id: 5, name: "Светофор 5", image: "/assets/stand2/TrafficLight5.png", instructions: ["1. Маневровый режим."] },
      { id: 6, name: "Светофор 6", image: "/assets/stand2/TrafficLight6.png", instructions: ["1. Внимание."] },
    ],
    previewLights: [
      { id: 7, name: "Светофор 7", image: "/assets/stand2/TrafficLight7.png", instructions: ["1. Дополнительный манёвр."] },
      { id: 8, name: "Светофор 8", image: "/assets/stand2/TrafficLight8.png", instructions: ["1. Разрешено."] },
      { id: 9, name: "Светофор 9", image: "/assets/stand2/TrafficLight9.png", instructions: ["1. Запрещено."] },
    ]
  },
  {
    id: 3,
    name: "Стенд 3",
    mainLights: [
      { id: 0, name: "Повторительный светофор 3", image: "/assets/stand3/TrafficLight0.png", instructions: ["1. Повторительный светофор 3 выключен.", "2. Маневровый светофор открыт.", "3. Произвольное включение сигналов."] },
      { id: 1, name: "Светофор 1", image: "/assets/stand3/TrafficLight1.png", instructions: ["1. Основной сигнал."] },
      { id: 2, name: "Светофор 2", image: "/assets/stand3/TrafficLight2.png", instructions: ["1. Манёвр разрешён."] },
      { id: 3, name: "Светофор 3", image: "/assets/stand3/TrafficLight3.png", instructions: ["1. Ограничение."] },
      { id: 4, name: "Светофор 4", image: "/assets/stand3/TrafficLight4.png", instructions: ["1. Главный путь."] },
      { id: 5, name: "Светофор 5", image: "/assets/stand3/TrafficLight5.png", instructions: ["1. Снижение скорости."] },
      { id: 6, name: "Светофор 6", image: "/assets/stand3/TrafficLight6.png", instructions: ["1. Внимание."] },
      { id: 7, name: "Маневровый", image: "/assets/stand3/TrafficLight7.png", instructions: ["1. Манёвры разрешены.", "2. Соблюдайте осторожность."] },
    ],
    previewLights: [
      { id: 8, name: "Светофор 8", image: "/assets/stand3/TrafficLight8.png", instructions: ["1. Дополнительный сигнал 8."] },
      { id: 9, name: "Светофор 9", image: "/assets/stand3/TrafficLight9.png", instructions: ["1. Сигнал 9."] },
      { id: 10, name: "Светофор 10", image: "/assets/stand3/TrafficLight10.png", instructions: ["1. Сигнал 10."] },
      { id: 11, name: "Светофор 11", image: "/assets/stand3/TrafficLight11.png", instructions: ["1. Сигнал 11."] },
      { id: 12, name: "Светофор 12", image: "/assets/stand3/TrafficLight12.png", instructions: ["1. Сигнал 12."] },
      { id: 13, name: "Светофор 13", image: "/assets/stand3/TrafficLight13.png", instructions: ["1. Сигнал 13."] },
      { id: 14, name: "Светофор 14", image: "/assets/stand3/TrafficLight14.png", instructions: ["1. Сигнал 14."] },
    ]
  }
];

export default stands;