/**
 * DataExport.js
 * Export functionality for various data formats
 */

import { formatDate, formatPlayerName, formatNumber } from './formatters';
import { EXPORT_FORMATS } from './constants';

/**
 * Convert JSON data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} [headers] - Column headers (auto-detected if not provided)
 * @returns {string} CSV formatted string
 */
export const jsonToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return 'No data to export';
  }

  // Get headers from first object if not provided
  const cols = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = cols.map(col => `"${col}"`).join(',');
  
  // Create data rows
  const dataRows = data.map(row =>
    cols.map(col => {
      const value = row[col];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Export players to CSV
 * @param {Array} players - Player array
 * @returns {string} CSV string
 */
export const exportPlayersToCSV = (players) => {
  const data = players.map(p => ({
    'First Name': p.first_name,
    'Last Name': p.last_name,
    'Season': p.season_number,
    'Tribe': p.tribe_name,
    'Placement': p.placement,
    'Challenges Won': p.challenges_won || 0,
    'Votes Received': p.votes_received || 0,
    'Has Idol': p.has_idol ? 'Yes' : 'No',
    'Idols Played': p.idols_played || 0,
    'Occupation': p.occupation || '',
    'Age': p.age || '',
  }));

  return jsonToCSV(data);
};

/**
 * Export seasons to CSV
 * @param {Array} seasons - Season array
 * @returns {string} CSV string
 */
export const exportSeasonsToCSV = (seasons) => {
  const data = seasons.map(s => ({
    'Season Number': s.season_number,
    'Year': s.year,
    'Winner': s.winner_name || '',
    'Runner Up': s.runner_up_name || '',
    'Total Players': s.total_players || 0,
    'Total Alliances': s.total_alliances || 0,
  }));

  return jsonToCSV(data);
};

/**
 * Export fantasy teams to CSV
 * @param {Array} teams - Team array
 * @returns {string} CSV string
 */
export const exportTeamsToCSV = (teams) => {
  const data = teams.map(t => ({
    'Team Name': t.team_name,
    'Owner': t.owner || '',
    'Season': t.season_number,
    'Roster Size': t.roster?.length || 0,
    'Total Challenge Wins': t.totalChallengeWins || 0,
    'Total Votes Received': t.totalVotesReceived || 0,
    'Average Placement': t.averagePlacement || 'N/A',
  }));

  return jsonToCSV(data);
};

/**
 * Export leaderboard to CSV
 * @param {Array} leaderboard - Leaderboard data
 * @returns {string} CSV string
 */
export const exportLeaderboardToCSV = (leaderboard) => {
  const data = leaderboard.map((t, idx) => ({
    'Rank': idx + 1,
    'Team Name': t.team_name,
    'Owner': t.owner || '',
    'Challenge Wins': t.totalChallengeWins || 0,
    'Roster Size': t.roster?.length || 0,
    'Previous Wins': t.previous_wins || 0,
    'Total Score': (t.totalChallengeWins || 0) + (t.previous_wins || 0),
  }));

  return jsonToCSV(data);
};

/**
 * Export alliances to CSV
 * @param {Array} alliances - Alliance array
 * @returns {string} CSV string
 */
export const exportAlliancesToCSV = (alliances) => {
  const data = alliances.map(a => ({
    'Alliance Name': a.alliance_name,
    'Season': a.season_number,
    'Status': a.status || 'unknown',
    'Members': a.members?.length || 0,
    'Formation Episode': a.formation_episode || '',
    'Dissolution Episode': a.dissolution_episode || '',
    'Member Names': a.members?.map(m => `${m.first_name} ${m.last_name}`).join('; ') || '',
  }));

  return jsonToCSV(data);
};

/**
 * Create downloadable file
 * @param {string} content - File content
 * @param {string} filename - File name with extension
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType = 'text/csv') => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Export data with automatic file download
 * @param {string} dataType - Type of data (players, seasons, teams, leaderboard, alliances)
 * @param {Array} data - Data to export
 * @param {string} [format=csv] - Export format
 */
export const exportData = (dataType, data, format = 'csv') => {
  let csvContent = '';
  let timestamp = formatDate(new Date(), 'short').replace(/\//g, '-');
  
  switch (dataType) {
    case 'players':
      csvContent = exportPlayersToCSV(data);
      downloadFile(csvContent, `survivors-players-${timestamp}.csv`);
      break;
    
    case 'seasons':
      csvContent = exportSeasonsToCSV(data);
      downloadFile(csvContent, `survivors-seasons-${timestamp}.csv`);
      break;
    
    case 'teams':
      csvContent = exportTeamsToCSV(data);
      downloadFile(csvContent, `survivors-teams-${timestamp}.csv`);
      break;
    
    case 'leaderboard':
      csvContent = exportLeaderboardToCSV(data);
      downloadFile(csvContent, `survivors-leaderboard-${timestamp}.csv`);
      break;
    
    case 'alliances':
      csvContent = exportAlliancesToCSV(data);
      downloadFile(csvContent, `survivors-alliances-${timestamp}.csv`);
      break;
    
    default:
      console.error(`Unknown data type: ${dataType}`);
  }
};

/**
 * Export as JSON
 * @param {string} dataType - Type of data
 * @param {Array} data - Data to export
 */
export const exportAsJSON = (dataType, data) => {
  const timestamp = formatDate(new Date(), 'short').replace(/\//g, '-');
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `survivors-${dataType}-${timestamp}.json`, 'application/json');
};

/**
 * Create detailed report
 * @param {Object} summary - Summary data
 * @returns {string} Report content
 */
export const generateReport = (summary) => {
  const timestamp = formatDate(new Date(), 'full');
  
  let report = `
SURVIVOR FANTASY DRAFT REPORT
==============================

Generated: ${timestamp}

SUMMARY
-------
Total Seasons: ${summary.totalSeasons || 0}
Total Players: ${summary.totalPlayers || 0}
Total Alliances: ${summary.totalAlliances || 0}
Total Fantasy Teams: ${summary.totalTeams || 0}

STATISTICS
----------
Average Players per Season: ${summary.avgPlayersPerSeason || 'N/A'}
Most Common Tribe: ${summary.mostCommonTribe || 'N/A'}
Highest Scoring Team: ${summary.highestScoringTeam || 'N/A'}

TOP PERFORMERS
--------------
${summary.topPlayers?.map((p, i) => `${i + 1}. ${p.name} - ${p.score} points`).join('\n') || 'No data'}

TOP TEAMS
---------
${summary.topTeams?.map((t, i) => `${i + 1}. ${t.name} - ${t.wins} wins`).join('\n') || 'No data'}

END OF REPORT
`;

  return report;
};

/**
 * Export report as text
 * @param {Object} summary - Summary data
 */
export const exportReport = (summary) => {
  const timestamp = formatDate(new Date(), 'short').replace(/\//g, '-');
  const report = generateReport(summary);
  downloadFile(report, `survivors-report-${timestamp}.txt`, 'text/plain');
};

/**
 * Copy data to clipboard
 * @param {string} data - Data to copy
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (data) => {
  try {
    await navigator.clipboard.writeText(data);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

/**
 * Get export options for a data type
 * @param {string} dataType
 * @returns {Array}
 */
export const getExportOptions = (dataType) => {
  return [
    { label: 'CSV', value: 'csv', icon: '📊' },
    { label: 'JSON', value: 'json', icon: '{}' },
    { label: 'Report', value: 'report', icon: '📄' },
  ];
};

export default {
  jsonToCSV,
  exportPlayersToCSV,
  exportSeasonsToCSV,
  exportTeamsToCSV,
  exportLeaderboardToCSV,
  exportAlliancesToCSV,
  downloadFile,
  exportData,
  exportAsJSON,
  generateReport,
  exportReport,
  copyToClipboard,
  getExportOptions,
};
