import React from 'react';
import ValentineForm from '../components/ValentineForm';
import toast from 'react-hot-toast';

const ValentineCreator = () => {
  const handleFormSubmit = (valentineId) => {
    const valentineUrl = `${window.location.origin}/valentine/${valentineId}`;
    navigator.clipboard.writeText(valentineUrl);
    toast.success('Valentine URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-pink-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <ValentineForm onSubmit={handleFormSubmit} />
      </div>
    </div>
  );
};

export default ValentineCreator;