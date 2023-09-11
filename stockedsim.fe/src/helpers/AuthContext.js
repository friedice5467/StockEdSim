import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const storedToken = localStorage.getItem('token');
    const initialCurrentUser = storedToken ? jwtDecode(storedToken) : null;
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(initialCurrentUser ?
        {
        userId: initialCurrentUser.sub,
        email: initialCurrentUser.email,
        roles: initialCurrentUser.roles
        }
        : null);

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        navigate('/login');
    };

    useEffect(() => {
        if (initialCurrentUser && initialCurrentUser.exp && Date.now() >= initialCurrentUser.exp * 1000) {
            logout();
        }
    }, [initialCurrentUser]);

    const value = {
        currentUser,
        setCurrentUser,
        token: storedToken,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

