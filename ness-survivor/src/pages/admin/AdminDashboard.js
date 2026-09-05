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
      icon: '01',
      link: '/admin/seasons',
    },
    {
      title: 'Tribes',
      description: 'Create and manage tribes within seasons',
      icon: '02',
      link: '/admin/tribes',
    },
    {
      title: 'Players',
      description: 'Add and edit player information',
      icon: '03',
      link: '/admin/players',
    },
    {
      title: 'Alliances',
      description: 'Create and manage player alliances',
      icon: '04',
      link: '/admin/alliances',
    },
    {
      title: 'Draft',
      description: 'Manage fantasy team draft and rosters',
      icon: '05',
      link: '/admin/draft',
    },
    {
      title: 'Fantasy Teams',
      description: 'Create and edit fantasy teams',
      icon: '06',
      link: '/admin/fantasy-teams',
    },
    {
      title: 'Eliminations',
      description: 'Mark players as eliminated and manage reserves',
      icon: '07',
      link: '/admin/eliminations',
    },
    {
      title: 'Database Verification',
      description: 'Test database connectivity and CRUD operations',
      icon: '08',
      link: '/admin/database-verification',
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
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
        <p>Warning: changes made in the admin section affect the entire database</p>
        <Link to="/">Back to Public View</Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
