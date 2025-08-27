import { useEffect } from 'react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-2">
            <span className="text-danger" style={{ fontSize: '1.5rem' }}>⚠️</span>
            <h5 className="modal-title mb-0">{title}</h5>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="mb-0">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            ✕ Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            🗑️ Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;