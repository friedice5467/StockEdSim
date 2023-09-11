import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './helpers/AuthContext';
import reportWebVitals from './reportWebVitals';
import "tw-elements-react/dist/css/tw-elements-react.min.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
        <AuthProvider>
            <App />
        </AuthProvider>
    </Router>
);

reportWebVitals();