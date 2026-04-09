export interface Mode {
  id: number;
  name?: string;
  text: string;
  ledId: number;
  color?: string;
}

export interface TrafficLightMetaData {
  name: string;
  modes: Mode[];
}

export async function parseMetaFile(filePath: string): Promise<TrafficLightMetaData> {
  try {
    const response = await fetch(filePath);
    const content = await response.text();
    
    const modes: Mode[] = [];
    
    // Парсим все блоки eye и action
    const eyeBlocks = content.match(/eye\s*\{[^}]*\}/gs) || [];
    const actionBlocks = content.match(/action\s*\{[^}]*\}/gs) || [];
    
    let name = '';
    
    // Извлекаем имя из первого eye блока
    if (eyeBlocks.length > 0 && eyeBlocks[0]) {
      const nameMatch = eyeBlocks[0].match(/name:([^$\n]+)/);
      if (nameMatch) {
        name = nameMatch[1].trim();
      }
    }
    
    // Парсим каждый блок action как режим
    actionBlocks.forEach((actionBlock, index) => {
      const textMatch = actionBlock.match(/text:([^$\n]+)/);
      const lidonMatch = actionBlock.match(/LIDON:(\d+)/);
      
      if (textMatch && lidonMatch) {
        modes.push({
          id: index,
          text: textMatch[1].trim(),
          ledId: parseInt(lidonMatch[1]),
          color: eyeBlocks[index] ? extractColor(eyeBlocks[index] || '') : undefined
        });
      }
    });
    
    // Если режимов не найдено, создаём один по умолчанию
    if (modes.length === 0) {
      modes.push({
        id: 0,
        text: 'Режим работы',
        ledId: 1
      });
    }
    
    return {
      name,
      modes
    };
  } catch (error) {
    console.error(`Error parsing meta file ${filePath}:`, error);
    return {
      name: 'Светофор',
      modes: [{
        id: 0,
        text: 'Ошибка загрузки',
        ledId: 1
      }]
    };
  }
}

function extractColor(eyeBlock: string): string | undefined {
  const colorMatch = eyeBlock.match(/color:([^$\n]+)/);
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
