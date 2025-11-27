import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Breadcrumb.css';

/**
 * Breadcrumb Component
 * Navigation breadcrumb trail
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items {label, path, icon}
 * @param {boolean} [props.showHome=true] - Show home link
 * @returns {JSX.Element}
 */
const Breadcrumb = ({ items = [], showHome = true }) => {
  const navigate = useNavigate();

  const breadcrumbItems = showHome
    ? [{ label: 'Home', path: '/', icon: '🏠' }, ...items]
    : items;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {item.path ? (
              <button
                className="breadcrumb-link"
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ) : (
              <span className="breadcrumb-text">
                {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
