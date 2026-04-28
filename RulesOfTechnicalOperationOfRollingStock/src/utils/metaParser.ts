export interface Mode {
  id: number;
  number: number;
  text: string;
  ledIds?: number[];
  activeLampIndexes?: number[];
  blinkingLampIndexes?: number[];
  color?: string;
}

export interface TrafficLightMetaData {
  name: string;
  modes: Mode[];
  ledMap: Record<number, number[]>;
}

interface EyeInfo {
  ledId: number;
  color?: string;
}

export async function parseMetaFile(filePath: string): Promise<TrafficLightMetaData> {
  try {
    const response = await fetch(filePath);
    const content = await response.text();

    const eyeBlocks = content.match(/eye\s*\{[^}]*\}/gs) || [];
    const actionBlocks = content.match(/action\s*\{[^}]*\}/gs) || [];

    const eyes = eyeBlocks.map(extractEyeInfo);
    const ledMap: Record<number, number[]> = {};

    eyes.forEach((eye, index) => {
      if (!ledMap[eye.ledId]) {
        ledMap[eye.ledId] = [];
      }
      ledMap[eye.ledId].push(index);
    });

    let name = '';
    const firstEye = eyeBlocks[0];
    if (firstEye) {
      const nameMatch = firstEye.match(/name:([^$\n]+)/);
      if (nameMatch) {
        name = nameMatch[1].trim();
      }
    }

    const actionModes: Mode[] = actionBlocks.map((actionBlock, index) => {
      const textMatch = actionBlock.match(/text:([^$\n]+)/);
      const lidonMatch = actionBlock.match(/LIDON:([0-9,]+)/gi);
      const lidblinkMatch = actionBlock.match(/LIDBLINK:([0-9,]+)/gi);

      const lidonIds = lidonMatch ? lidonMatch.flatMap(match => match.replace(/LIDON:/i, '').split(',').map(id => parseInt(id.trim(), 10)).filter(id => !Number.isNaN(id))) : [];
      const lidblinkIds = lidblinkMatch ? lidblinkMatch.flatMap(match => match.replace(/LIDBLINK:/i, '').split(',').map(id => parseInt(id.trim(), 10)).filter(id => !Number.isNaN(id))) : [];

      const activeLampIndexes = lidonIds.flatMap((ledId) => ledMap[ledId] || []);
      const blinkingLampIndexes = lidblinkIds.flatMap((ledId) => ledMap[ledId] || []);

      const color = activeLampIndexes.length === 1 ? extractColor(eyeBlocks[activeLampIndexes[0]] || '') : undefined;

      return {
        id: index + 1,
        number: index + 2,
        text: textMatch ? textMatch[1].trim() : `Режим ${index + 2}`,
        ledIds: lidonIds,
        activeLampIndexes,
        blinkingLampIndexes,
        color
      };
    });

    const firstMode: Mode = {
      id: 0,
      number: 1,
      text: `${name || 'Светофор'} выключен`,
      ledIds: [],
      activeLampIndexes: []
    };

    const finalMode: Mode = {
      id: actionModes.length + 1,
      number: actionModes.length + 2,
      text: 'Произвольное включение сигналов светофора',
      ledIds: [],
      activeLampIndexes: []
    };

    const modes: Mode[] = [firstMode, ...actionModes, finalMode];

    return {
      name: name || 'Светофор',
      ledMap,
      modes
    };
  } catch (error) {
    console.error(`Error parsing meta file ${filePath}:`, error);
    return {
      name: 'Светофор',
      ledMap: {},
      modes: [{
        id: 0,
        number: 1,
        text: 'Ошибка загрузки',
        ledIds: [],
        activeLampIndexes: []
      }]
    };
  }
}

function extractEyeInfo(eyeBlock: string): EyeInfo {
  const ledIdMatch = eyeBlock.match(/LedId:([0-9]+)/i);
  const colorMatch = eyeBlock.match(/color:([^$\n]+)/i);

  return {
    ledId: ledIdMatch ? parseInt(ledIdMatch[1], 10) : 0,
    color: colorMatch ? colorMatch[1].trim() : undefined
  };
}

function extractColor(eyeBlock: string): string | undefined {
  const colorMatch = eyeBlock.match(/color:([^$\n]+)/i);
  return colorMatch ? colorMatch[1].trim() : undefined;
}

export async function loadAllTrafficLightModes(standId: number, maxLights: number = 10): Promise<TrafficLightMetaData[]> {
  const modesData: TrafficLightMetaData[] = [];

  for (let i = 0; i < maxLights; i++) {
    const filePath = `assets/stand${standId}/TrafficLight${i}.meta`;
    try {
      const data = await parseMetaFile(filePath);
      modesData.push(data);
    } catch (error) {
      console.warn(`Failed to load TrafficLight${i}.meta`);
    }
  }

  return modesData;
}

