import { useState } from 'react';
import standsData, { Stand, Light } from './data/standsData';
import './App.css';

function App() {
  const [currentStand, setCurrentStand] = useState<Stand>(standsData[0]);
  const [selectedLight, setSelectedLight] = useState<Light | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showBlackScreen, setShowBlackScreen] = useState(false);

  const handleStandClick = (stand: Stand) => {
    if (stand.id === currentStand.id) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStand(stand);
      setSelectedLight(null);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handleLightClick = (light: Light, e: React.MouseEvent) => {
    e.stopPropagation(); // не даём событию всплыть до родительских контейнеров
    setSelectedLight(light);
  };

  const handleClearSelection = () => {
    setSelectedLight(null);
  };

  const handleExit = () => {
    setShowBlackScreen(true);
    setTimeout(() => {
      window.close();
    }, 500); // небольшая задержка, чтобы показать чёрный экран
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

        <div className="scenario">
          Сценарий: <span>{selectedLight ? selectedLight.name : '—'}</span>
        </div>
      </div>

      <div className="sidebar">
        {standsData.map((stand) => (
          <button
            key={stand.id}
            className={`stand-btn ${currentStand.id === stand.id ? 'active' : ''}`}
            onClick={() => handleStandClick(stand)}
          >
            СТЕНД {stand.id}
          </button>
        ))}
        <button className="exit-btn" onClick={handleExit}>
          ВЫХОД
        </button>
      </div>
    </div>
  );
}

export default App;