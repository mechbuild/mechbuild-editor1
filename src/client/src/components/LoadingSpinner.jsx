import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = '#007bff', fullScreen = false }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: '20px', height: '20px', border: '2px' };
      case 'large':
        return { width: '50px', height: '50px', border: '5px' };
      default:
        return { width: '35px', height: '35px', border: '4px' };
    }
  };

  const spinnerSize = getSize();
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <div style={containerStyle}>
      <div
        style={{
          ...styles.spinner,
          width: spinnerSize.width,
          height: spinnerSize.height,
          borderWidth: spinnerSize.border,
          borderTopColor: color,
        }}
      />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  fullScreenContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default LoadingSpinner; 