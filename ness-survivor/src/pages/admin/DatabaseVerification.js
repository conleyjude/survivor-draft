/**
 * DatabaseVerification - Test and verify database connectivity and operations
 * This page helps diagnose whether database operations are working correctly
 */

import { useState } from 'react';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/DatabaseVerification.css';

function DatabaseVerification() {
  const [verificationResults, setVerificationResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Add a verification result to the list
  const addResult = (testName, status, message, timestamp = new Date()) => {
    setVerificationResults(prev => [{
      id: Date.now() + Math.random(),
      testName,
      status, // 'pending', 'success', 'error'
      message,
      timestamp,
    }, ...prev]);
  };

  // Run all verification tests
  const runAllTests = async () => {
    setIsRunning(true);
    setVerificationResults([]);

    try {
      // Test 1: Check if we can fetch seasons
      addResult('Fetch All Seasons', 'pending', 'Running...');
      try {
        const seasons = await neo4jService.getAllSeasons();
        addResult(
          'Fetch All Seasons',
          'success',
          `Successfully fetched ${seasons?.length || 0} seasons from database`
        );
      } catch (err) {
        addResult('Fetch All Seasons', 'error', `Error: ${err.message}`);
      }

      // Test 2: Create a test season
      addResult('Create Test Season', 'pending', 'Running...');
      const testSeasonNum = 999;
      const testYear = new Date().getFullYear();
      try {
        const result = await neo4jService.createSeason(testSeasonNum, testYear);
        if (result) {
          addResult(
            'Create Test Season',
            'success',
            `✓ Successfully created test Season ${testSeasonNum} (${testYear}) - Database WRITE confirmed!`
          );
        } else {
          addResult('Create Test Season', 'error', 'Season created but returned null');
        }
      } catch (err) {
        addResult('Create Test Season', 'error', `Error: ${err.message}`);
      }

      // Test 3: Verify the created season can be read back
      addResult('Read Back Test Season', 'pending', 'Running...');
      try {
        const seasons = await neo4jService.getAllSeasons();
        const testSeason = seasons?.find(s => s.season_number === testSeasonNum);
        if (testSeason) {
          addResult(
            'Read Back Test Season',
            'success',
            `✓ Successfully read back test season - Confirmed season exists in database!`
          );
        } else {
          addResult(
            'Read Back Test Season',
            'error',
            'Test season was not found in database after creation'
          );
        }
      } catch (err) {
        addResult('Read Back Test Season', 'error', `Error: ${err.message}`);
      }

      // Test 4: Delete the test season
      addResult('Delete Test Season', 'pending', 'Running...');
      try {
        await neo4jService.deleteSeason(testSeasonNum);
        addResult(
          'Delete Test Season',
          'success',
          `✓ Successfully deleted test season - Database DELETE confirmed!`
        );
      } catch (err) {
        addResult('Delete Test Season', 'error', `Error: ${err.message}`);
      }

      // Test 5: Verify deletion
      addResult('Verify Test Season Deleted', 'pending', 'Running...');
      try {
        const seasons = await neo4jService.getAllSeasons();
        const testSeason = seasons?.find(s => s.season_number === testSeasonNum);
        if (!testSeason) {
          addResult(
            'Verify Test Season Deleted',
            'success',
            `✓ Confirmed test season was deleted from database`
          );
        } else {
          addResult(
            'Verify Test Season Deleted',
            'error',
            'Test season still exists in database after deletion'
          );
        }
      } catch (err) {
        addResult('Verify Test Season Deleted', 'error', `Error: ${err.message}`);
      }

    } finally {
      setIsRunning(false);
    }
  };

  // Clear results
  const clearResults = () => {
    setVerificationResults([]);
  };

  // Get summary statistics
  const summary = {
    total: verificationResults.length,
    success: verificationResults.filter(r => r.status === 'success').length,
    error: verificationResults.filter(r => r.status === 'error').length,
    pending: verificationResults.filter(r => r.status === 'pending').length,
  };

  const allTestsPassed = summary.error === 0 && summary.success > 0;

  return (
    <div className="database-verification">
      <div className="verification-header">
        <h1>🔍 Database Verification</h1>
        <p className="header-subtitle">Test database connectivity and verify CRUD operations</p>
      </div>

      {/* Tabs */}
      <div className="verification-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          📝 Results ({verificationResults.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          📖 Guide
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <section className="verification-section">
              <h2>🚀 Quick Verification Test</h2>
              <p className="section-description">
                Click the button below to run a comprehensive database connectivity test.
                This will create a test season, verify it was saved, read it back, and then delete it.
              </p>

              <div className="action-buttons">
                <button
                  className="btn btn-primary btn-large"
                  onClick={runAllTests}
                  disabled={isRunning}
                >
                  {isRunning ? '⏳ Running Tests...' : '▶️ Run Database Tests'}
                </button>
                {verificationResults.length > 0 && (
                  <button
                    className="btn btn-secondary"
                    onClick={clearResults}
                    disabled={isRunning}
                  >
                    🗑️ Clear Results
                  </button>
                )}
              </div>

              {/* Status Summary */}
              {verificationResults.length > 0 && (
                <div className={`status-summary ${allTestsPassed ? 'passed' : 'failed'}`}>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <div className="summary-label">Total Tests</div>
                      <div className="summary-value">{summary.total}</div>
                    </div>
                    <div className="summary-item success">
                      <div className="summary-label">✓ Passed</div>
                      <div className="summary-value">{summary.success}</div>
                    </div>
                    <div className="summary-item error">
                      <div className="summary-label">✕ Failed</div>
                      <div className="summary-value">{summary.error}</div>
                    </div>
                    {summary.pending > 0 && (
                      <div className="summary-item pending">
                        <div className="summary-label">⏳ Pending</div>
                        <div className="summary-value">{summary.pending}</div>
                      </div>
                    )}
                  </div>
                  <div className="summary-message">
                    {allTestsPassed ? (
                      <>
                        <span className="checkmark">✓</span>
                        All database operations are working correctly!
                      </>
                    ) : (
                      <>
                        <span className="x-mark">✕</span>
                        Some database operations failed. Check the results below.
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="results-tab">
            <section className="verification-section">
              <h2>📝 Test Results</h2>
              
              {verificationResults.length === 0 ? (
                <div className="no-results">
                  <p>No tests have been run yet. Click "Run Database Tests" in the Overview tab to get started.</p>
                </div>
              ) : (
                <div className="results-list">
                  {verificationResults.map((result) => (
                    <div key={result.id} className={`result-item result-${result.status}`}>
                      <div className="result-header">
                        <div className="result-title">
                          <span className="status-icon">
                            {result.status === 'success' && '✓'}
                            {result.status === 'error' && '✕'}
                            {result.status === 'pending' && '⏳'}
                          </span>
                          <span className="test-name">{result.testName}</span>
                        </div>
                        <span className="result-timestamp">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="result-message">
                        {result.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Guide Tab */}
        {activeTab === 'guide' && (
          <div className="guide-tab">
            <section className="verification-section">
              <h2>📖 Database Verification Guide</h2>
              
              <div className="guide-content">
                <div className="guide-section">
                  <h3>🎯 What This Tool Does</h3>
                  <p>
                    The Database Verification tool helps you diagnose whether your database is properly configured
                    and whether CRUD (Create, Read, Update, Delete) operations are working correctly.
                  </p>
                </div>

                <div className="guide-section">
                  <h3>📊 Test Breakdown</h3>
                  <ul>
                    <li>
                      <strong>Fetch All Seasons:</strong> Tests if the database connection is working and can read data
                    </li>
                    <li>
                      <strong>Create Test Season:</strong> Tests if CREATE (write) operations work
                    </li>
                    <li>
                      <strong>Read Back Test Season:</strong> Tests if created data can be read immediately after creation
                    </li>
                    <li>
                      <strong>Delete Test Season:</strong> Tests if DELETE (write) operations work
                    </li>
                    <li>
                      <strong>Verify Test Season Deleted:</strong> Tests if the deletion was actually persisted
                    </li>
                  </ul>
                </div>

                <div className="guide-section">
                  <h3>✓ Expected Results</h3>
                  <p>
                    If all tests pass with a green status, your database is working correctly and all CRUD operations
                    should function properly in the admin tools.
                  </p>
                </div>

                <div className="guide-section">
                  <h3>✕ Troubleshooting Failures</h3>
                  <ul>
                    <li>
                      <strong>"Fetch All Seasons" fails:</strong> Your Neo4j database may be disconnected. Check your connection settings.
                    </li>
                    <li>
                      <strong>"Create Test Season" fails:</strong> Check that your Neo4j user has write permissions.
                    </li>
                    <li>
                      <strong>"Read Back" or "Verify Delete" fails:</strong> There may be a transaction isolation issue. Check Neo4j logs.
                    </li>
                  </ul>
                </div>

                <div className="guide-section">
                  <h3>💡 Tips</h3>
                  <ul>
                    <li>Run this test regularly to ensure your database remains healthy</li>
                    <li>If tests fail, check the browser console (F12) for detailed error messages</li>
                    <li>The test uses Season 999 which is automatically cleaned up after testing</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="verification-footer">
        <p>Last verified: {verificationResults.length > 0 ? verificationResults[0].timestamp.toLocaleString() : 'Never'}</p>
      </div>
    </div>
  );
}

export default DatabaseVerification;
