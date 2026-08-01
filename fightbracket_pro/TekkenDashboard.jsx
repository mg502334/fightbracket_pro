import React, { useState, useEffect, useRef } from 'react';
import { TekkenDataSyncer, fetchFromEwgf } from './ewgfApi'; // Imports File 1

export default function TekkenDashboard({ tekkenId = "3YrtMtjNqqBn" }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [syncStatus, setSyncStatus] = useState("Idle");
  const [errorMessage, setErrorMessage] = useState(null);
  const syncerRef = useRef(null);

  useEffect(() => {
    // Setup the sync engine
    syncerRef.current = new TekkenDataSyncer(
      tekkenId,
      (freshData) => {
        setDashboardData(freshData);
        setSyncStatus(`Synced at ${freshData.lastSyncedAt}`);
        setErrorMessage(null);
      },
      (errorMsg) => {
        setErrorMessage(errorMsg);
        setSyncStatus("Sync Error");
      }
    );

    // Auto sync every 60 seconds
    syncerRef.current.startAutoSync(60000);

    return () => syncerRef.current.stopAutoSync();
  }, [tekkenId]);

  const handleManualSync = async () => {
    setSyncStatus("Syncing...");
    await syncerRef.current.executeSync();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Tekken 8 Stats Sync</h2>
        <div>
          <span style={{ marginRight: '10px', color: '#666' }}>{syncStatus}</span>
          <button onClick={handleManualSync} disabled={syncStatus === "Syncing..."}>
            {syncStatus === "Syncing..." ? "Updating..." : "Sync Now"}
          </button>
        </div>
      </header>

      {errorMessage && <div style={{ color: 'red', margin: '10px 0' }}>⚠ {errorMessage}</div>}

      {dashboardData ? (
        <main>
          <p style={{ color: '#888' }}>
            Daily API Requests Left: {dashboardData.meta.rate_limit_remaining} ({dashboardData.meta.tier} tier)
          </p>
          
          <h3>Latest Matches</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {dashboardData.matches.slice(0, 5).map((match, i) => (
              <li key={i} style={{ 
                padding: '10px', 
                borderBottom: '1px solid #ccc',
                color: match.result === 'WIN' ? 'green' : 'red'
              }}>
                <strong>{match.player_character}</strong> vs <strong>{match.opponent_character}</strong> — {match.result}
              </li>
            ))}
          </ul>
        </main>
      ) : (
        <p>Connecting to Tekken servers and syncing player logs...</p>
      )}
    </div>
  );
}
