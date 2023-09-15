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
            userId: initialCurrentUser["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            email: initialCurrentUser.email,
            role: initialCurrentUser["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            userClasses: initialCurrentUser.userClasses
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
        // eslint-disable-next-line
    }, [initialCurrentUser]);

    const value = {
        currentUser,
        setCurrentUser,
        token: storedToken,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

