export interface Mode {
  id: number;
  text: string;
  ledIds?: number[];
  activeLampIndexes?: number[];
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

    const modes: Mode[] = actionBlocks.map((actionBlock, index) => {
      const textMatch = actionBlock.match(/text:([^$\n]+)/);
      const lidonMatch = actionBlock.match(/LIDON:([0-9,]+)\$/);
      const ledIds = lidonMatch
        ? lidonMatch[1].split(',').map((value) => parseInt(value.trim(), 10)).filter((id) => !Number.isNaN(id))
        : [];

      const activeLampIndexes = ledIds.flatMap((ledId) => ledMap[ledId] || []);
      const color = activeLampIndexes.length === 1 ? extractColor(eyeBlocks[activeLampIndexes[0]] || '') : undefined;

      return {
        id: index,
        text: textMatch ? textMatch[1].trim() : `Режим ${index + 1}`,
        ledIds,
        activeLampIndexes,
        color
      };
    });

    if (modes.length === 0) {
      return {
        name: name || 'Светофор',
        ledMap,
        modes: [{
          id: 0,
          text: 'Режим работы',
          ledIds: [],
          activeLampIndexes: []
        }]
      };
    }

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
    const filePath = `/assets/stand${standId}/TrafficLight${i}.meta`;
    try {
      const data = await parseMetaFile(filePath);
      modesData.push(data);
    } catch (error) {
      console.warn(`Failed to load TrafficLight${i}.meta`);
    }
  }

  return modesData;
}
