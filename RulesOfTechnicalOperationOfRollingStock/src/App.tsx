import { useState } from 'react';
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

  const getLightKey = (light: Light, standId: number = currentStand.id) => `${standId}-${light.id}-${light.image}`;

  const getActiveIndexes = (light: Light) => {
    return activeLampMap[getLightKey(light)] || [];
  };

  const toggleLamp = (light: Light, index: number) => {
    const key = getLightKey(light);

    setActiveLampMap((prev) => {
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index],
      };
    });
  };

  const getModeActiveLampIndexes = (light: Light, mode: Mode): number[] => {
    if (mode.activeLampIndexes && mode.activeLampIndexes.length > 0) {
      return mode.activeLampIndexes;
    }

    if (mode.ledIds && light.ledMap) {
      return mode.ledIds.flatMap((ledId) => light.ledMap?.[ledId] ?? []);
    }

    return [];
  };

  const applyModeToLight = (light: Light, mode: Mode) => {
    const key = getLightKey(light);
    const activeIndexes = getModeActiveLampIndexes(light, mode);

    setActiveLampMap((prev) => ({
      ...prev,
      [key]: activeIndexes,
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
          applyModeToLight(light, savedMode);
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
    applyModeToLight(selectedLight, mode);
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