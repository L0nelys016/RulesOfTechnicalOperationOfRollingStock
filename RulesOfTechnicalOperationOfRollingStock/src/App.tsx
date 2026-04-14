import { useState, useEffect } from 'react';
import standsData, { Stand, Light, Mode } from './data/standsData';
import { parseMetaFile } from './utils/metaParser';
import './styles/App.css';
import './styles/stands/stand1.css';
import './styles/stands/stand2.css';
import './styles/stands/stand3.css';

function App() {
  const [currentStand, setCurrentStand] = useState<Stand>(standsData[0]);
  const [selectedLight, setSelectedLight] = useState<Light | null>(null);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [selectedModeMap, setSelectedModeMap] = useState<Record<string, number>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showBlackScreen, setShowBlackScreen] = useState(false);
  const [activeLampMap, setActiveLampMap] = useState<Record<string, number[]>>({});
  const [blinkingLampMap, setBlinkingLampMap] = useState<Record<string, number[]>>({});
  const [blinkState, setBlinkState] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState((prev) => !prev);
    }, 500); // Мигание каждые 500мс

    return () => clearInterval(interval);
  }, []);

  const getLightKey = (light: Light, standId: number = currentStand.id) => `${standId}-${light.id}-${light.image}`;

  const getActiveIndexes = (light: Light) => {
    return activeLampMap[getLightKey(light)] || [];
  };

  const getBlinkingIndexes = (light: Light) => {
    return blinkingLampMap[getLightKey(light)] || [];
  };

  const getModeLampIndexes = (mode: Mode) => {
    const activeIndexes = mode.activeLampIndexes || [];
    const blinkingIndexes = mode.blinkingLampIndexes || [];
    return { activeIndexes, blinkingIndexes };
  };

  const isFinalMode = (light: Light, mode: Mode): boolean => {
    return !!light.modes && mode.id === light.modes[light.modes.length - 1]?.id;
  };

  const normalizeIndexes = (indexes: number[]) => [...indexes].sort((a, b) => a - b);

  const findMatchingMode = (light: Light, activeIndexes: number[], blinkingIndexes: number[]): Mode | undefined => {
    if (!light.modes) return undefined;

    const normalizedActive = normalizeIndexes(activeIndexes);
    const normalizedBlinking = normalizeIndexes(blinkingIndexes);

    return light.modes.find((mode) => {
      const { activeIndexes: modeActive, blinkingIndexes: modeBlinking } = getModeLampIndexes(mode);
      const normalizedModeActive = normalizeIndexes(modeActive);
      const normalizedModeBlinking = normalizeIndexes(modeBlinking);

      return (
        normalizedActive.length === normalizedModeActive.length &&
        normalizedActive.every((value, index) => value === normalizedModeActive[index]) &&
        normalizedBlinking.length === normalizedModeBlinking.length &&
        normalizedBlinking.every((value, index) => value === normalizedModeBlinking[index])
      );
    });
  };

  const setActiveIndexesForLight = (light: Light, activeIndexes: number[], blinkingIndexes: number[] = []) => {
    const key = getLightKey(light);

    setActiveLampMap((prev) => ({
      ...prev,
      [key]: activeIndexes,
    }));

    setBlinkingLampMap((prev) => ({
      ...prev,
      [key]: blinkingIndexes,
    }));

    if (!selectedLight || selectedLight.id !== light.id) {
      return;
    }

    const matchedMode = findMatchingMode(light, activeIndexes, blinkingIndexes);
    if (matchedMode) {
      setSelectedMode(matchedMode);
      setSelectedModeMap((prev) => ({
        ...prev,
        [key]: matchedMode.id,
      }));
      return;
    }

    const finalMode = light.modes?.[light.modes.length - 1];
    if (finalMode) {
      setSelectedMode(finalMode);
      setSelectedModeMap((prev) => ({
        ...prev,
        [key]: finalMode.id,
      }));
      return;
    }

    setSelectedMode(null);
  };

  const toggleLamp = (light: Light, index: number) => {
    const key = getLightKey(light);
    const current = activeLampMap[key] || [];
    const nextIndexes = current.includes(index)
      ? current.filter((i) => i !== index)
      : [...current, index];

    setActiveIndexesForLight(light, nextIndexes);
  };

  const applyModeToLight = (light: Light, mode: Mode) => {
    if (isFinalMode(light, mode)) {
      return;
    }

    const key = getLightKey(light);
    const { activeIndexes, blinkingIndexes } = getModeLampIndexes(mode);

    setActiveLampMap((prev) => ({
      ...prev,
      [key]: activeIndexes,
    }));

    setBlinkingLampMap((prev) => ({
      ...prev,
      [key]: blinkingIndexes,
    }));
  };

  const handleStandClick = (stand: Stand) => {
    if (stand.id === currentStand.id) return;

    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentStand(stand);
      setSelectedLight(null);
      setSelectedMode(null);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handleLightClick = async (light: Light, e: React.MouseEvent) => {
    e.stopPropagation();

    setSelectedLight(light);
    setSelectedMode(null);

    const lightKey = getLightKey(light);
    const savedModeId = selectedModeMap[lightKey];

    const restoreMode = (modes: Mode[] | undefined) => {
      if (savedModeId !== undefined && modes) {
        const savedMode = modes.find((mode) => mode.id === savedModeId);
        if (savedMode) {
          setSelectedMode(savedMode);
          if (!isFinalMode(light, savedMode)) {
            applyModeToLight(light, savedMode);
          }
        }
      }
    };

    if (!light.modes || light.modes.length === 0) {
      try {
        const metaPath = `/assets/stand${currentStand.id}/TrafficLight${light.id}.meta`;
        const metaData = await parseMetaFile(metaPath);

        light.modes = metaData.modes;
        light.ledMap = metaData.ledMap;
        light.name = metaData.name || light.name;

        setSelectedLight({ ...light });
        restoreMode(metaData.modes);
      } catch (error) {
        console.error('Failed to load modes:', error);
      }
    } else {
      restoreMode(light.modes);
    }
  };

  const handleModeClick = (mode: Mode) => {
    if (!selectedLight) return;

    const key = getLightKey(selectedLight);
    setSelectedModeMap((prev) => ({
      ...prev,
      [key]: mode.id,
    }));

    setSelectedMode(mode);
    if (!isFinalMode(selectedLight, mode)) {
      applyModeToLight(selectedLight, mode);
    }
  };

  const handleClearSelection = () => {
    setSelectedLight(null);
    setSelectedMode(null);
  };

  const handleExit = () => {
    setShowBlackScreen(true);

    setTimeout(() => {
      window.close();
    }, 500);
  };

  const renderLampClick = (light: Light, index: number) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!selectedLight || selectedLight.id !== light.id) {
        handleLightClick(light, e);
        return;
      }

      setSelectedMode(null);
      toggleLamp(light, index);
    };
  };

  if (showBlackScreen) {
    return <div className="black-screen" />;
  }

  return (
    <div className="app">
      <div className="main-panel">
        <div className="header">
          <h1>{selectedLight ? selectedLight.name : 'Выберите светофор'}</h1>
        </div>

        <div className="lights-area">
          <div
            className={`main-lights stand${currentStand.id} ${isTransitioning ? 'stand-transitioning' : ''}`}
            onClick={handleClearSelection}
          >
            {currentStand.mainLights.map((light) => {
              const activeIndexes = getActiveIndexes(light);
              const blinkingIndexes = getBlinkingIndexes(light);

              return (
                <div
                  key={light.id}
                  className={`light-item ${selectedLight?.id === light.id ? 'selected' : ''}`}
                  onClick={(e) => handleLightClick(light, e)}
                >
                  <img src={light.image} alt={light.name} className="traffic-light" />

                  {light.notActiveLamps?.map((lamp, index) => (
                    <img
                      key={`not-${light.id}-${index}`}
                      src={`/assets/ui/${lamp}`}
                      alt="not active"
                      className={`not-active-lamp lamp${index + 1}`}
                      onClick={renderLampClick(light, index)}
                    />
                  ))}

                  {light.activeLamps?.map((lamp, index) => ({ lamp, index }))
                    .filter(({ index }) => activeIndexes.includes(index))
                    .map(({ lamp, index }) => (
                      <img
                        key={`act-${light.id}-${index}`}
                        src={`/assets/ui/${lamp}`}
                        alt="active"
                        className={`active-lamp lamp${index + 1}`}
                      />
                    ))}

                  {light.activeLamps?.map((lamp, index) => ({ lamp, index }))
                    .filter(({ index }) => blinkingIndexes.includes(index) && blinkState)
                    .map(({ lamp, index }) => (
                      <img
                        key={`blink-${light.id}-${index}`}
                        src={`/assets/ui/${lamp}`}
                        alt="blinking"
                        className={`active-lamp lamp${index + 1}`}
                      />
                    ))}

                  {selectedLight?.id === light.id && <div className="highlight" />}
                </div>
              );
            })}
          </div>

          <div className={`preview-area stand${currentStand.id}`}>
            <div
              className={`preview-lights ${isTransitioning ? 'preview-transitioning' : ''}`}
              onClick={handleClearSelection}
            >
              {currentStand.previewLights.map((light) => {
                const activeIndexes = getActiveIndexes(light);
                const blinkingIndexes = getBlinkingIndexes(light);

                return (
                  <div
                    key={light.id}
                    className={`preview-light-item ${selectedLight?.id === light.id ? 'selected' : ''}`}
                    onClick={(e) => handleLightClick(light, e)}
                  >
                    <img src={light.image} alt={light.name} className="small-traffic-light" />

                    {light.notActiveLamps?.map((lamp, index) => (
                      <img
                        key={`preview-not-${light.id}-${index}`}
                        src={`/assets/ui/${lamp}`}
                        alt="not active"
                        className={`not-active-lamp lamp${index + 1}`}
                        onClick={renderLampClick(light, index)}
                      />
                    ))}

                    {light.activeLamps?.map((lamp, index) => ({ lamp, index }))
                      .filter(({ index }) => activeIndexes.includes(index))
                      .map(({ lamp, index }) => (
                        <img
                          key={`preview-act-${light.id}-${index}`}
                          src={`/assets/ui/${lamp}`}
                          alt="active"
                          className={`active-lamp lamp${index + 1}`}
                        />
                      ))}

                    {light.activeLamps?.map((lamp, index) => ({ lamp, index }))
                      .filter(({ index }) => blinkingIndexes.includes(index) && blinkState)
                      .map(({ lamp, index }) => (
                        <img
                          key={`preview-blink-${light.id}-${index}`}
                          src={`/assets/ui/${lamp}`}
                          alt="blinking"
                          className={`active-lamp lamp${index + 1}`}
                        />
                      ))}

                    {selectedLight?.id === light.id && <div className="highlight-small" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="scenario-wrapper">
          <div className="scenario-title">
          {selectedMode ? selectedMode.text : 'Режимы работы'}
        </div>

          <div className="scenario">
            {selectedLight?.modes?.length ? (
              <div className="modes-list">
                {selectedLight.modes.map((mode) => (
                  <button
                    key={mode.id}
                    className={`mode-btn ${selectedMode?.id === mode.id ? 'active' : ''}`}
                    onClick={() => handleModeClick(mode)}
                  >
                    <span className="mode-text">{mode.number}. {mode.text}</span>
                  </button>
                ))}
              </div>
            ) : selectedLight ? (
              <div className="modes-info">Нет режимов для выбранного светофора</div>
            ) : (
              <div className="modes-info">Выберите светофор для просмотра режимов</div>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="stands-buttons">
          {standsData.map((stand) => (
            <button
              key={stand.id}
              className={`stand-btn ${currentStand.id === stand.id ? 'active' : ''}`}
              onClick={() => handleStandClick(stand)}
            >
              СТЕНД {stand.id}
            </button>
          ))}
        </div>

        <button className="exit-btn" onClick={handleExit}>
          ВЫХОД
        </button>
      </div>
    </div>
  );
}

export default App;