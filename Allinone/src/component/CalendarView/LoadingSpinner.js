// LoadingSpinner.js
import React from 'react';
import { Spinner } from '@nextui-org/react'; // Make sure @nextui-org is installed

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spinner size="lg" color="primary" /> {/* Adjust size and color as needed */}
  </div>
);

export default LoadingSpinner;
