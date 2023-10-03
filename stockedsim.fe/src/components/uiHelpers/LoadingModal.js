import React from 'react';
import './LoadingModal.css';

const LoadingModal = () => {
    return (
        <div className="loading-modal-backdrop">
            <div className="loading-modal-content">
                <div className="loading-spinner"></div>
                <h5 className="mt-3">Loading...</h5>
            </div>
        </div>
    );
};

export default LoadingModal;