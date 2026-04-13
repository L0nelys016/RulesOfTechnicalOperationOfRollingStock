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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showBlackScreen, setShowBlackScreen] = useState(false);

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

    if (!light.modes || light.modes.length === 0) {
      try {
        const metaPath = `/assets/stand${currentStand.id}/TrafficLight${light.id}.meta`;
        const metaData = await parseMetaFile(metaPath);
        
        light.modes = metaData.modes;
        light.name = metaData.name || light.name;
        
        if (metaData.modes.length > 0) {
          setSelectedMode(metaData.modes[0]);
        }
      } catch (error) {
        console.error('Failed to load modes:', error);
      }
    } else {
      if (light.modes.length > 0) {
        setSelectedMode(light.modes[0]);
      }
    }
  };

  const handleModeClick = (mode: Mode) => {
    setSelectedMode(mode);
  };

  const handleClearSelection = () => {
    setSelectedLight(null);
  };

  const handleExit = () => {
    setShowBlackScreen(true);
    setTimeout(() => {
      window.close();
    }, 500);
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
            {currentStand.mainLights.map((light) => (
              <div
                key={light.id}
                className={`light-item ${selectedLight?.id === light.id ? 'selected' : ''}`}
                onClick={(e) => handleLightClick(light, e)}
              >
                <img src={light.image} alt={light.name} className="traffic-light" />
                {light.notActiveLamps && (
                  <>
                    {light.notActiveLamps.map((lamp, index) => (
                      <img
                        key={`not-${light.id}-${index}`}
                        src={`/assets/ui/${lamp}`}
                        alt="not active"
                        className={`not-active-lamp lamp${index + 1}`}
                      />
                    ))}
                    {selectedLight && selectedLight.id === light.id && light.activeLamps &&
                      light.activeLamps.map((lamp, index) => (
                        <img
                          key={`act-${light.id}-${index}`}
                          src={`/assets/ui/${lamp}`}
                          alt="active"
                          className={`active-lamp lamp${index + 1}`}
                        />
                      ))
                    }
                  </>
                )}
                {selectedLight?.id === light.id && <div className="highlight" />}
              </div>
            ))}
          </div>

          <div className={`preview-area stand${currentStand.id}`}>
            <div
              className={`preview-lights ${isTransitioning ? 'preview-transitioning' : ''}`}
              onClick={handleClearSelection}
            >
              {currentStand.previewLights.map((light) => (
                <div
                  key={light.id}
                  className={`preview-light-item ${selectedLight?.id === light.id ? 'selected' : ''}`}
                  onClick={(e) => handleLightClick(light, e)}
                >
                  <img src={light.image} alt={light.name} className="small-traffic-light" />
                  {light.notActiveLamps && (
                    <>
                      {light.notActiveLamps.map((lamp, index) => (
                        <img
                          key={`preview-not-${light.id}-${index}`}
                          src={`/assets/ui/${lamp}`}
                          alt="not active"
                          className={`not-active-lamp lamp${index + 1}`}
                        />
                      ))}
                      {selectedLight && selectedLight.id === light.id && light.activeLamps &&
                        light.activeLamps.map((lamp, index) => (
                          <img
                            key={`preview-act-${light.id}-${index}`}
                            src={`/assets/ui/${lamp}`}
                            alt="active"
                            className={`active-lamp lamp${index + 1}`}
                          />
                        ))
                      }
                    </>
                  )}
                  {selectedLight?.id === light.id && <div className="highlight-small" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="scenario-wrapper">
          <div className="scenario-title">
            Режимы работы
          </div>

          <div className="scenario">
            {selectedLight && selectedLight.modes && selectedLight.modes.length > 0 ? (
              <div className="modes-list">
                {selectedLight.modes.map((mode) => (
                  <button
                    key={mode.id}
                    className={`mode-btn ${selectedMode?.id === mode.id ? 'active' : ''}`}
                    onClick={() => handleModeClick(mode)}
                  >
                    <span className="mode-text">{mode.text}</span>
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