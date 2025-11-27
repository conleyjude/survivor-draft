/**
 * AdminDashboard - Central hub for all admin functions
 */

import { Link } from 'react-router-dom';
import '../../styles/AdminDashboard.css';

function AdminDashboard() {
  const adminSections = [
    {
      title: 'Seasons',
      description: 'Create and manage seasons',
      icon: '📅',
      link: '/admin/seasons',
    },
    {
      title: 'Tribes',
      description: 'Create and manage tribes within seasons',
      icon: '🏕️',
      link: '/admin/tribes',
    },
    {
      title: 'Players',
      description: 'Add and edit player information',
      icon: '👥',
      link: '/admin/players',
    },
    {
      title: 'Alliances',
      description: 'Create and manage player alliances',
      icon: '🤝',
      link: '/admin/alliances',
    },
    {
      title: 'Draft',
      description: 'Manage fantasy team draft and rosters',
      icon: '📋',
      link: '/admin/draft',
    },
    {
      title: 'Fantasy Teams',
      description: 'Create and edit fantasy teams',
      icon: '🎯',
      link: '/admin/fantasy-teams',
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Manage all aspects of the Survivor Fantasy Draft</p>
      </div>

      <div className="admin-sections">
        {adminSections.map((section) => (
          <Link key={section.link} to={section.link} className="admin-section-card">
            <div className="card-icon">{section.icon}</div>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <span className="arrow">→</span>
          </Link>
        ))}
      </div>

      <div className="admin-footer">
        <p>⚠️ Warning: Changes made in admin section affect the entire database</p>
        <Link to="/">Back to Public View</Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
