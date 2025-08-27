import { useState, useRef } from 'react';

function HamburgerToggle({ label, children, onToggle, showNotification }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggle = () => {
    if (isAnimating) return; // Prevent double animation
    
    setIsAnimating(true);
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Show notification
    if (showNotification) {
      showNotification(`${label} ${newState ? 'opened' : 'closed'}`);
    }
    
    // Call parent callback
    if (onToggle) {
      onToggle(newState);
    }
    
    // Reset animation lock after animation completes
    setTimeout(() => setIsAnimating(false), 400);
  };

  const closeForm = () => {
    if (isOpen) {
      toggle();
    }
  };

  return (
    <div className="hamburger-toggle-container">
      {/* Hamburger Toggle Button */}
      <button 
        className="hamburger-toggle-btn"
        onClick={toggle}
        disabled={isAnimating}
      >
        {/* Animated Hamburger Icon */}
        <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
          <span className="hamburger-line line1"></span>
          <span className="hamburger-line line2"></span>
          <span className="hamburger-line line3"></span>
        </div>
        <span className="hamburger-label">{label}</span>
      </button>

      {/* Collapsible Form */}
      <div className={`hamburger-content ${isOpen ? 'open' : ''}`}>
        <div className="hamburger-form">
          {children && typeof children === 'function' ? children(closeForm) : children}
        </div>
      </div>
    </div>
  );
}

export default HamburgerToggle;