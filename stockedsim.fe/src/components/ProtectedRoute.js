import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../helpers/AuthContext';

function ProtectedRoute() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: location } });
        }
    }, [token, navigate, location]);

    console.log(token);

    return token ? <Outlet /> : null;
}

export default ProtectedRoute;