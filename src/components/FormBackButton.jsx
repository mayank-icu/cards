import React from 'react';
import { ArrowLeft } from 'lucide-react';

const FormBackButton = ({ onClick, title = 'Back' }) => {
  return (
    <button type="button" className="form-back-button" onClick={onClick} aria-label={title} title={title}>
      <ArrowLeft size={20} />
    </button>
  );
};

export default FormBackButton;
