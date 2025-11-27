import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { initDriver, closeDriver } from './config/neo4jConfig';

// Page components - to be created
import Dashboard from './pages/Dashboard';
import SeasonView from './pages/views/SeasonView';
import PlayerDetail from './pages/views/PlayerDetail';
import FantasyTeamView from './pages/views/FantasyTeamView';
import Leaderboard from './pages/views/Leaderboard';

// Admin page components - to be created
import SeasonManager from './pages/admin/SeasonManager';
import TribeManager from './pages/admin/TribeManager';
import PlayerManager from './pages/admin/PlayerManager';
import AllianceManager from './pages/admin/AllianceManager';
import DraftManager from './pages/admin/DraftManager';
import FantasyTeamManager from './pages/admin/FantasyTeamManager';
import DatabaseVerification from './pages/admin/DatabaseVerification';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  useEffect(() => {
    let isMounted = true;
    const setupDriver = async () => {
      try {
        console.log('App: Initializing Neo4j driver...');
        await initDriver();
        if (isMounted) {
          console.log('App: Neo4j driver initialized successfully');
        }
      } catch (err) {
        if (isMounted) {
          console.error('App: Failed to initialize Neo4j driver:', err);
        }
      }
    };

    setupDriver();

    // Return cleanup function
    return () => {
      isMounted = false;
      // Don't close driver on unmount in StrictMode - it causes issues
      // Only close on actual app shutdown
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <nav className="App-nav">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              🏝️ Survivor Draft Manager
            </Link>
            <ul className="nav-menu">
              <li><Link to="/">Dashboard</Link></li>
              <li className="nav-submenu">
                <span>Views</span>
                <ul className="nav-submenu-list">
                  <li><Link to="/seasons">Seasons</Link></li>
                  <li><Link to="/leaderboard">Leaderboard</Link></li>
                </ul>
              </li>
              <li className="nav-submenu">
                <span>Admin</span>
                <ul className="nav-submenu-list">
                  <li><Link to="/admin">Dashboard</Link></li>
                  <li><Link to="/admin/seasons">Manage Seasons</Link></li>
                  <li><Link to="/admin/tribes">Manage Tribes</Link></li>
                  <li><Link to="/admin/players">Manage Players</Link></li>
                  <li><Link to="/admin/alliances">Manage Alliances</Link></li>
                  <li><Link to="/admin/draft">Manage Draft</Link></li>
                  <li><Link to="/admin/fantasy-teams">Manage Fantasy Teams</Link></li>
                  <li><Link to="/admin/database-verification">Database Verification</Link></li>
                </ul>
              </li>
            </ul>
          </div>
        </nav>

        <main className="App-main">
          <Routes>
            {/* Public View Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/seasons/:seasonId" element={<SeasonView />} />
            <Route path="/players/:firstName/:lastName" element={<PlayerDetail />} />
            <Route path="/teams/:teamName" element={<FantasyTeamView />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/seasons" element={<SeasonManager />} />
            <Route path="/admin/tribes" element={<TribeManager />} />
            <Route path="/admin/players" element={<PlayerManager />} />
            <Route path="/admin/alliances" element={<AllianceManager />} />
            <Route path="/admin/draft" element={<DraftManager />} />
            <Route path="/admin/fantasy-teams" element={<FantasyTeamManager />} />
            <Route path="/admin/database-verification" element={<DatabaseVerification />} />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="App-footer">
          <p>&copy; 2024 Survivor Fantasy Draft. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

/**
 * Simple 404 Not Found page
 */
function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">Return to Dashboard</Link>
    </div>
  );
}

export default App;
