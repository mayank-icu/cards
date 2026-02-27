import React from 'react';
import './UnsavedChangesModal.css';

const UnsavedChangesModal = ({ isOpen, onStay, onDiscard }) => {
  if (!isOpen) return null;

  return (
    <div className="unsaved-modal-overlay" onClick={onStay}>
      <div className="unsaved-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Unsaved changes</h3>
        <p>You have edits that aren’t saved. Do you want to discard them and go back?</p>
        <div className="unsaved-modal-actions">
          <button type="button" className="unsaved-stay-btn" onClick={onStay}>
            Stay
          </button>
          <button type="button" className="unsaved-discard-btn" onClick={onDiscard}>
            Discard & Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesModal;
