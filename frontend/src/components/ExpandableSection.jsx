import { useState } from 'react';

function ExpandableSection({ title, children, onToggle }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onToggle) onToggle(newState);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="expandable-section">
      <div className="card">
        {/* Clickable Header */}
        <div
          className="expandable-header card-header"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-expanded={isExpanded}
        >
          <h5 className="expandable-title">{title}</h5>
          <span className="expandable-arrow">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="expandable-content card-body">
            <div className="expandable-form">
              {typeof children === 'function' ? children(() => setIsExpanded(false)) : children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpandableSection;