import { useEffect } from 'react';
import './App.css';
import Players from './components/Players';
import { initDriver, closeDriver } from './config/neo4jConfig';

function App() {
  useEffect(() => {
    // Initialize Neo4j connection
    initDriver().catch(console.error);
    
    // Cleanup on component unmount
    return () => {
      closeDriver().catch(console.error);
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Survivor Draft Manager</h1>
        <Players seasonId="1" />
      </header>
    </div>
  );
}

export default App;
